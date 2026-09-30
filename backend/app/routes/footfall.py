from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Footfall, PHC
from app.schemas import FootfallCreate, FootfallOut

router = APIRouter(prefix="/footfall", tags=["Footfall Tracker"])

@router.get("", response_model=List[FootfallOut])
def list_footfalls(phc_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Footfall)
    if phc_id:
        query = query.filter(Footfall.phc_id == phc_id)
    records = query.order_by(Footfall.record_date.desc()).all()
    
    results = []
    for r in records:
        results.append(FootfallOut(
            id=r.id,
            phc_id=r.phc_id,
            record_date=r.record_date,
            patient_count=r.patient_count,
            disease_category=r.disease_category,
            emergency_cases=r.emergency_cases,
            outpatient_cases=r.outpatient_cases,
            is_demo=r.is_demo,
            phc_name=r.phc.name if r.phc else None
        ))
    return results

@router.post("", response_model=FootfallOut, status_code=201)
def create_footfall(payload: FootfallCreate, db: Session = Depends(get_db)):
    phc = db.query(PHC).filter(PHC.id == payload.phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail=f"PHC '{payload.phc_id}' not found.")
    
    footfall = Footfall(
        phc_id=payload.phc_id,
        record_date=payload.record_date,
        patient_count=payload.patient_count,
        disease_category=payload.disease_category,
        emergency_cases=payload.emergency_cases,
        outpatient_cases=payload.outpatient_cases,
        is_demo=False
    )
    db.add(footfall)
    db.commit()
    db.refresh(footfall)

    return FootfallOut(
        id=footfall.id,
        phc_id=footfall.phc_id,
        record_date=footfall.record_date,
        patient_count=footfall.patient_count,
        disease_category=footfall.disease_category,
        emergency_cases=footfall.emergency_cases,
        outpatient_cases=footfall.outpatient_cases,
        is_demo=footfall.is_demo,
        phc_name=phc.name
    )

@router.delete("/{footfall_id}", status_code=204)
def delete_footfall(footfall_id: int, db: Session = Depends(get_db)):
    record = db.query(Footfall).filter(Footfall.id == footfall_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Footfall record not found.")
    db.delete(record)
    db.commit()
    return None
