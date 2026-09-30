from datetime import date, timedelta
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error

def train_and_forecast_demand(
    historical_records: List[Dict[str, Any]], # list of {"date": date/str, "demand": float, "footfall": Optional[int]}
    horizon_days: int = 14,
    min_records_required: int = 14
) -> Dict[str, Any]:
    """
    Trains a Ridge regression model with lag and rolling features.
    Strictly requires >= min_records_required (14) records.
    Returns holdout MAE and forecast series.
    """
    if len(historical_records) < min_records_required:
        return {
            "insufficient_data": True,
            "message": "Insufficient data for reliable forecasting.",
            "historical_count": len(historical_records),
            "mae": None,
            "predicted_daily_demand": 0.0,
            "forecast_points": []
        }

    # Sort records by date
    df = pd.DataFrame(historical_records)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    df["demand"] = df["demand"].astype(float)

    # Feature engineering
    df["day_of_week"] = df["date"].dt.dayofweek
    df["trend"] = np.arange(len(df))
    df["lag_1"] = df["demand"].shift(1)
    df["lag_7"] = df["demand"].shift(7)
    df["rolling_mean_7"] = df["demand"].shift(1).rolling(window=7, min_periods=1).mean()

    # Fill initial NaNs with backward fill or mean
    df = df.bfill().ffill()

    feature_cols = ["day_of_week", "trend", "lag_1", "lag_7", "rolling_mean_7"]
    
    X = df[feature_cols].values
    y = df["demand"].values

    # Train / Holdout split (80% train, 20% holdout test, min 3 test samples)
    test_size = max(3, int(len(df) * 0.2))
    train_size = len(df) - test_size
    
    X_train, X_test = X[:train_size], X[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]

    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    # Calculate holdout MAE
    y_pred_test = model.predict(X_test)
    # Ensure non-negative predictions
    y_pred_test = np.clip(y_pred_test, 0, None)
    mae = float(mean_absolute_error(y_test, y_pred_test))

    # Retrain on full dataset for future forecasting
    full_model = Ridge(alpha=1.0)
    full_model.fit(X, y)

    # Historical data points for chart
    forecast_points: List[Dict[str, Any]] = []
    for idx, row in df.iterrows():
        forecast_points.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "actual": round(float(row["demand"]), 2),
            "predicted": round(float(full_model.predict(X[idx:idx+1])[0]), 2),
            "lower_bound": None,
            "upper_bound": None
        })

    # Generate future horizon predictions
    last_date = df["date"].iloc[-1]
    last_trend = df["trend"].iloc[-1]
    recent_demands = list(df["demand"].values)

    future_predictions = []
    for step in range(1, horizon_days + 1):
        future_date = last_date + timedelta(days=step)
        dow = future_date.weekday()
        trend_val = last_trend + step
        lag1_val = recent_demands[-1]
        lag7_val = recent_demands[-7] if len(recent_demands) >= 7 else recent_demands[0]
        roll_val = float(np.mean(recent_demands[-7:]))

        feat_vector = np.array([[dow, trend_val, lag1_val, lag7_val, roll_val]])
        pred = float(full_model.predict(feat_vector)[0])
        pred = max(0.0, pred)
        
        future_predictions.append(pred)
        recent_demands.append(pred)

        forecast_points.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "actual": None,
            "predicted": round(pred, 2),
            "lower_bound": round(max(0.0, pred - mae * 1.2), 2),
            "upper_bound": round(pred + mae * 1.2, 2)
        })

    avg_predicted_daily = float(np.mean(future_predictions)) if future_predictions else float(df["demand"].mean())

    return {
        "insufficient_data": False,
        "message": "Forecast generated successfully with Ridge Time-Series Regression.",
        "historical_count": len(df),
        "mae": round(mae, 3),
        "predicted_daily_demand": round(avg_predicted_daily, 2),
        "forecast_points": forecast_points
    }
