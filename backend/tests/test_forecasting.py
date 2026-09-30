from datetime import date, timedelta
from app.algorithms.forecasting import train_and_forecast_demand

def test_forecast_minimum_data_requirement():
    # 1. With < 14 records, return insufficient_data=True and no numbers
    sparse_records = [
        {"date": (date.today() - timedelta(days=i)).strftime("%Y-%m-%d"), "demand": 15.0}
        for i in range(10)
    ]
    res_sparse = train_and_forecast_demand(sparse_records, horizon_days=14, min_records_required=14)
    assert res_sparse["insufficient_data"] is True
    assert res_sparse["message"] == "Insufficient data for reliable forecasting."
    assert res_sparse["mae"] is None
    assert len(res_sparse["forecast_points"]) == 0

    # 2. With >= 14 records (e.g. 20 records), trains Ridge regression and yields forecast
    rich_records = [
        {"date": (date.today() - timedelta(days=20 - i)).strftime("%Y-%m-%d"), "demand": 20.0 + (i % 5)}
        for i in range(20)
    ]
    res_rich = train_and_forecast_demand(rich_records, horizon_days=14, min_records_required=14)
    assert res_rich["insufficient_data"] is False
    assert res_rich["mae"] is not None
    assert res_rich["mae"] >= 0.0
    assert res_rich["predicted_daily_demand"] > 0
    # Must have 20 historical points + 14 future points = 34 total points
    assert len(res_rich["forecast_points"]) == 34
