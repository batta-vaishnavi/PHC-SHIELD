from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import PHC
from app.schemas import PHCCreate, PHCUpdate, PHCOut

router = APIRouter(prefix="/phcs", tags=["PHC Network"])

@router.get("", response_model=List[PHCOut])
def list_phcs(
    search: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PHC)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(PHC.id.ilike(s), PHC.name.ilike(s), PHC.district.ilike(s), PHC.state.ilike(s)))
    if district:
        query = query.filter(PHC.district.ilike(f"%{district}%"))
    if state:
        query = query.filter(PHC.state.ilike(f"%{state}%"))
    return query.order_by(PHC.name.asc()).all()

@router.post("", response_model=PHCOut, status_code=201)
def create_phc(payload: PHCCreate, db: Session = Depends(get_db)):
    existing = db.query(PHC).filter(PHC.id == payload.id.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"PHC with ID '{payload.id}' already exists.")
    
    phc = PHC(
        id=payload.id.strip(),
        name=payload.name.strip(),
        district=payload.district.strip(),
        state=payload.state.strip(),
        country=payload.country.strip() if payload.country else "India",
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_demo=False
    )
    db.add(phc)
    db.commit()
    db.refresh(phc)
    return phc

@router.get("/{phc_id}", response_model=PHCOut)
def get_phc(phc_id: str, db: Session = Depends(get_db)):
    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found.")
    return phc

@router.put("/{phc_id}", response_model=PHCOut)
def update_phc(phc_id: str, payload: PHCUpdate, db: Session = Depends(get_db)):
    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found.")
    
    if payload.name is not None:
        phc.name = payload.name.strip()
    if payload.district is not None:
        phc.district = payload.district.strip()
    if payload.state is not None:
        phc.state = payload.state.strip()
    if payload.country is not None:
        phc.country = payload.country.strip()
    if payload.latitude is not None:
        phc.latitude = payload.latitude
    if payload.longitude is not None:
        phc.longitude = payload.longitude

    db.commit()
    db.refresh(phc)
    return phc

@router.delete("/{phc_id}", status_code=204)
def delete_phc(phc_id: str, db: Session = Depends(get_db)):
    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found.")
    db.delete(phc)
    db.commit()
    return None
