from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PHC, Medicine, MedicineStock
from app.schemas import (
    EmergencySimulationRequest, EmergencySimulationResponse,
    RiskResponse, RedistributionPlanResponse, RedistributionTransfer
)
from app.algorithms.risk_assessment import calculate_stock_risk
from app.algorithms.redistribution import solve_redistribution_plan
from app.services.gemini_service import summarize_emergency_simulation

router = APIRouter(prefix="/emergency", tags=["Emergency Simulation"])

@router.post("/simulate", response_model=EmergencySimulationResponse)
def run_emergency_simulation(
    payload: EmergencySimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Executes in-memory emergency stress-test simulation.
    Strictly DOES NOT modify persistent database rows.
    """
    stocks = db.query(MedicineStock).join(PHC).join(Medicine).all()
    if not stocks:
        raise HTTPException(status_code=400, detail="No healthcare inventory data available to simulate.")

    multiplier = 1.0 + (payload.demand_increase_pct / 100.0)
    
    simulated_nodes = []
    simulated_alerts: List[RiskResponse] = []
    critical_phcs = set()
    shortage_medicines = set()

    for s in stocks:
        phc = s.phc
        med = s.medicine

        is_district_affected = (not payload.affected_districts) or (phc.district in payload.affected_districts)
        is_med_affected = (not payload.affected_medicine_ids) or (med.id in payload.affected_medicine_ids)

        effective_daily = s.daily_consumption * (multiplier if (is_district_affected and is_med_affected) else 1.0)

        # Risk calculation under simulated surge
        risk_info = calculate_stock_risk(
            current_stock=s.current_stock,
            predicted_daily_demand=effective_daily,
            min_stock_threshold=med.min_stock_threshold,
            lead_time_days=med.lead_time_days,
            base_date=date.today()
        )

        sim_risk = RiskResponse(
            phc_id=phc.id,
            phc_name=phc.name,
            district=phc.district,
            state=phc.state,
            medicine_id=med.id,
            medicine_name=med.name,
            current_stock=s.current_stock,
            predicted_daily_demand=round(effective_daily, 1),
            min_stock_threshold=med.min_stock_threshold,
            lead_time_days=med.lead_time_days,
            coverage_days=risk_info["coverage_days"],
            expected_stockout_date=risk_info["expected_stockout_date"],
            risk_level=risk_info["risk_level"],
            reason=f"[SIMULATION +{payload.demand_increase_pct}%] {risk_info['reason']}",
            ai_explanation=None
        )

        if risk_info["risk_level"] in ("HIGH", "MEDIUM"):
            simulated_alerts.append(sim_risk)
            if risk_info["risk_level"] == "HIGH":
                critical_phcs.add(phc.id)
                shortage_medicines.add(med.name)

        simulated_nodes.append({
            "phc_id": phc.id,
            "phc_name": phc.name,
            "district": phc.district,
            "latitude": phc.latitude,
            "longitude": phc.longitude,
            "medicine_id": med.id,
            "medicine_name": med.name,
            "current_stock": s.current_stock,
            "daily_consumption": effective_daily,
            "lead_time_days": med.lead_time_days,
            "min_stock_threshold": med.min_stock_threshold,
            "shelf_life_days": med.shelf_life_days,
            "cold_chain_required": med.cold_chain_required,
        })

    # Solve redistribution under simulated load
    sim_transfers_data = solve_redistribution_plan(simulated_nodes)
    sim_transfers = [RedistributionTransfer(**t) for t in sim_transfers_data]

    # Gemini Emergency Briefing
    gemini_brief = summarize_emergency_simulation(
        emergency_name=payload.emergency_name,
        demand_increase_pct=payload.demand_increase_pct,
        duration_days=payload.duration_days,
        affected_phcs_count=len(set(n["phc_id"] for n in simulated_nodes)),
        critical_count=len(critical_phcs),
        shortage_medicines_count=len(shortage_medicines),
        transfers_count=len(sim_transfers)
    )

    redis_plan = RedistributionPlanResponse(
        total_transfers=len(sim_transfers),
        transfers=sim_transfers,
        disclaimer="SIMULATED EMERGENCY SCENARIO — Human clinical approval required prior to real-world deployment.",
        surplus_nodes=len(set(t.from_phc_id for t in sim_transfers)),
        shortage_nodes=len(set(t.to_phc_id for t in sim_transfers)),
        ai_explanation=None,
        message=f"Emergency buffer optimization modeled {len(sim_transfers)} surge transfers."
    )

    return EmergencySimulationResponse(
        emergency_name=payload.emergency_name,
        demand_increase_pct=payload.demand_increase_pct,
        duration_days=payload.duration_days,
        affected_phcs_count=len(set(n["phc_id"] for n in simulated_nodes)),
        critical_phcs_count=len(critical_phcs),
        shortage_medicines_count=len(shortage_medicines),
        simulated_alerts=simulated_alerts,
        redistribution_plan=redis_plan,
        gemini_summary=gemini_brief,
        is_simulation=True
    )
