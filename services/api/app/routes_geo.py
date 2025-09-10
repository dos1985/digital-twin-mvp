import json
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from .db import engine  # берем engine из существующего db.py


router = APIRouter(prefix="/geo", tags=["geo"])

@router.get("/pipeline")
def pipeline():
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT id, name, status, diameter_mm, wall_mm,
                   COALESCE(kp_from,0) AS kp_from, COALESCE(kp_to,0) AS kp_to,
                   ST_AsGeoJSON(geom) AS geom
            FROM pipeline_segments
            WHERE geom IS NOT NULL
        """)).mappings().all()
    return {
        "type": "FeatureCollection",
        "features": [
            {
              "type":"Feature",
              "geometry": json.loads(r["geom"]),
              "properties": {
                "id": r["id"], "name": r["name"], "status": r["status"],
                "diameter_mm": r["diameter_mm"], "wall_mm": r["wall_mm"],
                "kp_from": float(r["kp_from"]), "kp_to": float(r["kp_to"])
              }
            } for r in rows
        ]
    }



@router.get("/devices")
def devices():
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT device_id, ST_X(location) AS lon, ST_Y(location) AS lat FROM devices"
        )).all()
    return [{"device_id":r.device_id, "lon":float(r.lon), "lat":float(r.lat)} for r in rows]
