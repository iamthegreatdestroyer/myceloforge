"""NexusZero API — Service Orchestrator"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn

app = FastAPI(title="NexusZero", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SERVICE_REGISTRY = {
    "ryzanstein": "http://ryzanstein:8000",
    "negative-space": "http://negative-space:8001",
    "qhss": "http://qhss:8002",
}

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "service": "nexuszero"}

@app.get("/orchestrate")
async def orchestrate():
    """Orchestrate all backend services"""
    services_status = {}

    async with httpx.AsyncClient(timeout=2.0) as client:
        for service_name, service_url in SERVICE_REGISTRY.items():
            try:
                response = await client.get(f"{service_url}/health")
                services_status[service_name] = {
                    "status": response.json().get("status"),
                    "available": True,
                }
            except Exception as e:
                services_status[service_name] = {
                    "available": False,
                    "error": str(e),
                }

    all_healthy = all(s.get("available", False) for s in services_status.values())

    return {
        "orchestrator": "nexuszero",
        "services": services_status,
        "healthy": all_healthy,
    }

@app.post("/deploy-empire")
async def deploy_empire(empire_seed: str):
    """Deploy empire across all services"""
    return {
        "empire_seed": empire_seed,
        "deployment_status": "queued",
        "services_involved": list(SERVICE_REGISTRY.keys()),
        "estimated_completion": "2026-02-28T23:45:00Z",
    }

@app.get("/service/{service_name}/health")
async def check_service_health(service_name: str):
    """Check specific service health"""
    if service_name not in SERVICE_REGISTRY:
        return {"error": "Service not found", "available_services": list(SERVICE_REGISTRY.keys())}

    service_url = SERVICE_REGISTRY[service_name]
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{service_url}/health")
            return response.json()
    except Exception as e:
        return {
            "service": service_name,
            "available": False,
            "error": str(e),
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
