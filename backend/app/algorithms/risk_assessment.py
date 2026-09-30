from datetime import date, timedelta
from typing import Dict, Any, Optional

def calculate_stock_risk(
    current_stock: float,
    predicted_daily_demand: float,
    min_stock_threshold: float,
    lead_time_days: int,
    base_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Computes coverage days, risk level (HIGH, MEDIUM, LOW), expected stock-out date, and calculated reason.
    
    Risk Levels:
    - HIGH if coverage_days < lead_time OR stock <= min_stock_threshold
    - MEDIUM if coverage_days < lead_time + 3
    - LOW otherwise
    """
    if base_date is None:
        base_date = date.today()

    # Determine effective daily rate
    effective_demand = max(0.0, float(predicted_daily_demand))
    
    if effective_demand <= 0.0001:
        if current_stock <= min_stock_threshold and min_stock_threshold > 0:
            risk_level = "HIGH"
            coverage_days = 0.0
            expected_stockout_date = base_date
            reason = f"Stock ({current_stock:.1f}) is at or below minimum safety threshold ({min_stock_threshold:.1f}) with zero or unrecorded daily consumption."
        else:
            risk_level = "LOW"
            coverage_days = 999.0
            expected_stockout_date = None
            reason = f"Zero daily consumption recorded. Current stock ({current_stock:.1f}) is above minimum threshold."
        
        return {
            "coverage_days": None if coverage_days == 999.0 else coverage_days,
            "risk_level": risk_level,
            "expected_stockout_date": expected_stockout_date.strftime("%Y-%m-%d") if expected_stockout_date else None,
            "reason": reason
        }

    coverage_days = current_stock / effective_demand
    
    # Calculate stockout date
    if coverage_days <= 365:
        expected_stockout = base_date + timedelta(days=max(0, int(coverage_days)))
        expected_stockout_str = expected_stockout.strftime("%Y-%m-%d")
    else:
        expected_stockout_str = None

    # Risk evaluation
    if coverage_days < lead_time_days or current_stock <= min_stock_threshold:
        risk_level = "HIGH"
        triggers = []
        if coverage_days < lead_time_days:
            triggers.append(f"Coverage of {coverage_days:.1f} days is below supplier lead time of {lead_time_days} days")
        if current_stock <= min_stock_threshold:
            triggers.append(f"Stock ({current_stock:.1f}) is at or below minimum threshold ({min_stock_threshold:.1f})")
        reason = "CRITICAL SHORTAGE RISK: " + "; ".join(triggers) + f". Stock-out expected around {expected_stockout_str or 'soon'}."
    elif coverage_days < (lead_time_days + 3):
        risk_level = "MEDIUM"
        reason = f"MODERATE RISK: Coverage of {coverage_days:.1f} days is within warning buffer (lead time {lead_time_days} days + 3 days buffer = {lead_time_days + 3} days). Reorder recommended."
    else:
        risk_level = "LOW"
        reason = f"HEALTHY INVENTORY: Coverage of {coverage_days:.1f} days exceeds safe lead time threshold of {lead_time_days + 3} days."

    return {
        "coverage_days": round(coverage_days, 1),
        "risk_level": risk_level,
        "expected_stockout_date": expected_stockout_str,
        "reason": reason
    }
