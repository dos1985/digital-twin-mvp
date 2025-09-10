import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { api } from '../api'


export default function MapView(){
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const m = new maplibregl.Map({
      container: ref.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [71.427, 51.169],
      zoom: 6
    })

    m.on('load', async () => {
      // линия из БД
      const { data: fc } = await api.get('/geo/pipeline')
      m.addSource('pipeline', { type: 'geojson', data: fc })
      m.addLayer({ id:'pipeline-line', type:'line', source:'pipeline',
                   paint:{ 'line-width': 4 } })

      // индекc координат устройств для перелётов
      const { data: list } = await api.get('/geo/devices')
      const deviceIndex: Record<string, [number, number]> =
        Object.fromEntries(list.map((d:any)=>[d.device_id,[d.lon,d.lat]]))

      const onSel = (e: any) => {
        const id = e.detail as string
        const pt = deviceIndex[id]
        if (pt) m.flyTo({ center: pt, zoom: 10 })
      }
      window.addEventListener('select-device', onSel)
      // пример маркера
      if (deviceIndex['pipe-node-001']) {
        new maplibregl.Marker().setLngLat(deviceIndex['pipe-node-001']).addTo(m)
      }

      m.once('remove', () => window.removeEventListener('select-device', onSel))
    })

    return () => m.remove()
  }, [])

  return <div ref={ref} style={{ width:'100%', height:'100%' }} />
}
