import csv
import io
from datetime import datetime, date
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import PHC, Medicine, MedicineStock, Footfall, BedCapacity, StaffAttendance, HistoricalMedicineDemand

REQUIRED_COLUMNS = [
    "phc_id", "phc_name", "district", "state", "medicine",
    "date", "stock", "daily_consumption", "footfall",
    "beds_total", "beds_occupied", "staff_total", "staff_present", "lead_time"
]

def parse_and_validate_csv(csv_content: str) -> Dict[str, Any]:
    """
    Validates CSV file structure, headers, and row-level constraints.
    Returns preview, errors list, and can_import boolean.
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    if not reader.fieldnames:
        return {
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "missing_columns": REQUIRED_COLUMNS,
            "errors": [{"row": 0, "message": "CSV file is empty or missing headers."}],
            "preview_rows": [],
            "can_import": False
        }

    # Normalize headers
    normalized_headers = [h.strip().lower() for h in reader.fieldnames if h]
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in normalized_headers]

    if missing_columns:
        return {
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "missing_columns": missing_columns,
            "errors": [{"row": 0, "message": f"Missing required columns: {', '.join(missing_columns)}"}],
            "preview_rows": [],
            "can_import": False
        }

    total_rows = 0
    valid_rows = 0
    errors = []
    preview_rows = []
    parsed_records = []

    # Reset reader
    reader = csv.DictReader(io.StringIO(csv_content))
    for row_idx, raw_row in enumerate(reader, start=1):
        total_rows += 1
        row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
        row_errors = []

        # Validate non-empty strings
        for field in ["phc_id", "phc_name", "district", "state", "medicine"]:
            if not row.get(field):
                row_errors.append(f"Field '{field}' cannot be empty.")

        # Validate Date
        date_val = None
        date_str = row.get("date", "")
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                date_val = datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                pass
        if not date_val:
            row_errors.append(f"Invalid date format '{date_str}'. Expected YYYY-MM-DD.")

        # Validate Numeric fields >= 0
        numeric_fields = {
            "stock": float,
            "daily_consumption": float,
            "footfall": int,
            "beds_total": int,
            "beds_occupied": int,
            "staff_total": int,
            "staff_present": int,
            "lead_time": int
        }
        parsed_num = {}
        for field, cast_fn in numeric_fields.items():
            val_str = row.get(field, "")
            try:
                val = cast_fn(val_str)
                if val < 0:
                    row_errors.append(f"'{field}' must be >= 0 (got {val}).")
                parsed_num[field] = val
            except (ValueError, TypeError):
                row_errors.append(f"Invalid numeric value '{val_str}' for '{field}'.")

        # Business Logic bounds
        if "beds_total" in parsed_num and "beds_occupied" in parsed_num:
            if parsed_num["beds_occupied"] > parsed_num["beds_total"]:
                row_errors.append(f"beds_occupied ({parsed_num['beds_occupied']}) cannot exceed beds_total ({parsed_num['beds_total']}).")

        if "staff_total" in parsed_num and "staff_present" in parsed_num:
            if parsed_num["staff_present"] > parsed_num["staff_total"]:
                row_errors.append(f"staff_present ({parsed_num['staff_present']}) cannot exceed staff_total ({parsed_num['staff_total']}).")

        # Optional fields
        lat = None
        lon = None
        if row.get("latitude"):
            try:
                lat = float(row.get("latitude"))
            except ValueError:
                pass
        if row.get("longitude"):
            try:
                lon = float(row.get("longitude"))
            except ValueError:
                pass

        if row_errors:
            errors.append({"row": row_idx, "message": "; ".join(row_errors)})
        else:
            valid_rows += 1
            record_item = {
                "phc_id": row["phc_id"],
                "phc_name": row["phc_name"],
                "district": row["district"],
                "state": row["state"],
                "country": row.get("country", "India") or "India",
                "latitude": lat,
                "longitude": lon,
                "medicine_name": row["medicine"],
                "medicine_category": row.get("category", "Essential Medicine") or "Essential Medicine",
                "unit": row.get("unit", "units") or "units",
                "min_threshold": float(row.get("min_threshold", 50.0) or 50.0),
                "lead_time_days": int(parsed_num.get("lead_time", 7)),
                "shelf_life_days": int(row.get("shelf_life_days", 365) or 365),
                "cold_chain_required": row.get("cold_chain_required", "false").lower() in ("true", "1", "yes"),
                "date": date_val,
                "stock": parsed_num["stock"],
                "daily_consumption": parsed_num["daily_consumption"],
                "footfall": parsed_num["footfall"],
                "beds_total": parsed_num["beds_total"],
                "beds_occupied": parsed_num["beds_occupied"],
                "staff_total": parsed_num["staff_total"],
                "staff_present": parsed_num["staff_present"],
            }
            parsed_records.append(record_item)

        if len(preview_rows) < 10:
            preview_rows.append(raw_row)

    can_import = (len(errors) == 0 and valid_rows > 0)

    return {
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "invalid_rows": len(errors),
        "missing_columns": [],
        "errors": errors,
        "preview_rows": preview_rows,
        "can_import": can_import,
        "_parsed_records": parsed_records if can_import else []
    }


def execute_csv_import(parsed_records: List[Dict[str, Any]], db: Session, is_demo: bool = False) -> Dict[str, int]:
    """Imports validated records into database tables."""
    phcs_created = 0
    medicines_created = 0
    records_imported = 0

    for rec in parsed_records:
        # 1. PHC Upsert
        phc = db.query(PHC).filter(PHC.id == rec["phc_id"]).first()
        if not phc:
            phc = PHC(
                id=rec["phc_id"],
                name=rec["phc_name"],
                district=rec["district"],
                state=rec["state"],
                country=rec["country"],
                latitude=rec["latitude"],
                longitude=rec["longitude"],
                is_demo=is_demo
            )
            db.add(phc)
            db.flush()
            phcs_created += 1
        else:
            if rec["latitude"] and not phc.latitude:
                phc.latitude = rec["latitude"]
            if rec["longitude"] and not phc.longitude:
                phc.longitude = rec["longitude"]

        # 2. Medicine Upsert
        med = db.query(Medicine).filter(Medicine.name.ilike(rec["medicine_name"])).first()
        if not med:
            med = Medicine(
                name=rec["medicine_name"],
                category=rec["medicine_category"],
                unit=rec["unit"],
                min_stock_threshold=rec["min_threshold"],
                lead_time_days=rec["lead_time_days"],
                shelf_life_days=rec["shelf_life_days"],
                cold_chain_required=rec["cold_chain_required"],
                is_demo=is_demo
            )
            db.add(med)
            db.flush()
            medicines_created += 1

        # 3. Medicine Stock Upsert
        stock_entry = db.query(MedicineStock).filter(
            MedicineStock.phc_id == phc.id,
            MedicineStock.medicine_id == med.id
        ).first()
        if not stock_entry:
            stock_entry = MedicineStock(
                phc_id=phc.id,
                medicine_id=med.id,
                current_stock=rec["stock"],
                daily_consumption=rec["daily_consumption"],
                is_demo=is_demo
            )
            db.add(stock_entry)
        else:
            stock_entry.current_stock = rec["stock"]
            stock_entry.daily_consumption = rec["daily_consumption"]

        # 4. Historical Demand log for ML
        hist_demand = HistoricalMedicineDemand(
            phc_id=phc.id,
            medicine_id=med.id,
            record_date=rec["date"],
            daily_demand=rec["daily_consumption"],
            is_demo=is_demo
        )
        db.add(hist_demand)

        # 5. Footfall record
        footfall_entry = Footfall(
            phc_id=phc.id,
            record_date=rec["date"],
            patient_count=rec["footfall"],
            disease_category="General Outpatient",
            emergency_cases=int(rec["footfall"] * 0.15),
            outpatient_cases=int(rec["footfall"] * 0.85),
            is_demo=is_demo
        )
        db.add(footfall_entry)

        # 6. Bed Capacity
        bed_entry = db.query(BedCapacity).filter(BedCapacity.phc_id == phc.id).first()
        if not bed_entry:
            bed_entry = BedCapacity(
                phc_id=phc.id,
                total_beds=rec["beds_total"],
                occupied_beds=rec["beds_occupied"],
                is_demo=is_demo
            )
            db.add(bed_entry)
        else:
            bed_entry.total_beds = rec["beds_total"]
            bed_entry.occupied_beds = rec["beds_occupied"]

        # 7. Staff Attendance
        staff_entry = StaffAttendance(
            phc_id=phc.id,
            record_date=rec["date"],
            total_staff=rec["staff_total"],
            present_staff=rec["staff_present"],
            absent_staff=max(0, rec["staff_total"] - rec["staff_present"]),
            is_demo=is_demo
        )
        db.add(staff_entry)

        records_imported += 1

    db.commit()
    return {
        "phcs_created": phcs_created,
        "medicines_created": medicines_created,
        "records_imported": records_imported
    }
