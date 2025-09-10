import React, { useEffect, useState } from 'react'
import MapView from './components/MapView'
import TelemetryPanel, { Telemetry } from './components/TelemetryPanel'
import XeokitView from './components/XeokitView'
import ChartsPanel from './components/ChartsPanel'
import AlertsPanel from './components/AlertsPanel'
import { api } from './api'
import { probeModel } from './utils/probeModel'

export default function App() {
  const [data, setData] = useState<Telemetry[]>([])
  const [modelUrl, setModelUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // опрос телеметрии
    const tick = async () => {
      try {
        const r = await api.get('/telemetry/latest?limit=50')
        if (!cancelled) setData(r.data)
      } catch {}
    }
    tick()
    const id = setInterval(tick, 2000)

    // пробуем найти 3D модель
    probeModel().then((u) => !cancelled && setModelUrl(u))

    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px 400px', height: '100vh' }}>
      {/* Левая колонка — карта + (опц.) 3D */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: modelUrl ? '1fr 1fr' : '1fr', // если модели нет — 3D ряд исчезает
          minWidth: 0, minHeight: 0
        }}
      >
        <MapView />
        {modelUrl && <XeokitView /* можно передать modelUrl={modelUrl} */ />}
      </div>

      {/* Средняя — телеметрия */}
      <TelemetryPanel data={data} />

      {/* Правая — графики и оповещения */}
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', minWidth: 0, minHeight: 0 }}>
        <ChartsPanel />
        <AlertsPanel />
      </div>
    </div>
  )
}
