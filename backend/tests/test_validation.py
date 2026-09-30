import pytest
from pydantic import ValidationError
from app.schemas import BedCapacityBase, StaffAttendanceBase, MedicineStockBase

def test_bed_capacity_validation():
    # Valid beds
    bed = BedCapacityBase(phc_id="PHC-01", total_beds=20, occupied_beds=15)
    assert bed.total_beds == 20
    assert bed.occupied_beds == 15

    # Occupied > Total beds should fail
    with pytest.raises(ValidationError) as exc:
        BedCapacityBase(phc_id="PHC-01", total_beds=20, occupied_beds=25)
    assert "Occupied beds (25) cannot exceed total beds (20)" in str(exc.value)

    # Negative total beds should fail
    with pytest.raises(ValidationError):
        BedCapacityBase(phc_id="PHC-01", total_beds=-5, occupied_beds=0)

    # Negative occupied beds should fail
    with pytest.raises(ValidationError):
        BedCapacityBase(phc_id="PHC-01", total_beds=10, occupied_beds=-1)


def test_staff_attendance_validation():
    from datetime import date
    # Valid staff
    staff = StaffAttendanceBase(phc_id="PHC-01", record_date=date.today(), total_staff=15, present_staff=12)
    assert staff.present_staff == 12
    assert staff.absent_staff == 3

    # Present > Total staff should fail
    with pytest.raises(ValidationError) as exc:
        StaffAttendanceBase(phc_id="PHC-01", record_date=date.today(), total_staff=10, present_staff=14)
    assert "Present staff (14) cannot exceed total staff (10)" in str(exc.value)

    # Negative staff should fail
    with pytest.raises(ValidationError):
        StaffAttendanceBase(phc_id="PHC-01", record_date=date.today(), total_staff=-2, present_staff=0)


def test_medicine_stock_validation():
    # Negative stock should fail
    with pytest.raises(ValidationError):
        MedicineStockBase(phc_id="PHC-01", medicine_id=1, current_stock=-10.0, daily_consumption=5.0)

    # Negative consumption should fail
    with pytest.raises(ValidationError):
        MedicineStockBase(phc_id="PHC-01", medicine_id=1, current_stock=100.0, daily_consumption=-2.0)
