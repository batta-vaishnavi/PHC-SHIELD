from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import BedCapacity, PHC
from app.schemas import BedCapacityCreate, BedCapacityOut

router = APIRouter(prefix="/beds", tags=["Bed Capacity"])

def _format_bed(b: BedCapacity) -> BedCapacityOut:
    avail = max(0, b.total_beds - b.occupied_beds)
    occ_rate = (b.occupied_beds / b.total_beds * 100.0) if b.total_beds > 0 else 0.0
    return BedCapacityOut(
        id=b.id,
        phc_id=b.phc_id,
        total_beds=b.total_beds,
        occupied_beds=b.occupied_beds,
        available_beds=avail,
        occupancy_rate=round(occ_rate, 1),
        last_updated=b.last_updated,
        is_demo=b.is_demo,
        phc_name=b.phc.name if b.phc else None,
        district=b.phc.district if b.phc else None
    )

@router.get("", response_model=List[BedCapacityOut])
def list_beds(phc_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(BedCapacity)
    if phc_id:
        query = query.filter(BedCapacity.phc_id == phc_id)
    beds = query.all()
    return [_format_bed(b) for b in beds]

@router.post("", response_model=BedCapacityOut, status_code=201)
def set_bed_capacity(payload: BedCapacityCreate, db: Session = Depends(get_db)):
    phc = db.query(PHC).filter(PHC.id == payload.phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail=f"PHC '{payload.phc_id}' not found.")
    
    if payload.occupied_beds > payload.total_beds:
        raise HTTPException(status_code=400, detail=f"Occupied beds ({payload.occupied_beds}) cannot exceed total beds ({payload.total_beds}).")

    bed_entry = db.query(BedCapacity).filter(BedCapacity.phc_id == payload.phc_id).first()
    if not bed_entry:
        bed_entry = BedCapacity(
            phc_id=payload.phc_id,
            total_beds=payload.total_beds,
            occupied_beds=payload.occupied_beds,
            is_demo=False
        )
        db.add(bed_entry)
    else:
        bed_entry.total_beds = payload.total_beds
        bed_entry.occupied_beds = payload.occupied_beds
        bed_entry.last_updated = datetime.utcnow()

    db.commit()
    db.refresh(bed_entry)
    return _format_bed(bed_entry)

@router.delete("/{bed_id}", status_code=204)
def delete_bed(bed_id: int, db: Session = Depends(get_db)):
    bed_entry = db.query(BedCapacity).filter(BedCapacity.id == bed_id).first()
    if not bed_entry:
        raise HTTPException(status_code=404, detail="Bed capacity record not found.")
    db.delete(bed_entry)
    db.commit()
    return None
