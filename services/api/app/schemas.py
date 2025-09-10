from pydantic import BaseModel
from datetime import datetime

class TelemetryIn(BaseModel):
    ts: datetime
    device_id: str
    pressure: float | None = None
    temperature: float | None = None
    flow: float | None = None
