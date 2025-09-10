from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .mqtt_bridge import start as start_mqtt
from .db import engine
from sqlalchemy import text
from .routes_timeseries import router as ts_router
from .routes_alerts import router as alerts_router

from .routes_geo import router as geo_router

app = FastAPI(title="Digital Twin API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    start_mqtt()

app.include_router(geo_router)
app.include_router(ts_router)
app.include_router(alerts_router)


@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("select 1"))
    return {"status": "ok"}

@app.get("/telemetry/latest")
def latest(limit: int = 50):
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT ts, device_id, pressure, temperature, flow
            FROM telemetry
            ORDER BY ts DESC
            LIMIT :limit
        """), dict(limit=limit)).mappings().all()
        return [dict(r) for r in rows]
