import React, { useEffect, useState } from 'react'
import { api } from '../api'

type Alert = {
  id: number
  created_at: string
  device_id: string
  metric: string
  value: number
  op: string
  threshold: number
  severity: 'info' | 'warning' | 'critical' | string
}

export default function AlertsPanel() {
  const [items, setItems] = useState<Alert[]>([])

  useEffect(() => {
    let cancel = false
    const tick = async () => {
      try {
        const r = await api.get('/alerts/latest?limit=50')
        if (!cancel) setItems(r.data)
      } catch {}
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => { cancel = true; clearInterval(id) }
  }, [])

  const color = (s: string) => (s === 'critical' ? '#b91c1c' : s === 'warning' ? '#b45309' : '#2563eb')
  const sevRu = (s: string) => (s === 'critical' ? 'Критично' : s === 'warning' ? 'Предупреждение' : 'Инфо')

  return (
    <div style={{ padding: 12, overflow: 'auto', background: '#0b1020', color: '#e6edf3' }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Оповещения</h3>
      {items.map(a => (
        <div key={a.id} style={{
          marginBottom: 8, padding: 8, borderRadius: 8, background: '#0f172a',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)', borderLeft: `4px solid ${color(a.severity)}`
        }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(a.created_at).toLocaleString('ru-RU')}</div>
          <div><b>{a.device_id}</b>: {a.metric} {a.op} {a.threshold} → <b>{a.value.toFixed(2)}</b></div>
          <div style={{ fontSize: 12, color: color(a.severity) }}>{sevRu(a.severity).toUpperCase()}</div>
        </div>
      ))}
    </div>
  )
}
