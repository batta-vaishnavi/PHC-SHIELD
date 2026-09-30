import random
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.models import (
    PHC, Medicine, MedicineStock, Footfall,
    BedCapacity, StaffAttendance, HistoricalMedicineDemand,
    RiskAlert, RedistributionRecommendation, FederatedModelRun
)
from app.algorithms.risk_assessment import calculate_stock_risk

def load_synthetic_demo_dataset(db: Session) -> Dict[str, Any]:
    """
    Generates realistic, deterministic synthetic demonstration data across multiple districts.
    All rows are strictly tagged with is_demo=True.
    Includes >20 days of daily historical records per PHC/medicine to empower ML forecasting,
    risk early warnings, OR-Tools redistribution, and multi-district Federated Learning simulations.
    """
    # Clear any existing demo data first to ensure clean state
    clear_demo_dataset(db)

    rng = random.Random(42)
    today = date.today()

    # 1. Define Primary Health Centres across 3 distinct districts
    phc_definitions = [
        # Pune District
        {"id": "PHC-PN-01", "name": "Shirur Primary Health Centre", "district": "Pune", "state": "Maharashtra", "lat": 18.8281, "lon": 74.3789},
        {"id": "PHC-PN-02", "name": "Haveli Community Health Clinic", "district": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
        {"id": "PHC-PN-03", "name": "Baramati Rural Health Post", "district": "Pune", "state": "Maharashtra", "lat": 18.1517, "lon": 74.5772},
        # Nashik District
        {"id": "PHC-NS-01", "name": "Dindori Tribal Health Outpost", "district": "Nashik", "state": "Maharashtra", "lat": 20.2036, "lon": 73.8315},
        {"id": "PHC-NS-02", "name": "Sinnar Regional PHC Hub", "district": "Nashik", "state": "Maharashtra", "lat": 19.8456, "lon": 73.9984},
        {"id": "PHC-NS-03", "name": "Niphad Primary Care Center", "district": "Nashik", "state": "Maharashtra", "lat": 20.0814, "lon": 74.1082},
        # Thane District
        {"id": "PHC-TH-01", "name": "Shahapur Coastal Rural PHC", "district": "Thane", "state": "Maharashtra", "lat": 19.4542, "lon": 73.3325},
        {"id": "PHC-TH-02", "name": "Murbad Forest Health Station", "district": "Thane", "state": "Maharashtra", "lat": 19.2500, "lon": 73.4000},
        {"id": "PHC-TH-03", "name": "Bhiwandi Sub-District Care Point", "district": "Thane", "state": "Maharashtra", "lat": 19.3002, "lon": 73.0635},
    ]

    phc_objs = []
    for p in phc_definitions:
        phc = PHC(
            id=p["id"],
            name=p["name"],
            district=p["district"],
            state=p["state"],
            country="India",
            latitude=p["lat"],
            longitude=p["lon"],
            is_demo=True
        )
        db.add(phc)
        phc_objs.append(phc)
    db.flush()

    # 2. Define Essential Healthcare Medicines
    medicine_definitions = [
        {"name": "Amoxicillin 500mg", "category": "Antibiotic", "unit": "strips", "min_threshold": 120.0, "lead_time": 7, "shelf_life": 730, "cold_chain": False},
        {"name": "Paracetamol 650mg", "category": "Analgesic & Antipyretic", "unit": "strips", "min_threshold": 200.0, "lead_time": 5, "shelf_life": 730, "cold_chain": False},
        {"name": "Rabies Vaccine (Purified)", "category": "Vaccine / Biologic", "unit": "vials", "min_threshold": 40.0, "lead_time": 10, "shelf_life": 365, "cold_chain": True},
        {"name": "Human Regular Insulin 100IU", "category": "Endocrine / Cold Chain", "unit": "vials", "min_threshold": 30.0, "lead_time": 8, "shelf_life": 365, "cold_chain": True},
        {"name": "Oral Rehydration Salts (ORS)", "category": "Electrolyte Solution", "unit": "packets", "min_threshold": 250.0, "lead_time": 4, "shelf_life": 1095, "cold_chain": False},
        {"name": "Normal Saline IV 500ml", "category": "IV Fluid", "unit": "bottles", "min_threshold": 80.0, "lead_time": 6, "shelf_life": 730, "cold_chain": False},
    ]

    med_objs = []
    for m in medicine_definitions:
        med = Medicine(
            name=m["name"],
            category=m["category"],
            unit=m["unit"],
            min_stock_threshold=m["min_threshold"],
            lead_time_days=m["lead_time"],
            shelf_life_days=m["shelf_life"],
            cold_chain_required=m["cold_chain"],
            is_demo=True
        )
        db.add(med)
        med_objs.append(med)
    db.flush()

    # 3. Create Beds, Staff, Inventory Stock, and 28 Days of Historical Demand & Footfall
    history_days = 28
    
    # We will engineer specific shortage and surplus situations to test redistribution and alerts!
    # E.g. PHC-PN-01 (Shortage on Rabies Vaccine), PHC-PN-02 (Surplus on Rabies Vaccine)
    # PHC-NS-01 (Shortage on Amoxicillin), PHC-NS-02 (Surplus on Amoxicillin)

    for phc in phc_objs:
        # Beds
        tot_beds = rng.randint(15, 40)
        occ_beds = rng.randint(5, tot_beds - 2)
        bed_entry = BedCapacity(
            phc_id=phc.id,
            total_beds=tot_beds,
            occupied_beds=occ_beds,
            is_demo=True
        )
        db.add(bed_entry)

        # Staff attendance for today and recent days
        tot_staff = rng.randint(12, 25)
        pres_staff = rng.randint(tot_staff - 3, tot_staff)
        staff_entry = StaffAttendance(
            phc_id=phc.id,
            record_date=today,
            total_staff=tot_staff,
            present_staff=pres_staff,
            absent_staff=tot_staff - pres_staff,
            is_demo=True
        )
        db.add(staff_entry)

        # Footfall for past 28 days
        for day_offset in range(history_days):
            rec_date = today - timedelta(days=(history_days - day_offset - 1))
            # Day-of-week variation (Mondays busier)
            dow_boost = 1.3 if rec_date.weekday() == 0 else (0.8 if rec_date.weekday() == 6 else 1.0)
            patient_cnt = int((rng.randint(45, 95) + day_offset * 0.4) * dow_boost)
            emer_cnt = int(patient_cnt * rng.uniform(0.1, 0.2))
            outp_cnt = patient_cnt - emer_cnt

            db.add(Footfall(
                phc_id=phc.id,
                record_date=rec_date,
                patient_count=patient_cnt,
                disease_category=rng.choice(["General Outpatient", "Respiratory Infection", "Vector-Borne / Fever", "Maternal Care"]),
                emergency_cases=emer_cnt,
                outpatient_cases=outp_cnt,
                is_demo=True
            ))

        # Medicine Stocks and 28-day historical consumption
        for med in med_objs:
            base_daily = rng.uniform(10.0, 25.0)
            if "Insulin" in med.name or "Rabies" in med.name:
                base_daily = rng.uniform(3.0, 8.0)
            elif "ORS" in med.name or "Paracetamol" in med.name:
                base_daily = rng.uniform(25.0, 45.0)

            # Generate historical daily demand records
            for day_offset in range(history_days):
                rec_date = today - timedelta(days=(history_days - day_offset - 1))
                noise = rng.uniform(0.85, 1.25)
                daily_dem = round(base_daily * noise, 1)

                db.add(HistoricalMedicineDemand(
                    phc_id=phc.id,
                    medicine_id=med.id,
                    record_date=rec_date,
                    daily_demand=daily_dem,
                    is_demo=True
                ))

            # Stock assignment:
            # Create clear shortage scenario in PHC-PN-01 (Amoxicillin & Rabies), PHC-NS-01 (Insulin & ORS)
            # Create clear surplus in PHC-PN-02, PHC-NS-02, PHC-TH-01
            daily_cons = round(base_daily, 1)
            lead_time = med.lead_time_days
            min_thresh = med.min_stock_threshold

            if phc.id == "PHC-PN-01" and ("Rabies" in med.name or "Amoxicillin" in med.name):
                # Critical shortage (< lead_time days)
                cur_stock = round(daily_cons * (lead_time - 4), 1)
                cur_stock = max(5.0, cur_stock)
            elif phc.id == "PHC-NS-01" and ("Insulin" in med.name or "ORS" in med.name):
                # Critical shortage
                cur_stock = round(min_thresh * 0.4, 1)
            elif phc.id in ("PHC-PN-02", "PHC-NS-02", "PHC-TH-01"):
                # Healthy Surplus (stock > lead_time * daily + min_thresh + buffer)
                cur_stock = round((daily_cons * (lead_time + 15)) + min_thresh + 150.0, 1)
            elif phc.id in ("PHC-TH-02", "PHC-PN-03"):
                # Moderate warning (< lead_time + 3 days)
                cur_stock = round(daily_cons * (lead_time + 1.5), 1)
            else:
                cur_stock = round((daily_cons * (lead_time + 8)) + min_thresh, 1)

            stock_row = MedicineStock(
                phc_id=phc.id,
                medicine_id=med.id,
                current_stock=cur_stock,
                daily_consumption=daily_cons,
                is_demo=True
            )
            db.add(stock_row)

            # Pre-evaluate and record RiskAlert if HIGH or MEDIUM
            risk_info = calculate_stock_risk(
                current_stock=cur_stock,
                predicted_daily_demand=daily_cons,
                min_stock_threshold=min_thresh,
                lead_time_days=lead_time,
                base_date=today
            )
            if risk_info["risk_level"] in ("HIGH", "MEDIUM"):
                alert = RiskAlert(
                    phc_id=phc.id,
                    medicine_id=med.id,
                    risk_level=risk_info["risk_level"],
                    coverage_days=risk_info["coverage_days"],
                    expected_stockout_date=datetime.strptime(risk_info["expected_stockout_date"], "%Y-%m-%d").date() if risk_info["expected_stockout_date"] else None,
                    calculated_reason=risk_info["reason"],
                    ai_explanation=None,
                    is_demo=True
                )
                db.add(alert)

    db.commit()
    return {
        "status": "SUCCESS",
        "phcs_created": len(phc_objs),
        "medicines_created": len(med_objs),
        "historical_days": history_days,
        "message": f"Loaded synthetic demo dataset: {len(phc_objs)} PHCs across 3 districts, {len(med_objs)} medicines with {history_days} days of historical records."
    }


def clear_demo_dataset(db: Session) -> Dict[str, Any]:
    """
    Cleans up all synthetic demonstration data (is_demo=True) across all tables.
    Returns the database to user data only (or fully empty).
    """
    deleted_counts = {}
    
    deleted_counts["risk_alerts"] = db.query(RiskAlert).filter(RiskAlert.is_demo == True).delete(synchronize_session=False)
    deleted_counts["redistributions"] = db.query(RedistributionRecommendation).filter(RedistributionRecommendation.is_demo == True).delete(synchronize_session=False)
    deleted_counts["federated_runs"] = db.query(FederatedModelRun).filter(FederatedModelRun.is_demo == True).delete(synchronize_session=False)
    deleted_counts["historical_demands"] = db.query(HistoricalMedicineDemand).filter(HistoricalMedicineDemand.is_demo == True).delete(synchronize_session=False)
    deleted_counts["stocks"] = db.query(MedicineStock).filter(MedicineStock.is_demo == True).delete(synchronize_session=False)
    deleted_counts["footfalls"] = db.query(Footfall).filter(Footfall.is_demo == True).delete(synchronize_session=False)
    deleted_counts["beds"] = db.query(BedCapacity).filter(BedCapacity.is_demo == True).delete(synchronize_session=False)
    deleted_counts["staff"] = db.query(StaffAttendance).filter(StaffAttendance.is_demo == True).delete(synchronize_session=False)
    deleted_counts["medicines"] = db.query(Medicine).filter(Medicine.is_demo == True).delete(synchronize_session=False)
    deleted_counts["phcs"] = db.query(PHC).filter(PHC.is_demo == True).delete(synchronize_session=False)

    db.commit()
    return {
        "status": "CLEARED",
        "deleted_counts": deleted_counts,
        "message": "All demo synthetic data successfully cleared."
    }
