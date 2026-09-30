from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PHC
from app.services.demo_service import load_synthetic_demo_dataset, clear_demo_dataset

router = APIRouter(prefix="/demo", tags=["Demo Mode"])

@router.get("/status")
def get_demo_status(db: Session = Depends(get_db)):
    demo_count = db.query(PHC).filter(PHC.is_demo == True).count()
    return {
        "is_demo_active": demo_count > 0,
        "demo_phc_count": demo_count
    }

@router.post("/load")
def load_demo_data(db: Session = Depends(get_db)):
    """Loads realistic synthetic dataset tagged with is_demo=True."""
    result = load_synthetic_demo_dataset(db)
    return result

@router.delete("/clear")
def clear_demo_data(db: Session = Depends(get_db)):
    """Removes all synthetic demo records and restores clean user state."""
    result = clear_demo_dataset(db)
    return result
