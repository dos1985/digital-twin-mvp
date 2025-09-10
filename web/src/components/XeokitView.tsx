import React, { useEffect, useRef } from 'react'
export default function XeokitView(){
  const ref = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(!ref.current) return
    ref.current.innerHTML = '<div style="color:#999;padding:16px">Xeokit 3D — положи модель в public/models и подключи загрузчик</div>'
  },[])
  return <div ref={ref} style={{background:'#111', color:'#fff'}} />
}
