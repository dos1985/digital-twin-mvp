import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def insert_telemetry(ts, device_id, pressure, temperature, flow):
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO telemetry(ts, device_id, pressure, temperature, flow)
                VALUES (:ts, :device_id, :pressure, :temperature, :flow)
            """),
            dict(ts=ts, device_id=device_id, pressure=pressure, temperature=temperature, flow=flow)
        )
