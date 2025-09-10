import React from 'react'

export type Telemetry = {
  ts: string
  device_id: string
  pressure?: number
  temperature?: number
  flow?: number
}

export default function TelemetryPanel({ data }: { data: Telemetry[] }) {
  const fmt = (v?: number) => (typeof v === 'number' ? v.toFixed(2) : '—')

  return (
    <div style={{ padding: 16, overflow: 'auto', background: '#0b1020', color: '#e6edf3' }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Последняя телеметрия</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#0b1020' }}>
          <tr>
            <th align="left" style={{ padding: '6px 4px' }}>Время</th>
            <th align="left" style={{ padding: '6px 4px' }}>Устройство</th>
            <th align="right" style={{ padding: '6px 4px' }}>Давление (P)</th>
            <th align="right" style={{ padding: '6px 4px' }}>Температура (T)</th>
            <th align="right" style={{ padding: '6px 4px' }}>Расход (Q)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={`${r.ts}-${r.device_id}-${i}`}>
              <td style={{ padding: '4px' }}>{new Date(r.ts).toLocaleString('ru-RU')}</td>
              <td style={{ padding: '4px' }}>{r.device_id}</td>
              <td align="right" style={{ padding: '4px' }}>{fmt(r.pressure)}</td>
              <td align="right" style={{ padding: '4px' }}>{fmt(r.temperature)}</td>
              <td align="right" style={{ padding: '4px' }}>{fmt(r.flow)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
