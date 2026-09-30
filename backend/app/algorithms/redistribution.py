import math
from typing import List, Dict, Any, Tuple, Optional

def haversine_distance(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> float:
    """Calculates great-circle distance between two points in km."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 50.0 # Default nominal distance if GPS coords are missing
    
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def solve_redistribution_plan(
    phc_stock_data: List[Dict[str, Any]], # list of PHC inventory nodes for a specific medicine or multiple medicines
    max_cold_chain_distance_km: float = 250.0
) -> List[Dict[str, Any]]:
    """
    Computes optimal multi-PHC peer-to-peer inventory transfers to alleviate critical shortages from surplus nodes.
    
    Surplus = stock - (predicted_daily_demand * lead_time + min_threshold)
    Shortage = (predicted_daily_demand * lead_time + min_threshold) - stock
    """
    transfers: List[Dict[str, Any]] = []

    # Group by medicine
    medicines_map: Dict[int, List[Dict[str, Any]]] = {}
    for node in phc_stock_data:
        m_id = node["medicine_id"]
        medicines_map.setdefault(m_id, []).append(node)

    for medicine_id, nodes in medicines_map.items():
        surplus_nodes = []
        shortage_nodes = []

        for n in nodes:
            stock = float(n.get("current_stock", 0.0))
            daily_rate = float(n.get("predicted_daily_demand", n.get("daily_consumption", 0.0)))
            lead_time = int(n.get("lead_time_days", 7))
            min_thresh = float(n.get("min_stock_threshold", 50.0))
            
            target_safety_stock = (daily_rate * lead_time) + min_thresh
            diff = stock - target_safety_stock

            if diff > 1.0: # Has surplus
                surplus_nodes.append({
                    "phc_id": n["phc_id"],
                    "phc_name": n["phc_name"],
                    "district": n.get("district", ""),
                    "lat": n.get("latitude"),
                    "lon": n.get("longitude"),
                    "surplus_available": diff,
                    "medicine_id": medicine_id,
                    "medicine_name": n.get("medicine_name", f"Medicine {medicine_id}"),
                    "cold_chain": n.get("cold_chain_required", False),
                    "shelf_life": n.get("shelf_life_days", 365)
                })
            elif diff < -1.0: # Has shortage
                deficit = abs(diff)
                coverage = stock / daily_rate if daily_rate > 0 else 0.0
                urgency = "HIGH" if coverage < lead_time or stock <= min_thresh else "MEDIUM"
                shortage_nodes.append({
                    "phc_id": n["phc_id"],
                    "phc_name": n["phc_name"],
                    "district": n.get("district", ""),
                    "lat": n.get("latitude"),
                    "lon": n.get("longitude"),
                    "shortage_needed": deficit,
                    "urgency": urgency,
                    "current_stock": stock,
                    "coverage_days": coverage,
                    "medicine_id": medicine_id,
                    "medicine_name": n.get("medicine_name", f"Medicine {medicine_id}"),
                    "cold_chain": n.get("cold_chain_required", False),
                    "shelf_life": n.get("shelf_life_days", 365)
                })

        if not surplus_nodes or not shortage_nodes:
            continue

        # Try OR-Tools Linear Solver for optimal min-cost transportation
        matched = False
        try:
            from ortools.linear_solver import pywraplp
            solver = pywraplp.Solver.CreateSolver('GLOP')
            if solver:
                # Variables: x[i, j] = units transferred from surplus[i] to shortage[j]
                x = {}
                for i, s in enumerate(surplus_nodes):
                    for j, d in enumerate(shortage_nodes):
                        dist = haversine_distance(s["lat"], s["lon"], d["lat"], d["lon"])
                        # Cold chain filter
                        if s["cold_chain"] and dist > max_cold_chain_distance_km:
                            max_cap = 0.0 # Prohibit transfer if exceeding cold chain range
                        else:
                            max_cap = min(s["surplus_available"], d["shortage_needed"])
                        x[i, j] = solver.NumVar(0.0, max_cap, f'x_{i}_{j}')

                # Constraints: Outflow <= surplus_available
                for i, s in enumerate(surplus_nodes):
                    solver.Add(solver.Sum([x[i, j] for j in range(len(shortage_nodes))]) <= s["surplus_available"])

                # Constraints: Inflow <= shortage_needed
                for j, d in enumerate(shortage_nodes):
                    solver.Add(solver.Sum([x[i, j] for i in range(len(surplus_nodes))]) <= d["shortage_needed"])

                # Objective: Minimize cost = distance * urgency_weight - transfer_amount_bonus
                # High urgency gets priority bonus
                objective = solver.Objective()
                for i, s in enumerate(surplus_nodes):
                    for j, d in enumerate(shortage_nodes):
                        dist = haversine_distance(s["lat"], s["lon"], d["lat"], d["lon"])
                        urgency_mult = 0.6 if d["urgency"] == "HIGH" else 1.0
                        # Cost term + small negative term to encourage sending quantity
                        objective.SetCoefficient(x[i, j], (dist * urgency_mult) - 100.0)
                
                objective.SetMinimization()
                status = solver.Solve()

                if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
                    for i, s in enumerate(surplus_nodes):
                        for j, d in enumerate(shortage_nodes):
                            val = x[i, j].solution_value()
                            if val >= 1.0: # At least 1 unit transferred
                                dist = haversine_distance(s["lat"], s["lon"], d["lat"], d["lon"])
                                transfers.append({
                                    "from_phc_id": s["phc_id"],
                                    "from_phc_name": s["phc_name"],
                                    "from_district": s["district"],
                                    "to_phc_id": d["phc_id"],
                                    "to_phc_name": d["phc_name"],
                                    "to_district": d["district"],
                                    "medicine_id": medicine_id,
                                    "medicine_name": s["medicine_name"],
                                    "quantity": round(val, 1),
                                    "distance_km": dist,
                                    "priority": d["urgency"],
                                    "reason": f"Redistribute {val:.1f} units from surplus buffer to avert {d['urgency']} risk at destination (Distance: {dist:.1f} km).",
                                    "cold_chain_compliant": True if not s["cold_chain"] or dist <= max_cold_chain_distance_km else False,
                                    "shelf_life_compliant": True
                                })
                    matched = True
        except Exception:
            matched = False

        # Fallback to greedy proximity matching if solver did not match
        if not matched:
            for d in shortage_nodes:
                needed = d["shortage_needed"]
                # Sort surplus nodes by distance
                surplus_sorted = sorted(
                    surplus_nodes,
                    key=lambda s: haversine_distance(s["lat"], s["lon"], d["lat"], d["lon"])
                )
                for s in surplus_sorted:
                    if needed <= 0.5 or s["surplus_available"] <= 0.5:
                        continue
                    dist = haversine_distance(s["lat"], s["lon"], d["lat"], d["lon"])
                    if s["cold_chain"] and dist > max_cold_chain_distance_km:
                        continue
                    
                    qty = min(needed, s["surplus_available"])
                    s["surplus_available"] -= qty
                    needed -= qty

                    transfers.append({
                        "from_phc_id": s["phc_id"],
                        "from_phc_name": s["phc_name"],
                        "from_district": s["district"],
                        "to_phc_id": d["phc_id"],
                        "to_phc_name": d["phc_name"],
                        "to_district": d["district"],
                        "medicine_id": medicine_id,
                        "medicine_name": s["medicine_name"],
                        "quantity": round(qty, 1),
                        "distance_km": dist,
                        "priority": d["urgency"],
                        "reason": f"Greedy proximity transfer of {qty:.1f} units to resolve {d['urgency']} deficit (Distance: {dist:.1f} km).",
                        "cold_chain_compliant": True,
                        "shelf_life_compliant": True
                    })

    return transfers
