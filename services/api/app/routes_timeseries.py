import datetime as dt
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from .db import engine

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.get("/timeseries")
def timeseries(
    device_id: str,
    frm: str | None = None,     # ISO, напр. "2025-09-10T12:00:00Z"
    to: str | None = None,
    bucket: str = "1 minute"
):
    now = dt.datetime.utcnow()
    # аккуратно парсим ISO, если есть 'Z'
    def parse_iso(s: str) -> dt.datetime:
        return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))

    t_to  = parse_iso(to)  if to  else now
    t_frm = parse_iso(frm) if frm else now - dt.timedelta(hours=1)

    sql = text("""
        SELECT
            time_bucket(:bucket, ts)                         AS bucket,
            AVG(pressure)::double precision                  AS pressure,
            AVG(temperature)::double precision               AS temperature,
            AVG(flow)::double precision                      AS flow
        FROM telemetry
        WHERE device_id = :device AND ts BETWEEN :frm AND :to
        GROUP BY bucket
        ORDER BY bucket
    """)

    with engine.connect() as conn:
        rows = conn.execute(
            sql, {"bucket": bucket, "device": device_id, "frm": t_frm, "to": t_to}
        ).mappings().all()    # <-- ключевая разница: mappings()

    # нормализуем время в ISO с суффиксом Z
    data = []
    for r in rows:
        b = r["bucket"]
        if b.tzinfo is None:
            ts_iso = b.isoformat() + "Z"
        else:
            ts_iso = b.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")

        data.append({
            "ts": ts_iso,
            "pressure": r["pressure"],
            "temperature": r["temperature"],
            "flow": r["flow"]
        })

    return JSONResponse(data)
