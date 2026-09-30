from datetime import date, timedelta
from app.algorithms.risk_assessment import calculate_stock_risk

def test_days_remaining_and_zero_consumption():
    # Test zero consumption behavior
    res_zero = calculate_stock_risk(
        current_stock=150.0,
        predicted_daily_demand=0.0,
        min_stock_threshold=50.0,
        lead_time_days=7
    )
    assert res_zero["risk_level"] == "LOW"
    assert res_zero["coverage_days"] is None
    assert res_zero["expected_stockout_date"] is None

    # Zero consumption but below min threshold
    res_zero_low = calculate_stock_risk(
        current_stock=20.0,
        predicted_daily_demand=0.0,
        min_stock_threshold=50.0,
        lead_time_days=7
    )
    assert res_zero_low["risk_level"] == "HIGH"
    assert res_zero_low["coverage_days"] == 0.0

def test_risk_levels():
    today = date.today()

    # 1. HIGH RISK: coverage_days < lead_time
    # stock = 40, demand = 10 -> coverage = 4 days < lead_time (7)
    res_high1 = calculate_stock_risk(
        current_stock=40.0,
        predicted_daily_demand=10.0,
        min_stock_threshold=20.0,
        lead_time_days=7,
        base_date=today
    )
    assert res_high1["risk_level"] == "HIGH"
    assert res_high1["coverage_days"] == 4.0
    assert res_high1["expected_stockout_date"] == (today + timedelta(days=4)).strftime("%Y-%m-%d")

    # 2. HIGH RISK: stock <= min_stock_threshold even if coverage is slightly higher
    # stock = 50, min = 50, demand = 5 -> coverage = 10 >= 7, but stock <= min_threshold
    res_high2 = calculate_stock_risk(
        current_stock=50.0,
        predicted_daily_demand=5.0,
        min_stock_threshold=50.0,
        lead_time_days=7,
        base_date=today
    )
    assert res_high2["risk_level"] == "HIGH"

    # 3. MEDIUM RISK: lead_time <= coverage_days < lead_time + 3
    # lead_time = 7, coverage = 8.5 (< 10)
    res_med = calculate_stock_risk(
        current_stock=85.0,
        predicted_daily_demand=10.0,
        min_stock_threshold=50.0,
        lead_time_days=7,
        base_date=today
    )
    assert res_med["risk_level"] == "MEDIUM"
    assert res_med["coverage_days"] == 8.5

    # 4. LOW RISK: coverage_days >= lead_time + 3 and stock > min_threshold
    # lead_time = 7, coverage = 15 (>= 10)
    res_low = calculate_stock_risk(
        current_stock=150.0,
        predicted_daily_demand=10.0,
        min_stock_threshold=50.0,
        lead_time_days=7,
        base_date=today
    )
    assert res_low["risk_level"] == "LOW"
    assert res_low["coverage_days"] == 15.0
