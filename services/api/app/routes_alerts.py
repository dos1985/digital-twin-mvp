from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from .db import engine

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/latest")
def latest(limit: int = 20):
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT
              id,
              COALESCE(created_at, now()) AS created_at,
              device_id, metric, value, op, threshold, severity
            FROM alerts
            ORDER BY id DESC
            LIMIT :limit
        """), {"limit": limit}).mappings().all()
    return [dict(r) for r in rows]

@router.post("/ack/{alert_id}")
def ack(alert_id: int):
    with engine.begin() as conn:
        conn.execute(text("UPDATE alerts SET status='ack' WHERE id=:id"), {"id": alert_id})
    return {"ok": True}
