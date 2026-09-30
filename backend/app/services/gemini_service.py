import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

def _get_gemini_client():
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
        return None
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
        return client
    except Exception as e:
        logger.warning(f"Failed to initialize google-genai client: {e}")
        return None


def explain_stockout_risk(
    phc_name: str,
    district: str,
    medicine_name: str,
    stock: float,
    predicted_demand: float,
    coverage_days: Optional[float],
    lead_time: int,
    min_threshold: float,
    risk_level: str,
    calculated_reason: str
) -> str:
    """Generates an AI explanation for inventory stock-out risk based strictly on provided data."""
    client = _get_gemini_client()
    if not client:
        cov_text = f"{coverage_days:.1f} days" if coverage_days is not None else "N/A"
        return (
            f"Automated System Analysis: {phc_name} ({district}) currently holds {stock:.1f} units of {medicine_name} "
            f"against a predicted daily demand of {predicted_demand:.1f} units/day (Coverage: {cov_text}, Supplier Lead Time: {lead_time} days, "
            f"Safety Threshold: {min_threshold:.1f} units). Risk Level: {risk_level}. Reason: {calculated_reason}"
        )

    prompt = f"""
You are an expert Clinical Supply Chain Intelligence Advisor for PHC-SHIELD.
Explain using only the supplied data. Do not invent numbers or facts.

SUPPLIED DATA:
- Facility: {phc_name} (District: {district})
- Medicine: {medicine_name}
- Current On-Hand Stock: {stock} units
- Minimum Safety Threshold: {min_threshold} units
- Supplier Lead Time: {lead_time} days
- Daily Predicted Demand: {predicted_demand} units/day
- Calculated Stock Coverage: {coverage_days if coverage_days is not None else 'N/A'} days
- Assessed Risk Level: {risk_level}
- Algorithmic Reason: {calculated_reason}

Provide a concise, professional 2-3 paragraph clinical logistics explanation covering:
1. Exact root cause of the stock status and severity based on lead time vs coverage.
2. Immediate operational implications for patient care at {phc_name}.
3. Recommended proactive steps (e.g., expedited order, inter-PHC transfer requisition, buffer stock adjustment).
"""
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error in explain_stockout_risk: {e}")
        return f"Gemini is currently unavailable. Numerical analysis is still available.\n\nCalculated Reason: {calculated_reason}"


def explain_redistribution_plan(
    transfers: List[Dict[str, Any]],
    surplus_nodes_count: int,
    shortage_nodes_count: int
) -> str:
    """Explains the optimized peer-to-peer inventory transfer recommendations."""
    client = _get_gemini_client()
    if not client:
        if not transfers:
            return "No peer-to-peer transfers are required at this time based on balanced inventory levels."
        return (
            f"Automated Logistics Overview: Identified {len(transfers)} optimal redistribution movements across "
            f"{surplus_nodes_count} surplus facilities and {shortage_nodes_count} deficit facilities. "
            f"All transfers comply with transportation distance and cold-chain constraints. Human clinical approval required prior to dispatch."
        )

    transfer_lines = "\n".join([
        f"- Move {t['quantity']} units of {t['medicine_name']} from {t['from_phc_name']} ({t['from_district']}) to {t['to_phc_name']} ({t['to_district']}) — Distance: {t['distance_km']} km, Priority: {t['priority']}"
        for t in transfers[:10]
    ])

    prompt = f"""
You are the Healthcare Logistics Coordinator for PHC-SHIELD.
Explain using only the supplied data. Do not invent numbers or facts.

SUPPLIED DATA:
- Total Proposed Transfers: {len(transfers)}
- Surplus Facilities: {surplus_nodes_count}
- Shortage Facilities: {shortage_nodes_count}
- Sample Transfer Allocations:
{transfer_lines}

Provide a brief executive logistics brief explaining why this redistribution optimizes regional healthcare resilience, how transit times/distances minimize stock-out risks, and emphasize that human clinical validation is required before dispatch.
"""
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error in explain_redistribution_plan: {e}")
        return f"Gemini is currently unavailable. Numerical analysis is still available. Total recommended transfers: {len(transfers)}."


