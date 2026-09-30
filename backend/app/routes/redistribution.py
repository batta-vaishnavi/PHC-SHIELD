from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PHC, Medicine, MedicineStock, RedistributionRecommendation
from app.schemas import RedistributionPlanResponse, RedistributionTransfer
from app.algorithms.redistribution import solve_redistribution_plan
from app.services.gemini_service import explain_redistribution_plan

router = APIRouter(prefix="/redistribution", tags=["Stock Redistribution"])

def _gather_inventory_nodes(db: Session) -> List[Dict[str, Any]]:
    stocks = db.query(MedicineStock).join(PHC).join(Medicine).all()
    nodes = []
    for s in stocks:
        nodes.append({
            "phc_id": s.phc_id,
            "phc_name": s.phc.name,
            "district": s.phc.district,
            "latitude": s.phc.latitude,
            "longitude": s.phc.longitude,
            "medicine_id": s.medicine_id,
            "medicine_name": s.medicine.name,
            "current_stock": s.current_stock,
            "daily_consumption": s.daily_consumption,
            "lead_time_days": s.medicine.lead_time_days,
            "min_stock_threshold": s.medicine.min_stock_threshold,
            "shelf_life_days": s.medicine.shelf_life_days,
            "cold_chain_required": s.medicine.cold_chain_required,
        })
    return nodes

@router.get("", response_model=RedistributionPlanResponse)
def get_redistribution_plan(db: Session = Depends(get_db)):
    nodes = _gather_inventory_nodes(db)
    if not nodes:
        return RedistributionPlanResponse(
            total_transfers=0,
            transfers=[],
            disclaimer="Human approval required. Never execute automatically.",
            surplus_nodes=0,
            shortage_nodes=0,
            message="Enter PHC stock and demand data to generate recommendations."
        )

    transfers_data = solve_redistribution_plan(nodes)
    
    transfers = [RedistributionTransfer(**t) for t in transfers_data]

    # Count nodes with surplus / shortage
    surplus_cnt = len(set(t.from_phc_id for t in transfers))
    shortage_cnt = len(set(t.to_phc_id for t in transfers))

    return RedistributionPlanResponse(
        total_transfers=len(transfers),
        transfers=transfers,
        disclaimer="Human clinical approval required prior to physical dispatch. All peer-to-peer transfers are non-executable recommendations.",
        surplus_nodes=surplus_cnt,
        shortage_nodes=shortage_cnt,
        ai_explanation=None,
        message=f"Generated {len(transfers)} balanced peer-to-peer redistribution recommendations." if transfers else "No inventory deficits requiring redistribution detected."
    )


@router.post("/generate", response_model=RedistributionPlanResponse)
def generate_and_explain_redistribution(db: Session = Depends(get_db)):
    nodes = _gather_inventory_nodes(db)
    if not nodes:
        return RedistributionPlanResponse(
            total_transfers=0,
            transfers=[],
            disclaimer="Human approval required. Never execute automatically.",
            surplus_nodes=0,
            shortage_nodes=0,
            message="Enter PHC stock and demand data to generate recommendations."
        )

    transfers_data = solve_redistribution_plan(nodes)
    transfers = [RedistributionTransfer(**t) for t in transfers_data]

    surplus_cnt = len(set(t.from_phc_id for t in transfers))
    shortage_cnt = len(set(t.to_phc_id for t in transfers))

    # Generate Gemini Explanation grounded on transfer items
    ai_text = explain_redistribution_plan(
        transfers=transfers_data,
        surplus_nodes_count=surplus_cnt,
        shortage_nodes_count=shortage_cnt
    )

    return RedistributionPlanResponse(
        total_transfers=len(transfers),
        transfers=transfers,
        disclaimer="Human clinical approval required prior to physical dispatch. All peer-to-peer transfers are non-executable recommendations.",
        surplus_nodes=surplus_cnt,
        shortage_nodes=shortage_cnt,
        ai_explanation=ai_text,
        message=f"Optimized {len(transfers)} transfer routes using OR-Tools Linear Solver."
    )
