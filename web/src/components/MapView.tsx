import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      zoomControl: true,
      attributionControl: false
    }).setView([47.0, 53.5], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18
    }).addTo(map);

    // «Подсветка» трубы: нижняя широкая подложка + верхняя линия
    const pipeBaseStyle: L.PathOptions = { color: "#0ea5e9", opacity: 0.35, weight: 12 };
    const pipeLineStyle: L.PathOptions = { color: "#22d3ee", opacity: 0.95, weight: 5, dashArray: "12 8" };

    // Грузим geo/pipes.geojson, если нет — рисуем демо
    fetch("/geo/pipes.geojson")
      .then(r => (r.ok ? r.json() : Promise.reject(new Error("no geojson"))))
      .then((gj) => {
        const base = L.geoJSON(gj, { style: pipeBaseStyle }).addTo(map);
        const line = L.geoJSON(gj, { style: (f) => {
          // можно варьировать стиль по свойствам
          const s = f?.properties?.status;
          return s === "planned" ? { ...pipeLineStyle, color: "#f59e0b", dashArray: "6 6" } : pipeLineStyle;
        }}).addTo(map);
        const bounds = base.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
      })
      .catch(() => {
        // Fallback: простая демонстрационная линия
        const demo = L.polyline(
          [[46.7, 51.0], [46.8, 51.5], [46.9, 52.2], [47.0, 53.1], [47.15, 54.0], [47.25, 54.9]],
          pipeBaseStyle
        ).addTo(map);
        L.polyline(demo.getLatLngs() as L.LatLngExpression[], pipeLineStyle).addTo(map);
        map.fitBounds(demo.getBounds().pad(0.1));
      });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  return (
    <div id="map" style={{ width: "100%", height: "100%", background: "#0b1020" }} />
  );
}