def test_empty_db_on_startup(client):
    """Verifies that on clean launch, no pre-seeded or hardcoded data exists."""
    # Check PHCs list
    res_phc = client.get("/api/phcs")
    assert res_phc.status_code == 200
    assert res_phc.json() == []

    # Check Medicines list
    res_med = client.get("/api/medicines")
    assert res_med.status_code == 200
    assert res_med.json() == []

    # Check Stocks list
    res_stock = client.get("/api/stock")
    assert res_stock.status_code == 200
    assert res_stock.json() == []

    # Check Alerts list
    res_alerts = client.get("/api/alerts")
    assert res_alerts.status_code == 200
    assert res_alerts.json() == []

    # Check Dashboard Stats
    res_dash = client.get("/api/dashboard/stats")
    assert res_dash.status_code == 200
    data = res_dash.json()
    assert data["has_data"] is False
    assert data["total_phcs"] is None
    assert data["total_stock_units"] is None
    assert data["active_alerts"] is None

    # Check Redistribution
    res_redis = client.get("/api/redistribution")
    assert res_redis.status_code == 200
    redis_data = res_redis.json()
    assert redis_data["total_transfers"] == 0
    assert redis_data["transfers"] == []

    # Check Federated Status
    res_fed = client.get("/api/federated/status")
    assert res_fed.status_code == 200
    fed_data = res_fed.json()
    assert fed_data["can_train"] is False
    assert "Add district data" in fed_data["message"]
