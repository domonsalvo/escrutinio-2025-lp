import React, { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const BASE_URL = 'https://script.google.com/macros/s/AKfycbxpZQqVIJ0D2deCvet6Ph0o4U4YgMu5MHyuTjDYyqpnHZOUTINjy8GaD1yThZe4dgWJdw/exec'

function n(v){ const x=parseInt(v,10); return Number.isFinite(x)?x:0 }

function normRow(r){
  const get = (keys)=>{
    for(const k of keys){
      if(r[k]!==undefined) return r[k]
      const kk = Object.keys(r).find(h=> String(h).trim().toLowerCase()===k.toLowerCase())
      if(kk) return r[kk]
    }
    return undefined
  }
  return {
    a1: n(get(['votos_agrup1','agrup1','Lista 503','Agrup1'])),
    a2: n(get(['votos_agrup2','agrup2','Lista 501','Agrup2'])),
    a3: n(get(['votos_agrup3','agrup3','Lista 502','Agrup3'])),
    a4: n(get(['votos_agrup4','agrup4','Lista 504','Agrup4'])),
    a5: n(get(['votos_agrup5','agrup5','Lista 13','Agrup5'])),
    blanco: n(get(['votos_blanco','blancos','blanco','Blancos'])),
    nulo: n(get(['votos_nulos','nulos','nulo','Nulos'])),
    recurrido: n(get(['votos_recurridos','recurridos','recurrido','Recurridos'])),
    emitidos: n(get(['total_emitidos','emitidos','Total_Emitidos'])),
    seccion: get(['seccion','Sección','SECCION']) || '',
    circuito: get(['circuito','CIRCUITO']) || '',
    mesa: get(['nro_mesa','mesa','MESA','Mesa']) || ''
  }
}

export default function Resumen(){
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch(`${BASE_URL}?action=getMesas`)
        const js = await res.json()
        setRows(js.map(normRow))
      }catch(e){ console.error(e) }
      finally{ setLoading(false) }
    })()
  },[])

  const totals = useMemo(()=>{
    return rows.reduce((acc,r)=>{
      acc.a1+=r.a1; acc.a2+=r.a2; acc.a3+=r.a3; acc.a4+=r.a4; acc.a5+=r.a5;
      acc.blanco+=r.blanco; acc.nulo+=r.nulo; acc.recurrido+=r.recurrido; acc.emitidos+=r.emitidos;
      return acc
    }, {a1:0,a2:0,a3:0,a4:0,a5:0,blanco:0,nulo:0,recurrido:0,emitidos:0})
  },[rows])

  const totalVotos = totals.a1+totals.a2+totals.a3+totals.a4+totals.a5+totals.blanco+totals.nulo+totals.recurrido || totals.emitidos

  const pieData = [
    { name: 'Lista 503', value: totals.a1, color: '#00BFFF' },
    { name: 'Lista 501', value: totals.a2, color: '#8A2BE2' },
    { name: 'Lista 502', value: totals.a3, color: '#2E7D32' },
    { name: 'Lista 504', value: totals.a4, color: '#E53935' },
    { name: 'Lista 13', value: totals.a5, color: '#9E9E9E' },
    { name: 'Blancos', value: totals.blanco, color: '#B0B0B0' },
    { name: 'Nulos', value: totals.nulo, color: '#8B5E3C' },
    { name: 'Recurridos', value: totals.recurrido, color: '#333333' }
  ]

  const fmtPct = (v)=> totalVotos? ((v/totalVotos)*100).toFixed(1)+'%':'0.0%'
  const label = ({ name, value }) => `${name}: ${value} (${fmtPct(value)})`

  function exportCSV(){
    const headers = ['Sección','Circuito','Mesa','Lista 503','Lista 501','Lista 502','Lista 504','Lista 13','Blancos','Nulos','Recurridos','Total emitidos']
    const lines = [headers.join(',')]
    rows.forEach(r=>{
      lines.push([r.seccion, r.circuito, r.mesa, r.a1, r.a2, r.a3, r.a4, r.a5, r.blanco, r.nulo, r.recurrido, r.emitidos].join(','))
    })
    lines.push(['TOTAL','','', totals.a1, totals.a2, totals.a3, totals.a4, totals.a5, totals.blanco, totals.nulo, totals.recurrido, totals.emitidos].join(','))
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resultados_escrutinio_2025.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Distribución general de votos</h2>

      {loading && <div className="text-sm text-gray-600">Cargando resumen…</div>}

      {!loading && (
        <>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={140} label={label}>
                  {pieData.map((e, i)=>(<Cell key={i} fill={e.color} />))}
                </Pie>
                <Tooltip formatter={(val, name)=>[val, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center">
            <button onClick={exportCSV} className="mt-2 px-4 py-2 rounded bg-black text-white">Exportar a CSV</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border mt-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Agrupación</th>
                  <th className="border p-2">Votos</th>
                  <th className="border p-2">% sobre emitidos</th>
                </tr>
              </thead>
              <tbody>
                {pieData.map((row)=>(
                  <tr key={row.name}>
                    <td className="border p-2">{row.name}</td>
                    <td className="border p-2">{row.value}</td>
                    <td className="border p-2">{fmtPct(row.value)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="border p-2">Total emitidos</td>
                  <td className="border p-2">{totalVotos}</td>
                  <td className="border p-2">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
