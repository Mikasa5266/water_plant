from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
from uuid import uuid4

from .routers.ai import router as ai_router

app = FastAPI(title="Smart Water Plant API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router, prefix="/api")


@app.get("/plant/overview")
def get_plant_overview():
    return {
        "id": "plant-main",
        "name": "Main Water Plant",
        "status": "normal",
        "waterQuality": {
            "turbidity": 0.42,
            "ph": 7.2,
            "residualChlorine": 0.35,
        },
        "activeAlertCount": 0,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/devices")
def list_devices():
    return [
        {
            "id": "pump-001",
            "name": "Intake Pump 1",
            "type": "pump",
            "status": "running",
            "simulationNodeId": "pump-001",
            "metrics": [
                {"key": "flow_rate", "label": "Flow Rate", "value": 1280, "unit": "m3/h"}
            ],
        },
        {
            "id": "dosing-001",
            "name": "Dosing Unit A",
            "type": "dosing-unit",
            "status": "running",
            "simulationNodeId": "dosing-001",
            "metrics": [
                {"key": "dosage", "label": "Dosage", "value": 2.5, "unit": "mg/L"}
            ],
        },
        {
            "id": "filter-uf-001",
            "name": "UF Membrane Module 1",
            "type": "filter",
            "status": "running",
            "simulationNodeId": "filter-uf-001",
            "metrics": [
                {"key": "pressure_diff", "label": "Pressure Diff", "value": 0.8, "unit": "bar"}
            ],
        },
        {
            "id": "filter-ro-001",
            "name": "RO Membrane Module 1",
            "type": "filter",
            "status": "running",
            "simulationNodeId": "filter-ro-001",
            "metrics": [
                {"key": "rejection_rate", "label": "Rejection Rate", "value": 99.2, "unit": "%"}
            ],
        },
    ]


@app.get("/alerts")
def list_alerts():
    return []


class CreateAgentRunRequest(BaseModel):
    goal: str
    context: dict | None = None


@app.post("/agent/runs", status_code=202)
def create_agent_run(req: CreateAgentRunRequest):
    return {
        "id": f"run-{uuid4().hex[:8]}",
        "status": "queued",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health")
def health():
    return {"status": "ok"}
