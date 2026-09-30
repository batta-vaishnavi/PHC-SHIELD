from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class PHC(Base):
    __tablename__ = "phcs"
    
    id = Column(String(50), primary_key=True, index=True) # e.g. PHC-001 or custom string
    name = Column(String(200), nullable=False)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    country = Column(String(100), default="India")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_demo = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    stocks = relationship("MedicineStock", back_populates="phc", cascade="all, delete-orphan")
    footfalls = relationship("Footfall", back_populates="phc", cascade="all, delete-orphan")
    beds = relationship("BedCapacity", back_populates="phc", cascade="all, delete-orphan")
    staff_attendances = relationship("StaffAttendance", back_populates="phc", cascade="all, delete-orphan")
    historical_demands = relationship("HistoricalMedicineDemand", back_populates="phc", cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=False) # e.g. Antibiotic, Analgesic, Vaccine, Antimalarial, IV Fluid
    unit = Column(String(50), default="units") # e.g. tablets, vials, ampoules, bottles
    min_stock_threshold = Column(Float, default=100.0)
    lead_time_days = Column(Integer, default=7)
    shelf_life_days = Column(Integer, default=365)
    cold_chain_required = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    stocks = relationship("MedicineStock", back_populates="medicine", cascade="all, delete-orphan")
    historical_demands = relationship("HistoricalMedicineDemand", back_populates="medicine", cascade="all, delete-orphan")


class MedicineStock(Base):
    __tablename__ = "medicine_stocks"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phc_id = Column(String(50), ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    current_stock = Column(Float, nullable=False, default=0.0)
    daily_consumption = Column(Float, nullable=False, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)

    # Relationships
    phc = relationship("PHC", back_populates="stocks")
    medicine = relationship("Medicine", back_populates="stocks")


class Footfall(Base):
    __tablename__ = "footfalls"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phc_id = Column(String(50), ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    patient_count = Column(Integer, nullable=False, default=0)
    disease_category = Column(String(100), default="General Outpatient")
    emergency_cases = Column(Integer, default=0)
    outpatient_cases = Column(Integer, default=0)
    is_demo = Column(Boolean, default=False, index=True)

    phc = relationship("PHC", back_populates="footfalls")


class BedCapacity(Base):
    __tablename__ = "bed_capacities"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phc_id = Column(String(50), ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    total_beds = Column(Integer, nullable=False, default=0)
    occupied_beds = Column(Integer, nullable=False, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)

    phc = relationship("PHC", back_populates="beds")


class StaffAttendance(Base):
    __tablename__ = "staff_attendances"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phc_id = Column(String(50), ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    total_staff = Column(Integer, nullable=False, default=0)
    present_staff = Column(Integer, nullable=False, default=0)
    absent_staff = Column(Integer, nullable=False, default=0)
    is_demo = Column(Boolean, default=False, index=True)

    phc = relationship("PHC", back_populates="staff_attendances")


class HistoricalMedicineDemand(Base):
    """Historical daily consumption records for time-series ML forecasting (Ridge/GBM)."""
    __tablename__ = "historical_medicine_demands"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phc_id = Column(String(50), ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    daily_demand = Column(Float, nullable=False, default=0.0)
    is_demo = Column(Boolean, default=False, index=True)

    phc = relationship("PHC", back_populates="historical_demands")
    medicine = relationship("Medicine", back_populates="historical_demands")


class RiskAlert(Base):
    __tablename__ = "risk_alerts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phc_id = Column(String(50), ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level = Column(String(20), nullable=False) # HIGH, MEDIUM, LOW
    coverage_days = Column(Float, nullable=False)
    expected_stockout_date = Column(Date, nullable=True)
    calculated_reason = Column(String(500), nullable=False)
    ai_explanation = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    phc = relationship("PHC")
    medicine = relationship("Medicine")


class RedistributionRecommendation(Base):
    __tablename__ = "redistribution_recommendations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    from_phc_id = Column(String(50), ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False)
    to_phc_id = Column(String(50), ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    priority = Column(String(20), default="MEDIUM") # HIGH, MEDIUM, LOW
    reason = Column(String(500), nullable=False)
    human_approved = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    from_phc = relationship("PHC", foreign_keys=[from_phc_id])
    to_phc = relationship("PHC", foreign_keys=[to_phc_id])
    medicine = relationship("Medicine", foreign_keys=[medicine_id])


class FederatedModelRun(Base):
    __tablename__ = "federated_model_runs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    num_districts = Column(Integer, nullable=False)
    rounds = Column(Integer, default=5)
    global_mae = Column(Float, nullable=False)
    global_r2 = Column(Float, nullable=False)
    details_json = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False, index=True)
