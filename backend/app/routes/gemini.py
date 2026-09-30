from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PHC, Medicine, MedicineStock, RiskAlert
from app.schemas import GeminiAssistantRequest, GeminiAssistantResponse
from app.algorithms.risk_assessment import calculate_stock_risk
from app.services.gemini_service import (
    explain_stockout_risk, explain_redistribution_plan,
    summarize_critical_phcs, answer_assistant_query
)

router = APIRouter(prefix="/gemini", tags=["Gemini AI Integration"])

@router.post("/explain-risk")
def explain_risk_endpoint(
    phc_id: str = Body(..., embed=True),
    medicine_id: int = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found.")
    
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    stock = db.query(MedicineStock).filter(
        MedicineStock.phc_id == phc_id,
        MedicineStock.medicine_id == medicine_id
    ).first()

    cur_stock = stock.current_stock if stock else 0.0
    daily_cons = stock.daily_consumption if stock else 0.0

    risk_eval = calculate_stock_risk(
        current_stock=cur_stock,
        predicted_daily_demand=daily_cons,
        min_stock_threshold=med.min_stock_threshold,
        lead_time_days=med.lead_time_days
    )

    explanation = explain_stockout_risk(
        phc_name=phc.name,
        district=phc.district,
        medicine_name=med.name,
        stock=cur_stock,
        predicted_demand=daily_cons,
        coverage_days=risk_eval["coverage_days"],
        lead_time=med.lead_time_days,
        min_threshold=med.min_stock_threshold,
        risk_level=risk_eval["risk_level"],
        calculated_reason=risk_eval["reason"]
    )

    return {
        "phc_id": phc.id,
        "phc_name": phc.name,
        "medicine_id": med.id,
        "medicine_name": med.name,
        "risk_level": risk_eval["risk_level"],
        "explanation": explanation,
        "disclaimer": "AI-generated explanation based on available data. Verify before operational use."
    }


@router.post("/summary")
def get_critical_summary(db: Session = Depends(get_db)):
    high_alerts = db.query(RiskAlert).filter(RiskAlert.risk_level == "HIGH").all()
    
    data_items = []
    for a in high_alerts:
        data_items.append({
            "phc_name": a.phc.name if a.phc else a.phc_id,
            "district": a.phc.district if a.phc else "—",
            "medicine_name": a.medicine.name if a.medicine else f"Medicine {a.medicine_id}",
            "current_stock": a.coverage_days,
            "coverage_days": a.coverage_days,
            "lead_time_days": a.medicine.lead_time_days if a.medicine else 7
        })

    summary_text = summarize_critical_phcs(data_items)
    return {
        "critical_count": len(high_alerts),
        "summary": summary_text,
        "disclaimer": "AI-generated explanation based on available data. Verify before operational use."
    }


@router.post("/assistant", response_model=GeminiAssistantResponse)
def ask_ai_assistant(
    payload: GeminiAssistantRequest,
    db: Session = Depends(get_db)
):
    # Collect live DB context
    phcs = db.query(PHC).all()
    stocks = db.query(MedicineStock).all()
    alerts = db.query(RiskAlert).filter(RiskAlert.risk_level.in_(["HIGH", "MEDIUM"])).all()

    context_data = {
        "total_phcs": len(phcs),
        "phc_list": [{"id": p.id, "name": p.name, "district": p.district} for p in phcs[:10]],
        "active_alerts_count": len(alerts),
        "critical_alerts": [
            {
                "phc_name": a.phc.name if a.phc else a.phc_id,
                "district": a.phc.district if a.phc else "—",
                "medicine": a.medicine.name if a.medicine else str(a.medicine_id),
                "risk_level": a.risk_level,
                "coverage_days": a.coverage_days,
                "reason": a.calculated_reason
            }
            for a in alerts[:10]
        ]
    }

    if payload.phc_id:
        target_phc = db.query(PHC).filter(PHC.id == payload.phc_id).first()
        if target_phc:
            target_stocks = db.query(MedicineStock).filter(MedicineStock.phc_id == payload.phc_id).all()
            context_data["target_phc_details"] = {
                "name": target_phc.name,
                "district": target_phc.district,
                "medicines": [
                    {"medicine": s.medicine.name if s.medicine else str(s.medicine_id), "stock": s.current_stock, "daily_consumption": s.daily_consumption}
                    for s in target_stocks
                ]
            }

    answer = answer_assistant_query(payload.question, context_data)

    return GeminiAssistantResponse(
        answer=answer,
        data_context_used={
            "phcs_available": len(phcs),
            "alerts_active": len(alerts),
            "focused_phc": payload.phc_id
        },
        disclaimer="AI-generated explanation based on available data. Verify before operational use."
    )
