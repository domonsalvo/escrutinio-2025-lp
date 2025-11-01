import React, { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const BASE_URL = 'https://script.google.com/macros/s/AKfycbxpZQqVIJ0D2deCvet6Ph0o4U4YgMu5MHyuTjDYyqpnHZOUTINjy8GaD1yThZe4dgWJdw/exec'
const N = v => { const n=parseInt(v,10); return Number.isFinite(n)?n:0 }

const COLORS = {
  'Lista 501': '#7C3AED',
  'Lista 503': '#38BDF8',
  'Lista 504': '#EF4444',
  'Lista 502': '#22C55E',
  'Lista 13':  '#9CA3AF'
}

function norm(r){
  const g=(...keys)=>{
    for(const k of keys){ if(r[k]!==undefined) return r[k] }
    const low = Object.keys(r).find(h => keys.map(s=>String(s).toLowerCase()).includes(String(h).toLowerCase()))
    return low ? r[low] : undefined
  }
  return {
    seccion: g('Sección','Seccion','SECCION') || '',
    circuito: g('Circuito','CIRCUITO') || '',
    mesa: g('Nro Mesa','Mesa','MESA','nro_mesa') || '',
    a503: N(g('Lista 503 Frente Defendemos LP','Agrup1','Lista 503')),
    a501: N(g('Lista 501 Alianza LLA','Agrup2','Lista 501')),
    a502: N(g('Lista 502 Frente FIT','Agrup3','Lista 502')),
    a504: N(g('Lista 504 Frente Cambia LP','Agrup4','Lista 504')),
    a13:  N(g('Lista 13 MAS','Agrup5','Lista 13')),
    blanco: N(g('Votos Blanco','Blancos')),
    nulo: N(g('Votos Nulos','Nulos')),
    recurrido: N(g('Votos Recurridos','Recurridos')),
    emitidos: N(g('Suma Votos Emitidos','Total_Emitidos','Emitidos'))
  }
}

export default function Resultados(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [secSel, setSecSel] = useState('Todas')
  const [circSel, setCircSel] = useState('Todos')

  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch(`${BASE_URL}?action=getMesas`)
        const js = await res.json()
        setRows((Array.isArray(js)?js:[]).map(norm))
      }catch(e){ console.error(e) }
      finally{ setLoading(false) }
    })()
  },[])

  const secciones = useMemo(()=>['Todas', ...Array.from(new Set(rows.map(r=>r.seccion).filter(Boolean))).sort()], [rows])
  const circuitos = useMemo(()=>['Todos', ...Array.from(new Set(rows.map(r=>r.circuito).filter(Boolean))).sort()], [rows])

  const filtrados = useMemo(()=>{
    return rows.filter(r => (secSel==='Todas' || r.seccion===secSel) && (circSel==='Todos' || r.circuito===circSel))
  },[rows, secSel, circSel])

  const porClave = useMemo(()=>{
    const map = new Map()
    filtrados.forEach(r=>{
      const k = secSel==='Todas' && circSel==='Todos' ? r.seccion || '(sin sección)' : (circSel==='Todos' ? r.seccion : r.circuito || '(sin circuito)')
      if(!map.has(k)) map.set(k, [])
      map.get(k).push(r)
    })
    return Array.from(map.entries()).map(([clave, arr])=>{
      const t = arr.reduce((a,r)=>{
        a.a503+=r.a503; a.a501+=r.a501; a.a502+=r.a502; a.a504+=r.a504; a.a13+=r.a13;
        return a
      },{a503:0,a501:0,a502:0,a504:0,a13:0})
      return { name: clave, 'Lista 503': t.a503, 'Lista 501': t.a501, 'Lista 502': t.a502, 'Lista 504': t.a504, 'Lista 13': t.a13 }
    }).sort((a,b)=> String(a.name).localeCompare(String(b.name)))
  },[filtrados, secSel, circSel])

  function exportCSV(){
    const headers = ['Sección','Circuito','Mesa','Lista 503','Lista 501','Lista 502','Lista 504','Lista 13','Blancos','Nulos','Recurridos','Total emitidos']
    const out = [headers.join(',')]
    filtrados.forEach(r=>{
      out.push([r.seccion, r.circuito, r.mesa, r.a503, r.a501, r.a502, r.a504, r.a13, r.blanco, r.nulo, r.recurrido, r.emitidos].join(','))
    })
    const blob = new Blob([out.join('\n')], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download='ver_resultados_escrutinio_2025.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="filters">
        <div className="row" style="margin:0">
          <label>Sección</label>
          <select value={secSel} onChange={e=>setSecSel(e.target.value)}>
            {secciones.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="row" style="margin:0">
          <label>Circuito</label>
          <select value={circSel} onChange={e=>setCircSel(e.target.value)}>
            {circuitos.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn" onClick={exportCSV}>Exportar CSV</button>
      </div>

      {loading && <div className="muted">Cargando…</div>}

      {!loading && (
        <div style={{width:'100%', height:420}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porClave} margin={{ top:10, right:30, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Lista 503" fill={COLORS['Lista 503']} />
              <Bar dataKey="Lista 501" fill={COLORS['Lista 501']} />
              <Bar dataKey="Lista 502" fill={COLORS['Lista 502']} />
              <Bar dataKey="Lista 504" fill={COLORS['Lista 504']} />
              <Bar dataKey="Lista 13"  fill={COLORS['Lista 13']} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
