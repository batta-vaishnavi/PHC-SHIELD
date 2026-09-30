from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StaffAttendance, PHC
from app.schemas import StaffAttendanceCreate, StaffAttendanceOut

router = APIRouter(prefix="/attendance", tags=["Staff Attendance"])

def _format_staff(s: StaffAttendance) -> StaffAttendanceOut:
    att_rate = (s.present_staff / s.total_staff * 100.0) if s.total_staff > 0 else 0.0
    return StaffAttendanceOut(
        id=s.id,
        phc_id=s.phc_id,
        record_date=s.record_date,
        total_staff=s.total_staff,
        present_staff=s.present_staff,
        absent_staff=s.absent_staff,
        attendance_rate=round(att_rate, 1),
        is_demo=s.is_demo,
        phc_name=s.phc.name if s.phc else None,
        district=s.phc.district if s.phc else None
    )

@router.get("", response_model=List[StaffAttendanceOut])
def list_attendance(phc_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(StaffAttendance)
    if phc_id:
        query = query.filter(StaffAttendance.phc_id == phc_id)
    records = query.order_by(StaffAttendance.record_date.desc()).all()
    return [_format_staff(s) for s in records]

@router.post("", response_model=StaffAttendanceOut, status_code=201)
def record_attendance(payload: StaffAttendanceCreate, db: Session = Depends(get_db)):
    phc = db.query(PHC).filter(PHC.id == payload.phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail=f"PHC '{payload.phc_id}' not found.")
    
    if payload.present_staff > payload.total_staff:
        raise HTTPException(status_code=400, detail=f"Present staff ({payload.present_staff}) cannot exceed total staff ({payload.total_staff}).")

    absent = max(0, payload.total_staff - payload.present_staff)

    entry = StaffAttendance(
        phc_id=payload.phc_id,
        record_date=payload.record_date,
        total_staff=payload.total_staff,
        present_staff=payload.present_staff,
        absent_staff=absent,
        is_demo=False
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _format_staff(entry)

@router.delete("/{attendance_id}", status_code=204)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    entry = db.query(StaffAttendance).filter(StaffAttendance.id == attendance_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Staff attendance record not found.")
    db.delete(entry)
    db.commit()
    return None
