import os, json, time, random
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

HOST = os.getenv("MQTT_HOST", "mosquitto")
PORT = int(os.getenv("MQTT_PORT", 1883))
TOPIC = os.getenv("MQTT_TOPIC", "telemetry/pipeline")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.connect(HOST, PORT, 60)

while True:
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "device_id": "pipe-node-001",
        "pressure": round(random.uniform(20.0, 30.0), 2),
        "temperature": round(random.uniform(5.0, 35.0), 2),
        "flow": round(random.uniform(100.0, 200.0), 2)
    }
    client.publish(TOPIC, json.dumps(payload), qos=0)
    time.sleep(2)
