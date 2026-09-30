from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator

# --- PHC Schemas ---
class PHCBase(BaseModel):
    id: str = Field(..., description="Unique PHC ID e.g. PHC-01")
    name: str = Field(..., min_length=1, description="PHC facility name")
    district: str = Field(..., min_length=1, description="District name")
    state: str = Field(..., min_length=1, description="State / Province")
    country: str = Field(default="India", description="Country")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)

class PHCCreate(PHCBase):
    pass

class PHCUpdate(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PHCOut(PHCBase):
    is_demo: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Medicine Schemas ---
class MedicineBase(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    unit: str = Field(default="units")
    min_stock_threshold: float = Field(default=100.0, ge=0.0)
    lead_time_days: int = Field(default=7, ge=0)
    shelf_life_days: int = Field(default=365, ge=0)
    cold_chain_required: bool = False

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    min_stock_threshold: Optional[float] = Field(None, ge=0.0)
    lead_time_days: Optional[int] = Field(None, ge=0)
    shelf_life_days: Optional[int] = Field(None, ge=0)
    cold_chain_required: Optional[bool] = None

class MedicineOut(MedicineBase):
    id: int
    is_demo: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Medicine Stock Schemas ---
class MedicineStockBase(BaseModel):
    phc_id: str
    medicine_id: int
    current_stock: float = Field(..., ge=0.0, description="Current stock must be >= 0")
    daily_consumption: float = Field(..., ge=0.0, description="Daily consumption must be >= 0")

class MedicineStockCreate(MedicineStockBase):
    pass

class MedicineStockUpdate(BaseModel):
    current_stock: Optional[float] = Field(None, ge=0.0)
    daily_consumption: Optional[float] = Field(None, ge=0.0)

class MedicineStockOut(MedicineStockBase):
    id: int
    last_updated: Optional[datetime] = None
    is_demo: bool = False
    days_remaining: Optional[float] = None
    medicine_name: Optional[str] = None
    medicine_category: Optional[str] = None
    medicine_unit: Optional[str] = None
    phc_name: Optional[str] = None
    min_stock_threshold: Optional[float] = None
    lead_time_days: Optional[int] = None
    cold_chain_required: Optional[bool] = None

    class Config:
        from_attributes = True


# --- Footfall Schemas ---
class FootfallBase(BaseModel):
    phc_id: str
    record_date: date
    patient_count: int = Field(..., ge=0)
    disease_category: str = Field(default="General Outpatient")
    emergency_cases: int = Field(default=0, ge=0)
    outpatient_cases: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_patient_breakdown(self):
        # outpatient + emergency can sum up to patient count or be zero if unspecified
        if self.patient_count < 0:
            raise ValueError("Patient count must be non-negative")
        return self

class FootfallCreate(FootfallBase):
    pass

class FootfallOut(FootfallBase):
    id: int
    is_demo: bool = False
    phc_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Bed Capacity Schemas ---
class BedCapacityBase(BaseModel):
    phc_id: str
    total_beds: int = Field(..., ge=0, description="Total beds must be >= 0")
    occupied_beds: int = Field(..., ge=0, description="Occupied beds must be >= 0")

    @model_validator(mode="after")
    def check_bed_bounds(self):
        if self.occupied_beds > self.total_beds:
            raise ValueError(f"Occupied beds ({self.occupied_beds}) cannot exceed total beds ({self.total_beds}).")
        return self

class BedCapacityCreate(BedCapacityBase):
    pass

class BedCapacityOut(BedCapacityBase):
    id: int
    available_beds: int
    occupancy_rate: float
    last_updated: Optional[datetime] = None
    is_demo: bool = False
    phc_name: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True


# --- Staff Attendance Schemas ---
class StaffAttendanceBase(BaseModel):
    phc_id: str
    record_date: date
    total_staff: int = Field(..., ge=0, description="Total staff must be >= 0")
    present_staff: int = Field(..., ge=0, description="Present staff must be >= 0")
    absent_staff: Optional[int] = Field(default=0, ge=0)

    @model_validator(mode="after")
    def check_staff_bounds(self):
        if self.present_staff > self.total_staff:
            raise ValueError(f"Present staff ({self.present_staff}) cannot exceed total staff ({self.total_staff}).")
        if self.absent_staff is None or self.absent_staff == 0:
            self.absent_staff = max(0, self.total_staff - self.present_staff)
        return self

class StaffAttendanceCreate(StaffAttendanceBase):
    pass

class StaffAttendanceOut(StaffAttendanceBase):
    id: int
    attendance_rate: float
    is_demo: bool = False
    phc_name: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True


# --- Forecast & Risk Schemas ---
class ForecastDataPoint(BaseModel):
    date: str
    actual: Optional[float] = None
    predicted: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class ForecastResponse(BaseModel):
    phc_id: str
    phc_name: str
    medicine_id: int
    medicine_name: str
    horizon_days: int
    historical_count: int
    mae: Optional[float] = None
    predicted_daily_demand: float
    forecast_points: List[ForecastDataPoint]
    insufficient_data: bool = False
    message: Optional[str] = None

class RiskResponse(BaseModel):
    phc_id: str
    phc_name: str
    district: str
    state: str
    medicine_id: int
    medicine_name: str
    current_stock: float
    predicted_daily_demand: float
    min_stock_threshold: float
    lead_time_days: int
    coverage_days: Optional[float] = None
    expected_stockout_date: Optional[str] = None
    risk_level: str # HIGH, MEDIUM, LOW
    reason: str
    ai_explanation: Optional[str] = None

class RiskAlertOut(BaseModel):
    id: int
    phc_id: str
    phc_name: str
    district: str
    medicine_id: int
    medicine_name: str
    risk_level: str
    coverage_days: Optional[float]
    expected_stockout_date: Optional[date]
    calculated_reason: str
    ai_explanation: Optional[str] = None
    created_at: datetime
    is_demo: bool = False


# --- Redistribution Schemas ---
class RedistributionTransfer(BaseModel):
    from_phc_id: str
    from_phc_name: str
    from_district: str
    to_phc_id: str
    to_phc_name: str
    to_district: str
    medicine_id: int
    medicine_name: str
    quantity: float
    distance_km: float
    priority: str # HIGH, MEDIUM, LOW
    reason: str
    cold_chain_compliant: bool = True
    shelf_life_compliant: bool = True

class RedistributionPlanResponse(BaseModel):
    total_transfers: int
    transfers: List[RedistributionTransfer]
    disclaimer: str = "Human approval required. Never execute automatically."
    surplus_nodes: int = 0
    shortage_nodes: int = 0
    ai_explanation: Optional[str] = None
    message: Optional[str] = None


# --- Emergency Simulation Schemas ---
class EmergencySimulationRequest(BaseModel):
    emergency_name: str = Field(..., min_length=1)
    demand_increase_pct: float = Field(..., ge=0.0, le=500.0) # e.g. 50% = 50.0
    duration_days: int = Field(default=14, ge=1, le=90)
    affected_districts: List[str] = Field(default_factory=list) # empty means all
    affected_medicine_ids: List[int] = Field(default_factory=list) # empty means all

class EmergencySimulationResponse(BaseModel):
    emergency_name: str
    demand_increase_pct: float
    duration_days: int
    affected_phcs_count: int
    critical_phcs_count: int
    shortage_medicines_count: int
    simulated_alerts: List[RiskResponse]
    redistribution_plan: RedistributionPlanResponse
    gemini_summary: Optional[str] = None
    is_simulation: bool = True


# --- Federated AI Schemas ---
class DistrictClientMetric(BaseModel):
    district: str
    sample_count: int
    local_mae: float
    local_r2: float
    data_points: int

class FederatedStatusResponse(BaseModel):
    status: str
    total_districts: int
    min_districts_required: int = 2
    can_train: bool
    message: Optional[str] = None
    districts: List[str] = []
    rounds_completed: int = 0
    global_mae: Optional[float] = None
    global_r2: Optional[float] = None
    district_metrics: List[DistrictClientMetric] = []
    training_steps: List[str] = []
    privacy_notice: str = "Raw healthcare data remains local to each district; only model weight updates are aggregated."


# --- Gemini Assistant Schemas ---
class GeminiAssistantRequest(BaseModel):
    question: str
    phc_id: Optional[str] = None
    medicine_id: Optional[int] = None
    district: Optional[str] = None

class GeminiAssistantResponse(BaseModel):
    answer: str
    data_context_used: Dict[str, Any]
    disclaimer: str = "AI-generated explanation based on available data. Verify before operational use."


# --- CSV Upload & Validation Schemas ---
class CsvValidationResult(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    missing_columns: List[str] = []
    errors: List[Dict[str, Any]] = []
    preview_rows: List[Dict[str, Any]] = []
    can_import: bool = False
