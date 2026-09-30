from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import PHC, HistoricalMedicineDemand, MedicineStock
from app.schemas import FederatedStatusResponse
from app.algorithms.federated import run_federated_averaging_simulation

router = APIRouter(prefix="/federated", tags=["Federated AI Learning"])

def _build_district_training_data(db: Session) -> Dict[str, List[Dict[str, Any]]]:
    # Group historical records or stocks by PHC -> district
    phcs = db.query(PHC).all()
    phc_district_map = {p.id: p.district for p in phcs}

    hist_records = db.query(HistoricalMedicineDemand).all()
    
    district_data_map: Dict[str, List[Dict[str, Any]]] = {}

    if hist_records:
        for r in hist_records:
            dist = phc_district_map.get(r.phc_id, "Unknown")
            dow = r.record_date.weekday()
            district_data_map.setdefault(dist, []).append({
                "demand": r.daily_demand,
                "day_of_week": dow,
                "trend": len(district_data_map.get(dist, [])),
                "lag_1": max(0.0, r.daily_demand - 1.0),
                "lag_7": r.daily_demand,
                "rolling_mean_7": r.daily_demand
            })
    else:
        # Fallback to current stocks if no historical log yet
        stocks = db.query(MedicineStock).all()
        for s in stocks:
            dist = phc_district_map.get(s.phc_id, "Unknown")
            district_data_map.setdefault(dist, []).append({
                "demand": s.daily_consumption,
                "day_of_week": 2,
                "trend": 1,
                "lag_1": s.daily_consumption,
                "lag_7": s.daily_consumption,
                "rolling_mean_7": s.daily_consumption
            })

    return district_data_map


@router.get("/status", response_model=FederatedStatusResponse)
def get_federated_status(db: Session = Depends(get_db)):
    district_data = _build_district_training_data(db)
    districts = [d for d, records in district_data.items() if len(records) >= 2]
    
    if len(districts) < 2:
        return FederatedStatusResponse(
            status="INSUFFICIENT_DATA",
            total_districts=len(districts),
            min_districts_required=2,
            can_train=False,
            message="Add district data to start federated analysis.",
            districts=districts,
            rounds_completed=0,
            global_mae=None,
            global_r2=None,
            district_metrics=[],
            training_steps=[
                "1. Sourcing District Silo Data",
                "2. Local Gradient Computation",
                "3. Secure Parameter Sharing",
                "4. Federated Averaging (FedAvg)",
                "5. Dispatched Global Model"
            ],
            privacy_notice="Raw healthcare data remains local; only model updates are shared."
        )

    # Run quick evaluation
    sim_result = run_federated_averaging_simulation(district_data, rounds=5)
    return FederatedStatusResponse(**sim_result)


@router.post("/train", response_model=FederatedStatusResponse)
def trigger_federated_training(rounds: int = 5, db: Session = Depends(get_db)):
    district_data = _build_district_training_data(db)
    sim_result = run_federated_averaging_simulation(district_data, rounds=rounds)
    return FederatedStatusResponse(**sim_result)
