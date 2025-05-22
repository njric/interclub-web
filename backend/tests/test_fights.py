from datetime import datetime, timedelta
import pytest
from app.models.fight import Fight

def test_list_fights_empty(client):
    response = client.get("/fights")
    assert response.status_code == 200
    assert response.json() == []

def test_create_fight_via_import(client, db_session):
    csv_content = """fighter_a,fighter_a_club,fighter_b,fighter_b_club,weight_class,duration
John Doe,Club A,Jane Smith,Club B,75,3"""

    response = client.post(
        "/fights/import",
        files={"file": ("fights.csv", csv_content.encode(), "text/csv")}
    )

    assert response.status_code == 200
    assert response.json()["imported"] == 1

    # Verify fight was created
    fights = client.get("/fights").json()
    assert len(fights) == 1
    fight = fights[0]
    assert fight["fighter_a"] == "John Doe"
    assert fight["fighter_b"] == "Jane Smith"
    assert fight["weight_class"] == 75
    assert fight["duration"] == 3

def test_start_fight(client, db_session):
    # Create a fight
    fight = Fight(
        id="test-fight-1",
        fight_number=1,
        fighter_a="Fighter A",
        fighter_a_club="Club A",
        fighter_b="Fighter B",
        fighter_b_club="Club B",
        weight_class=70,
        duration=3,
        expected_start=datetime.now(),
        is_completed=False
    )
    db_session.add(fight)
    db_session.commit()

    # Start the fight
    response = client.post(f"/fights/{fight.id}/start")
    assert response.status_code == 200

    # Verify fight started
    started_fight = response.json()
    assert started_fight["actual_start"] is not None
    assert started_fight["actual_end"] is None
    assert not started_fight["is_completed"]

def test_end_fight(client, db_session):
    # Create and start a fight
    start_time = datetime.now() - timedelta(minutes=5)
    fight = Fight(
        id="test-fight-1",
        fight_number=1,
        fighter_a="Fighter A",
        fighter_a_club="Club A",
        fighter_b="Fighter B",
        fighter_b_club="Club B",
        weight_class=70,
        duration=3,
        expected_start=start_time,
        actual_start=start_time,
        is_completed=False
    )
    db_session.add(fight)
    db_session.commit()

    # End the fight
    response = client.post(f"/fights/{fight.id}/end")
    assert response.status_code == 200

    # Verify fight ended
    ended_fight = response.json()
    assert ended_fight["actual_start"] is not None
    assert ended_fight["actual_end"] is not None
    assert ended_fight["is_completed"]
