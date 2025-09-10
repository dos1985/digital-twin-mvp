# Digital Twin MVP – Starter Kit

One-command PoC for a pipeline digital twin:
- FastAPI (Python) – API/WebSocket
- Mosquitto (MQTT) – telemetry
- PostgreSQL + TimescaleDB + PostGIS – telemetry & geo
- GeoServer – WMS/WFS
- React + TypeScript + MapLibre + Xeokit – frontend
- MinIO (S3) – models/files

See `.env.example`, copy to `.env` and run:

```bash
docker compose up -d --build
```
