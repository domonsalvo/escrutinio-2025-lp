import React, { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const BASE_URL = 'https://script.google.com/macros/s/AKfycbxpZQqVIJ0D2deCvet6Ph0o4U4YgMu5MHyuTjDYyqpnHZOUTINjy8GaD1yThZe4dgWJdw/exec'

const COLORS = {
  'Lista 501': '#7C3AED',
  'Lista 503': '#38BDF8',
  'Lista 504': '#EF4444',
  'Lista 502': '#22C55E',
  'Lista 13':  '#9CA3AF',
  'Blancos': '#B0B0B0',
  'Nulos': '#8B5E3C',
  'Recurridos': '#333333'
}

const N = v => { const n=parseInt(v,10); return Number.isFinite(n)?n:0 }

function norm(r){
  const g=(...keys)=>{
    for(const k of keys){ if(r[k]!==undefined) return r[k] }
    const low = Object.keys(r).find(h => keys.map(s => String(s).toLowerCase()).includes(String(h).toLowerCase()))
    return low ? r[low] : undefined
  }
  return {
    a503: N(g('Lista 503 Frente Defendemos LP','Agrup1','Lista 503')),
    a501: N(g('Lista 501 Alianza LLA','Agrup2','Lista 501')),
    a502: N(g('Lista 502 Frente FIT','Agrup3','Lista 502')),
    a504: N(g('Lista 504 Frente Cambia LP','Agrup4','Lista 504')),
    a13:  N(g('Lista 13 MAS','Agrup5','Lista 13')),
    blanco: N(g('Votos Blanco','Blancos')),
    nulo: N(g('Votos Nulos','Nulos')),
    recurrido: N(g('Votos Recurridos','Recurridos')),
  }
}

export default function Resumen(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

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

  const totals = useMemo(()=>{
    return rows.reduce((a,r)=>{
      a.a503+=r.a503; a.a501+=r.a501; a.a502+=r.a502; a.a504+=r.a504; a.a13+=r.a13;
      a.blanco+=r.blanco; a.nulo+=r.nulo; a.recurrido+=r.recurrido; return a
    },{a503:0,a501:0,a502:0,a504:0,a13:0,blanco:0,nulo:0,recurrido:0})
  },[rows])

  const barData = [
    { name:'Lista 501', value: totals.a501 },
    { name:'Lista 503', value: totals.a503 },
    { name:'Lista 504', value: totals.a504 },
    { name:'Lista 502', value: totals.a502 },
    { name:'Lista 13', value: totals.a13 },
    { name:'Blancos', value: totals.blanco },
    { name:'Nulos', value: totals.nulo },
    { name:'Recurridos', value: totals.recurrido }
  ]

  const pieData = barData.map(d=>({ ...d, color: COLORS[d.name] || '#8884d8' }))

  function exportCSV(){
    const headers = ['Grupo','Votos']
    const out = [headers.join(',')]
    barData.forEach(r=> out.push([r.name, r.value].join(',')))
    const blob = new Blob([out.join('\n')], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download='resumen_general_escrutinio_2025.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      {loading && <div className="muted">Cargando…</div>}
      {!loading && (
        <>
          <div className="charts-grid">
            <div style={{width:'100%', height:360}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top:10, right:30, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Votos">
                    {barData.map((d,i)=>(
                      <Cell key={d.name} fill={COLORS[d.name] || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{width:'100%', height:360}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={130} label>
                    {pieData.map((e,i)=>(<Cell key={i} fill={e.color} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="center" style={{marginTop:16}}>
            <button className="btn" onClick={exportCSV}>Exportar a CSV</button>
          </div>
        </>
      )}
    </div>
  )
}
