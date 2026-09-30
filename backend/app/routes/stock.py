from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MedicineStock, PHC, Medicine, RiskAlert
from app.schemas import MedicineStockCreate, MedicineStockUpdate, MedicineStockOut
from app.algorithms.risk_assessment import calculate_stock_risk

router = APIRouter(prefix="/stock", tags=["Medicine Stock"])

def _format_stock_out(s: MedicineStock) -> MedicineStockOut:
    days_rem = (s.current_stock / s.daily_consumption) if s.daily_consumption > 0 else None
    return MedicineStockOut(
        id=s.id,
        phc_id=s.phc_id,
        medicine_id=s.medicine_id,
        current_stock=s.current_stock,
        daily_consumption=s.daily_consumption,
        last_updated=s.last_updated,
        is_demo=s.is_demo,
        days_remaining=round(days_rem, 1) if days_rem is not None else None,
        medicine_name=s.medicine.name if s.medicine else None,
        medicine_category=s.medicine.category if s.medicine else None,
        medicine_unit=s.medicine.unit if s.medicine else None,
        phc_name=s.phc.name if s.phc else None,
        min_stock_threshold=s.medicine.min_stock_threshold if s.medicine else None,
        lead_time_days=s.medicine.lead_time_days if s.medicine else None,
        cold_chain_required=s.medicine.cold_chain_required if s.medicine else None
    )

@router.get("", response_model=List[MedicineStockOut])
def list_stock(
    phc_id: Optional[str] = None,
    medicine_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MedicineStock)
    if phc_id:
        query = query.filter(MedicineStock.phc_id == phc_id)
    if medicine_id:
        query = query.filter(MedicineStock.medicine_id == medicine_id)
    
    stocks = query.all()
    return [_format_stock_out(s) for s in stocks]

@router.post("", response_model=MedicineStockOut, status_code=201)
def add_or_update_stock(payload: MedicineStockCreate, db: Session = Depends(get_db)):
    phc = db.query(PHC).filter(PHC.id == payload.phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail=f"PHC '{payload.phc_id}' does not exist.")
    
    med = db.query(Medicine).filter(Medicine.id == payload.medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail=f"Medicine ID '{payload.medicine_id}' does not exist.")
    
    stock_entry = db.query(MedicineStock).filter(
        MedicineStock.phc_id == payload.phc_id,
        MedicineStock.medicine_id == payload.medicine_id
    ).first()

    if not stock_entry:
        stock_entry = MedicineStock(
            phc_id=payload.phc_id,
            medicine_id=payload.medicine_id,
            current_stock=payload.current_stock,
            daily_consumption=payload.daily_consumption,
            is_demo=False
        )
        db.add(stock_entry)
    else:
        stock_entry.current_stock = payload.current_stock
        stock_entry.daily_consumption = payload.daily_consumption
        stock_entry.last_updated = datetime.utcnow()

    # Recalculate Risk Alert
    risk_info = calculate_stock_risk(
        current_stock=payload.current_stock,
        predicted_daily_demand=payload.daily_consumption,
        min_stock_threshold=med.min_stock_threshold,
        lead_time_days=med.lead_time_days,
        base_date=date.today()
    )

    existing_alert = db.query(RiskAlert).filter(
        RiskAlert.phc_id == payload.phc_id,
        RiskAlert.medicine_id == payload.medicine_id
    ).first()

    if risk_info["risk_level"] in ("HIGH", "MEDIUM"):
        exp_date = datetime.strptime(risk_info["expected_stockout_date"], "%Y-%m-%d").date() if risk_info["expected_stockout_date"] else None
        if existing_alert:
            existing_alert.risk_level = risk_info["risk_level"]
            existing_alert.coverage_days = risk_info["coverage_days"] or 0.0
            existing_alert.expected_stockout_date = exp_date
            existing_alert.calculated_reason = risk_info["reason"]
        else:
            new_alert = RiskAlert(
                phc_id=payload.phc_id,
                medicine_id=payload.medicine_id,
                risk_level=risk_info["risk_level"],
                coverage_days=risk_info["coverage_days"] or 0.0,
                expected_stockout_date=exp_date,
                calculated_reason=risk_info["reason"],
                is_demo=False
            )
            db.add(new_alert)
    else:
        if existing_alert:
            db.delete(existing_alert)

    db.commit()
    db.refresh(stock_entry)
    return _format_stock_out(stock_entry)

@router.delete("/{stock_id}", status_code=204)
def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    stock_entry = db.query(MedicineStock).filter(MedicineStock.id == stock_id).first()
    if not stock_entry:
        raise HTTPException(status_code=404, detail="Stock record not found.")
    db.delete(stock_entry)
    db.commit()
    return None
