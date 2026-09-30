from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Medicine
from app.schemas import MedicineCreate, MedicineUpdate, MedicineOut

router = APIRouter(prefix="/medicines", tags=["Medicines"])

@router.get("", response_model=List[MedicineOut])
def list_medicines(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Medicine)
    if category:
        query = query.filter(Medicine.category.ilike(f"%{category}%"))
    return query.order_by(Medicine.name.asc()).all()

@router.post("", response_model=MedicineOut, status_code=201)
def create_medicine(payload: MedicineCreate, db: Session = Depends(get_db)):
    existing = db.query(Medicine).filter(Medicine.name.ilike(payload.name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Medicine '{payload.name}' already registered.")
    
    med = Medicine(
        name=payload.name.strip(),
        category=payload.category.strip(),
        unit=payload.unit.strip() if payload.unit else "units",
        min_stock_threshold=payload.min_stock_threshold,
        lead_time_days=payload.lead_time_days,
        shelf_life_days=payload.shelf_life_days,
        cold_chain_required=payload.cold_chain_required,
        is_demo=False
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med

@router.get("/{med_id}", response_model=MedicineOut)
def get_medicine(med_id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
    return med

@router.put("/{med_id}", response_model=MedicineOut)
def update_medicine(med_id: int, payload: MedicineUpdate, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
    
    if payload.name is not None:
        med.name = payload.name.strip()
    if payload.category is not None:
        med.category = payload.category.strip()
    if payload.unit is not None:
        med.unit = payload.unit.strip()
    if payload.min_stock_threshold is not None:
        med.min_stock_threshold = payload.min_stock_threshold
    if payload.lead_time_days is not None:
        med.lead_time_days = payload.lead_time_days
    if payload.shelf_life_days is not None:
        med.shelf_life_days = payload.shelf_life_days
    if payload.cold_chain_required is not None:
        med.cold_chain_required = payload.cold_chain_required

    db.commit()
    db.refresh(med)
    return med

@router.delete("/{med_id}", status_code=204)
def delete_medicine(med_id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
    db.delete(med)
    db.commit()
    return None
