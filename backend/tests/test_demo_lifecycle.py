def test_demo_load_and_clear_lifecycle(client):
    """Verifies that synthetic demo dataset loads properly and clears cleanly."""
    # 1. Initially empty
    res_init = client.get("/api/phcs")
    assert res_init.json() == []

    # 2. Load demo dataset
    res_load = client.post("/api/demo/load")
    assert res_load.status_code == 200
    load_json = res_load.json()
    assert load_json["status"] == "SUCCESS"
    assert load_json["phcs_created"] >= 3

    # Check that PHCs now exist and are tagged is_demo=True
    res_phcs = client.get("/api/phcs")
    assert len(res_phcs.json()) >= 3
    for p in res_phcs.json():
        assert p["is_demo"] is True

    # Check dashboard stats
    res_dash = client.get("/api/dashboard/stats")
    dash_json = res_dash.json()
    assert dash_json["has_data"] is True
    assert dash_json["is_demo_active"] is True
    assert dash_json["total_phcs"] >= 3

    # Check alerts generated
    res_alerts = client.get("/api/alerts")
    assert len(res_alerts.json()) > 0

    # 3. Clear demo dataset
    res_clear = client.delete("/api/demo/clear")
    assert res_clear.status_code == 200
    clear_json = res_clear.json()
    assert clear_json["status"] == "CLEARED"

    # Check that all tables are clean again
    res_phcs_after = client.get("/api/phcs")
    assert len(res_phcs_after.json()) == 0

    res_dash_after = client.get("/api/dashboard/stats")
    assert res_dash_after.json()["has_data"] is False
    assert res_dash_after.json()["is_demo_active"] is False
