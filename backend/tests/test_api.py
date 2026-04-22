import os
import sys
import unittest

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app


class ApiSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def auth_headers(self) -> dict[str, str]:
        response = self.client.post(
            "/api/auth/login",
            json={"email": "franc@example.com", "password": "securepass123"},
        )
        payload = response.json()
        return {"Authorization": f"Bearer {payload['access_token']}"}

    def test_healthcheck(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_dashboard_payload(self) -> None:
        response = self.client.get("/api/dashboard", headers=self.auth_headers())
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("feed", payload)
        self.assertIn("library", payload)
        self.assertGreaterEqual(len(payload["feed"]), 1)

    def test_auth_login(self) -> None:
        response = self.client.post(
            "/api/auth/login",
            json={"email": "franc@example.com", "password": "securepass123"},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["token_type"], "bearer")
        self.assertIn("access_token", payload)

    def test_games_search(self) -> None:
        response = self.client.get("/api/games/search?q=hades")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(len(payload), 1)
        self.assertTrue(any(item["title"] == "Hades II" for item in payload))
        self.assertTrue(all(item["cover_url"] for item in payload))

    def test_library_add_and_update(self) -> None:
        headers = self.auth_headers()
        search = self.client.get("/api/games/search?q=balatro", headers=headers)
        game_id = next(item["id"] for item in search.json() if item["title"] == "Balatro")

        created = self.client.post(
            "/api/library",
            headers=headers,
            json={"game_id": game_id, "platform": "PC", "status": "want_to_play"},
        )
        self.assertEqual(created.status_code, 200)
        entry_id = created.json()["id"]

        updated = self.client.patch(
            f"/api/library/{entry_id}",
            headers=headers,
            json={"status": "playing", "hours_played": 5, "progress_percent": 20, "playthroughs": 1},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["hours_played"], 5)

    def test_review_draft_create(self) -> None:
        headers = self.auth_headers()
        search = self.client.get("/api/games/search?q=hades", headers=headers)
        game_id = next(item["id"] for item in search.json() if item["title"] == "Hades II")
        response = self.client.post(
            "/api/reviews/drafts",
            headers=headers,
            json={
                "game_id": game_id,
                "verdict": "Incredible combat feel.",
                "body": "Very early draft notes.",
                "scores": {
                    "gameplay": 9,
                    "story": 8,
                    "visuals": 8,
                    "art_direction": 8,
                    "audio": 8,
                    "performance": 8,
                    "world_design": 8,
                    "replayability": 9,
                    "innovation": 8,
                    "emotional_impact": 8,
                },
                "total_score": 88,
                "spoiler": False,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["game_title"], "Hades II")
        self.assertEqual(response.json()["total_score"], 88)

        publish = self.client.post(f"/api/reviews/drafts/{response.json()['id']}/publish", headers=headers)
        self.assertEqual(publish.status_code, 200)
        self.assertEqual(publish.json()["game_title"], "Hades II")
        self.assertEqual(publish.json()["body"], "Very early draft notes.")

    def test_notifications_list(self) -> None:
        response = self.client.get("/api/notifications", headers=self.auth_headers())
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)

    def test_follow_toggle_and_privacy_settings(self) -> None:
        headers = self.auth_headers()
        followed = self.client.post("/api/follows/user-3", headers=headers)
        self.assertEqual(followed.status_code, 200)
        self.assertTrue(any(user["id"] == "user-3" and user["is_following"] for user in followed.json()))

        updated_privacy = self.client.put(
            "/api/users/settings/privacy",
            headers=headers,
            json={
                "profile_visibility": "followers",
                "review_visibility": "public",
                "activity_visibility": "private",
            },
        )
        self.assertEqual(updated_privacy.status_code, 200)
        self.assertEqual(updated_privacy.json()["activity_visibility"], "private")


if __name__ == "__main__":
    unittest.main()
