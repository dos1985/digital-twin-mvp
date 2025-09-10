import os, json, time
from datetime import datetime
import paho.mqtt.client as mqtt
from sqlalchemy.exc import OperationalError
from .db import insert_telemetry
from sqlalchemy import text
import time
from .db import engine
from datetime import datetime, timezone, timedelta
COOLDOWN_SECONDS = 120


_RULES_CACHE = {"items": [], "ts": 0}

def _load_rules(conn):
    now = time.time()
    if now - _RULES_CACHE["ts"] < 30 and _RULES_CACHE["items"]:
        return _RULES_CACHE["items"]
    rows = conn.execute(text("SELECT id, metric, op, threshold, severity, device_id FROM alert_rules")).mappings().all()
    _RULES_CACHE["items"] = rows
    _RULES_CACHE["ts"] = now
    return rows

def _trips(rule, value: float) -> bool:
    op = rule["op"]
    thr = float(rule["threshold"])
    if value is None: return False
    return ((op == ">"  and value >  thr) or
            (op == "<"  and value <  thr) or
            (op == ">=" and value >= thr) or
            (op == "<=" and value <= thr))

def _check_and_insert_alerts(conn, msg: dict):
    rules = _load_rules(conn)
    for r in rules:
        if r["device_id"] and r["device_id"] != msg["device_id"]:
            continue
        metric = r["metric"]
        val = msg.get(metric)
        if _trips(r, val):
            conn.execute(text("""
                INSERT INTO alerts(device_id, metric, value, op, threshold, severity)
                VALUES (:device_id, :metric, :value, :op, :threshold, :severity)
            """), {
                "device_id": msg["device_id"],
                "metric": metric,
                "value": float(val),
                "op": r["op"],
                "threshold": float(r["threshold"]),
                "severity": r["severity"]
            })

def _recent_alert_exists(conn, device_id, metric, op, threshold, severity):
    last = conn.execute(text("""
        SELECT created_at
        FROM alerts
        WHERE device_id=:device_id AND metric=:metric
          AND op=:op AND threshold=:threshold AND severity=:severity
        ORDER BY id DESC
        LIMIT 1
    """), {
        "device_id": device_id,
        "metric": metric,
        "op": op,
        "threshold": float(threshold),
        "severity": severity
    }).scalar_one_or_none()

    if not last:
        return False
    return (datetime.now(timezone.utc) - last) < timedelta(seconds=COOLDOWN_SECONDS)


MQTT_HOST = os.getenv("MQTT_HOST", "mosquitto")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "telemetry/pipeline")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

def on_connect(client, userdata, flags, reason_code, properties=None):
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())  # уже dict

        row = {
            "ts": datetime.fromisoformat(payload["ts"]) if isinstance(payload.get("ts"), str) else payload.get("ts"),
            "device_id": payload.get("device_id", "unknown"),
            "pressure": payload.get("pressure"),
            "temperature": payload.get("temperature"),
            "flow": payload.get("flow"),
        }

        # 1) пишем телеметрию
        for attempt in range(5):
            try:
                insert_telemetry(**row)
                print("ingested:", row, flush=True)
                break
            except OperationalError:
                time.sleep(1)
        else:
            print("drop message after retries:", row, flush=True)
            return

        # 2) проверяем правила и пишем алерты — в одной транзакции
        from sqlalchemy import text
        from .db import engine

        def _load_rules(conn):
            return conn.execute(text("""
                SELECT id, metric, op, threshold, severity, device_id
                FROM alert_rules
            """)).mappings().all()

        def _trips(r, value):
            if value is None: return False
            op, thr = r["op"], float(r["threshold"])
            v = float(value)
            return ((op == ">" and v > thr) or (op == ">=" and v >= thr) or
                    (op == "<" and v < thr) or (op == "<=" and v <= thr))

        with engine.begin() as conn:
            rules = _load_rules(conn)
            for r in rules:
                if r["device_id"] and r["device_id"] != row["device_id"]:
                    continue
                metric = r["metric"]
                val = row.get(metric)
                if _trips(r, val):
                    conn.execute(text("""
                        INSERT INTO alerts(device_id, metric, value, op, threshold, severity)
                        VALUES (:device_id, :metric, :value, :op, :threshold, :severity)
                    """), {
                        "device_id": row["device_id"],
                        "metric": metric,
                        "value": float(val),
                        "op": r["op"],
                        "threshold": float(r["threshold"]),
                        "severity": r["severity"],
                    })
                    print(f"ALERT: {row['device_id']} {metric}={val} {r['op']} {r['threshold']} ({r['severity']})", flush=True)

    except Exception as e:
        print("MQTT message error:", e, flush=True)



client.on_connect = on_connect
client.on_message = on_message

def start():
    client.connect(MQTT_HOST, MQTT_PORT, 60)
    client.loop_start()
