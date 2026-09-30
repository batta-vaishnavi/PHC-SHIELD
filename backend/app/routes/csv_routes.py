from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import CsvValidationResult
from app.services.csv_service import parse_and_validate_csv, execute_csv_import

router = APIRouter(prefix="/csv", tags=["CSV Upload & Bulk Ingestion"])

@router.post("/validate", response_model=CsvValidationResult)
async def validate_csv_file(file: UploadFile = File(...)):
    """Parses and validates CSV format, schema columns, data types, and logical constraints."""
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    contents = await file.read()
    try:
        csv_text = contents.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = contents.decode("latin-1")

    validation_result = parse_and_validate_csv(csv_text)
    return CsvValidationResult(
        total_rows=validation_result["total_rows"],
        valid_rows=validation_result["valid_rows"],
        invalid_rows=validation_result["invalid_rows"],
        missing_columns=validation_result["missing_columns"],
        errors=validation_result["errors"],
        preview_rows=validation_result["preview_rows"],
        can_import=validation_result["can_import"]
    )


@router.post("/import")
async def import_csv_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Imports validated records into the database. Never imports invalid data."""
    contents = await file.read()
    try:
        csv_text = contents.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = contents.decode("latin-1")

    validation_result = parse_and_validate_csv(csv_text)
    if not validation_result["can_import"]:
        raise HTTPException(
            status_code=400,
            detail=f"CSV validation failed with {validation_result['invalid_rows']} errors. Cannot import invalid dataset."
        )

    import_stats = execute_csv_import(validation_result["_parsed_records"], db, is_demo=False)
    return {
        "status": "SUCCESS",
        "message": f"Successfully ingested {import_stats['records_imported']} records across {import_stats['phcs_created']} new PHCs and {import_stats['medicines_created']} new medicines.",
        "stats": import_stats
    }
