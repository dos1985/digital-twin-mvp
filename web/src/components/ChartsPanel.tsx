import React, { useEffect, useState } from 'react'
import { api } from '../api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

type Point = { ts: string; pressure?: number; temperature?: number; flow?: number }

export default function ChartsPanel() {
  const [device, setDevice] = useState<string>('pipe-node-001')
  const [data, setData] = useState<Point[]>([])

  useEffect(() => {
    const onSel = (e: any) => setDevice(e.detail as string)
    window.addEventListener('select-device', onSel)
    return () => window.removeEventListener('select-device', onSel)
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      const to = new Date().toISOString()
      const frm = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1h
      const r = await api.get(`/telemetry/timeseries`, { params: { device_id: device, frm, to, bucket: '1 minute' }})
      if (!cancelled) setData(r.data)
    }
    fetchData()
    const id = setInterval(fetchData, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [device])

  const tsFormatter = (v: string) => new Date(v).toLocaleTimeString()

  const Chart = ({ dataKey, label }: { dataKey: keyof Point, label: string }) => (
    <div style={{height: '32vh', padding: '8px 12px'}}>
      <div style={{color:'#ccc', margin:'4px 0 6px'}}>{label} — {device}</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" tickFormatter={tsFormatter} />
          <YAxis />
          <Tooltip labelFormatter={(v)=>new Date(v as string).toLocaleString()} />
          <Line type="monotone" dataKey={dataKey as string} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <div style={{background:'#0f172a', color:'white', overflow:'auto'}}>
      <Chart dataKey="pressure"    label="Давление (P)" />
      <Chart dataKey="temperature" label="Температура (T)" />
      <Chart dataKey="flow"        label="Расход (Q)" />
    </div>
  )
}