def summarize_critical_phcs(critical_phcs_data: List[Dict[str, Any]]) -> str:
    """Summarizes all high-risk PHCs for state/district health officers."""
    client = _get_gemini_client()
    if not client:
        if not critical_phcs_data:
            return "No critical PHCs detected. All monitored facilities have safe stock coverage and operational capacity."
        return f"Identified {len(critical_phcs_data)} facility stock lines currently at critical/high risk level requiring priority intervention."

    summary_items = "\n".join([
        f"- PHC {item.get('phc_name')} ({item.get('district')}): {item.get('medicine_name')} (Stock: {item.get('current_stock')}, Coverage: {item.get('coverage_days')} days, Lead Time: {item.get('lead_time_days')}d)"
        for item in critical_phcs_data[:12]
    ])

    prompt = f"""
You are the Chief Public Health Intelligence Officer for PHC-SHIELD.
Explain using only the supplied data. Do not invent numbers or facts.

CRITICAL PHC INVENTORY STATUS:
{summary_items}

Synthesize an executive briefing for district health directors highlighting top regional vulnerabilities, recurring medicine categories at risk, and recommended triage actions. Keep it actionable and structured.
"""
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error in summarize_critical_phcs: {e}")
        return f"Gemini is currently unavailable. Numerical analysis is still available. Total critical records: {len(critical_phcs_data)}."


def summarize_emergency_simulation(
    emergency_name: str,
    demand_increase_pct: float,
    duration_days: int,
    affected_phcs_count: int,
    critical_count: int,
    shortage_medicines_count: int,
    transfers_count: int
) -> str:
    """Generates an emergency simulation executive impact assessment."""
    client = _get_gemini_client()
    if not client:
        return (
            f"Simulation Briefing: '{emergency_name}' modeled with a {demand_increase_pct}% demand surge over {duration_days} days. "
            f"Impact: {affected_phcs_count} facilities evaluated, resulting in {critical_count} critical stock alerts and {shortage_medicines_count} deficit medicine categories. "
            f"Emergency buffer optimization recommends {transfers_count} emergency stock balancing transfers."
        )

    prompt = f"""
You are an Emergency Healthcare Incident Commander for PHC-SHIELD.
Explain using only the supplied data. Do not invent numbers or facts.

EMERGENCY SIMULATION PARAMETERS & OUTCOMES:
- Incident Name: {emergency_name}
- Simulated Demand Surge: +{demand_increase_pct}%
- Estimated Surge Duration: {duration_days} days
- Monitored Facilities Impacted: {affected_phcs_count}
- Facilities Escalated to Critical Risk: {critical_count}
- Number of Medicine Types Facing Deficits: {shortage_medicines_count}
- Recommended Peer-to-Peer Inter-Facility Transfers: {transfers_count}

Write a rapid-response emergency brief covering:
1. Assessment of supply chain stress under this surge.
2. High-priority risk containment recommendations.
3. Logistics and staffing readiness instructions.
"""
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error in summarize_emergency_simulation: {e}")
        return f"Gemini is currently unavailable. Numerical analysis is still available.\n\nEmergency Simulation: {emergency_name} (+{demand_increase_pct}% demand surge for {duration_days} days). Critical alerts generated: {critical_count}."


def answer_assistant_query(
    question: str,
    context_data: Dict[str, Any]
) -> str:
    """Answers user freeform questions using live database context."""
    client = _get_gemini_client()
    if not client:
        return (
            "Gemini is currently unavailable. Numerical analysis is still available.\n\n"
            f"Numerical data summary: {context_data.get('summary_text', 'Active database queries available in relevant dashboard tabs.')}"
        )

    prompt = f"""
You are the AI Healthcare Supply Chain Assistant for PHC-SHIELD.
Explain using only the supplied data. Do not invent numbers or facts.
If the supplied data does not contain enough information to answer, state clearly that additional healthcare data must be entered or recorded.

LIVE SYSTEM DATA CONTEXT:
{context_data}

USER QUESTION:
{question}

Provide a direct, accurate, and helpful response based exclusively on the live data provided above.
"""
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini assistant error: {e}")
        return "Gemini is currently unavailable. Numerical analysis is still available."
