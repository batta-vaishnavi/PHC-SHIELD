from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    PHC, Medicine, MedicineStock, Footfall,
    BedCapacity, StaffAttendance, HistoricalMedicineDemand,
    RiskAlert
)
from app.schemas import ForecastResponse, RiskResponse, RiskAlertOut
from app.algorithms.forecasting import train_and_forecast_demand
from app.algorithms.risk_assessment import calculate_stock_risk

router = APIRouter(tags=["Analytics & Dashboard"])

@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Aggregates high-level system KPIs. If DB is empty, flags has_data=False."""
    total_phcs = db.query(func.count(PHC.id)).scalar() or 0
    total_medicines = db.query(func.count(Medicine.id)).scalar() or 0
    total_stock_items = db.query(func.count(MedicineStock.id)).scalar() or 0
    
    # Critical PHCs (count distinct PHCs with HIGH risk alert)
    critical_phcs_count = db.query(func.count(func.distinct(RiskAlert.phc_id))).filter(RiskAlert.risk_level == "HIGH").scalar() or 0
    active_alerts_count = db.query(func.count(RiskAlert.id)).filter(RiskAlert.risk_level.in_(["HIGH", "MEDIUM"])).scalar() or 0

    # Total stock units
    total_stock_units = db.query(func.sum(MedicineStock.current_stock)).scalar()
    
    # Footfall total past 30 days
    total_footfall = db.query(func.sum(Footfall.patient_count)).scalar()

    # Bed availability
    total_beds = db.query(func.sum(BedCapacity.total_beds)).scalar()
    occupied_beds = db.query(func.sum(BedCapacity.occupied_beds)).scalar()
    available_beds = (total_beds - occupied_beds) if (total_beds is not None and occupied_beds is not None) else None

    # Staff attendance rate average
    staff_total_sum = db.query(func.sum(StaffAttendance.total_staff)).scalar()
    staff_pres_sum = db.query(func.sum(StaffAttendance.present_staff)).scalar()
    staff_attendance_pct = (staff_pres_sum / staff_total_sum * 100.0) if (staff_total_sum and staff_total_sum > 0 and staff_pres_sum is not None) else None

    has_data = (total_phcs > 0 or total_medicines > 0 or total_stock_items > 0)

    # Risk level breakdown
    high_alerts = db.query(func.count(RiskAlert.id)).filter(RiskAlert.risk_level == "HIGH").scalar() or 0
    med_alerts = db.query(func.count(RiskAlert.id)).filter(RiskAlert.risk_level == "MEDIUM").scalar() or 0
    low_alerts = db.query(func.count(RiskAlert.id)).filter(RiskAlert.risk_level == "LOW").scalar() or 0

    # Demo status check
    is_demo_active = (db.query(PHC).filter(PHC.is_demo == True).count() > 0)

    return {
        "has_data": has_data,
        "is_demo_active": is_demo_active,
        "total_phcs": total_phcs if has_data else None,
        "critical_phcs": critical_phcs_count if has_data else None,
        "total_stock_units": round(float(total_stock_units), 1) if total_stock_units is not None else None,
        "total_footfall": int(total_footfall) if total_footfall is not None else None,
        "total_beds": int(total_beds) if total_beds is not None else None,
        "available_beds": int(available_beds) if available_beds is not None else None,
        "bed_occupancy_pct": round(occupied_beds / total_beds * 100.0, 1) if (total_beds and total_beds > 0 and occupied_beds is not None) else None,
        "staff_attendance_pct": round(float(staff_attendance_pct), 1) if staff_attendance_pct is not None else None,
        "active_alerts": active_alerts_count if has_data else None,
        "alert_breakdown": {
            "high": high_alerts,
            "medium": med_alerts,
            "low": low_alerts
        }
    }


@router.get("/forecast/{phc_id}/{medicine_id}", response_model=ForecastResponse)
def get_demand_forecast(
    phc_id: str,
    medicine_id: int,
    horizon: int = Query(default=14, ge=7, le=30),
    db: Session = Depends(get_db)
):
    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found.")
    
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    # Query historical daily records
    hist_records = db.query(HistoricalMedicineDemand).filter(
        HistoricalMedicineDemand.phc_id == phc_id,
        HistoricalMedicineDemand.medicine_id == medicine_id
    ).order_by(HistoricalMedicineDemand.record_date.asc()).all()

    formatted_records = [
        {"date": r.record_date.strftime("%Y-%m-%d"), "demand": r.daily_demand}
        for r in hist_records
    ]

    forecast_res = train_and_forecast_demand(
        historical_records=formatted_records,
        horizon_days=horizon,
        min_records_required=14
    )

    return ForecastResponse(
        phc_id=phc.id,
        phc_name=phc.name,
        medicine_id=med.id,
        medicine_name=med.name,
        horizon_days=horizon,
        historical_count=forecast_res["historical_count"],
        mae=forecast_res["mae"],
        predicted_daily_demand=forecast_res["predicted_daily_demand"],
        forecast_points=forecast_res["forecast_points"],
        insufficient_data=forecast_res["insufficient_data"],
        message=forecast_res["message"]
    )


@router.get("/risk/{phc_id}/{medicine_id}", response_model=RiskResponse)
def get_stock_risk(phc_id: str, medicine_id: int, db: Session = Depends(get_db)):
    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found.")
    
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    stock_row = db.query(MedicineStock).filter(
        MedicineStock.phc_id == phc_id,
        MedicineStock.medicine_id == medicine_id
    ).first()

    current_stock = stock_row.current_stock if stock_row else 0.0
    daily_rate = stock_row.daily_consumption if stock_row else 0.0

    risk_eval = calculate_stock_risk(
        current_stock=current_stock,
        predicted_daily_demand=daily_rate,
        min_stock_threshold=med.min_stock_threshold,
        lead_time_days=med.lead_time_days,
        base_date=date.today()
    )

    return RiskResponse(
        phc_id=phc.id,
        phc_name=phc.name,
        district=phc.district,
        state=phc.state,
        medicine_id=med.id,
        medicine_name=med.name,
        current_stock=current_stock,
        predicted_daily_demand=daily_rate,
        min_stock_threshold=med.min_stock_threshold,
        lead_time_days=med.lead_time_days,
        coverage_days=risk_eval["coverage_days"],
        expected_stockout_date=risk_eval["expected_stockout_date"],
        risk_level=risk_eval["risk_level"],
        reason=risk_eval["reason"],
        ai_explanation=None
    )


@router.get("/alerts", response_model=List[RiskAlertOut])
def list_risk_alerts(
    risk_level: Optional[str] = None, # HIGH or MEDIUM
    phc_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RiskAlert)
    if risk_level:
        query = query.filter(RiskAlert.risk_level == risk_level.upper())
    if phc_id:
        query = query.filter(RiskAlert.phc_id == phc_id)
    
    alerts = query.order_by(RiskAlert.created_at.desc()).all()
    results = []
    for a in alerts:
        results.append(RiskAlertOut(
            id=a.id,
            phc_id=a.phc_id,
            phc_name=a.phc.name if a.phc else a.phc_id,
            district=a.phc.district if a.phc else "—",
            medicine_id=a.medicine_id,
            medicine_name=a.medicine.name if a.medicine else f"Medicine {a.medicine_id}",
            risk_level=a.risk_level,
            coverage_days=a.coverage_days,
            expected_stockout_date=a.expected_stockout_date,
            calculated_reason=a.calculated_reason,
            ai_explanation=a.ai_explanation,
            created_at=a.created_at,
            is_demo=a.is_demo
        ))
    return results
