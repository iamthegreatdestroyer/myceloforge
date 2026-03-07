"""
Load testing suite for MYCELOFORGE
Uses Locust for distributed load testing
"""

from locust import HttpUser, task, between
import random
import string


class EmpireUser(HttpUser):
    """Simulates user behavior for empire deployment"""

    wait_time = between(1, 3)

    def on_start(self):
        """Setup per user"""
        self.empire_names = [f"Empire-{i}" for i in range(100)]
        self.seeds = ["seed_" + "".join(random.choices(string.ascii_letters, k=10)) for _ in range(100)]

    @task(3)
    def deploy_empire(self):
        """Empire deployment endpoint - 3x weight"""
        seed = random.choice(self.seeds)
        name = random.choice(self.empire_names)

        response = self.client.post(
            "/api/empire/deploy",
            json={"seed": seed, "name": name},
            headers={"Content-Type": "application/json"},
            name="/api/empire/deploy",
        )

        if response.status_code != 200:
            response.failure(f"Failed with status {response.status_code}")

    @task(1)
    def check_lunar_phase(self):
        """Lunar phase endpoint - 1x weight"""
        response = self.client.get(
            "/api/lunar-phase",
            name="/api/lunar-phase",
        )

        if response.status_code != 200:
            response.failure(f"Failed with status {response.status_code}")

    @task(2)
    def health_check(self):
        """Health check endpoint - 2x weight"""
        response = self.client.get(
            "/api/health",
            name="/api/health",
        )

        if response.status_code != 200:
            response.failure(f"Failed with status {response.status_code}")

    @task(1)
    def check_metrics(self):
        """Metrics endpoint - 1x weight"""
        response = self.client.get(
            "/metrics",
            name="/metrics",
        )

        # Metrics endpoint might return different status
        if response.status_code not in [200, 404]:
            response.failure(f"Failed with status {response.status_code}")


class StressTestUser(HttpUser):
    """Stress test with higher concurrency"""

    wait_time = between(0.5, 1.5)

    def on_start(self):
        """Setup per user"""
        self.request_count = 0

    @task(5)
    def rapid_deployments(self):
        """Rapid empire deployments for stress testing"""
        seed = f"stress_test_{self.request_count}"
        self.request_count += 1

        response = self.client.post(
            "/api/empire/deploy",
            json={"seed": seed},
            headers={"Content-Type": "application/json"},
            name="/api/empire/deploy [stress]",
        )

        if response.status_code not in [200, 429]:  # Allow 429 rate limit
            response.failure(f"Failed with status {response.status_code}")

    @task(3)
    def concurrent_health_checks(self):
        """Concurrent health check requests"""
        response = self.client.get(
            "/api/health",
            name="/api/health [stress]",
        )

        if response.status_code != 200:
            response.failure(f"Failed with status {response.status_code}")


class LongRunningUser(HttpUser):
    """Long-running user simulation for endurance testing"""

    wait_time = between(5, 10)

    def on_start(self):
        """Setup per user"""
        self.session_duration = 0

    @task(1)
    def normal_workflow(self):
        """Normal user workflow simulation"""
        # 1. Check health
        self.client.get("/api/health")

        # 2. Deploy empire
        self.client.post(
            "/api/empire/deploy",
            json={"seed": f"longrun_{self.session_duration}"},
            headers={"Content-Type": "application/json"},
        )

        # 3. Check lunar phase
        self.client.get("/api/lunar-phase")

        self.session_duration += 1
