import React, { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
    seccion: get(['seccion','Sección','SECCION']) || '',
    circuito: get(['circuito','CIRCUITO']) || '',
    mesa: get(['nro_mesa','mesa','MESA','Mesa']) || '',
    a1: n(get(['votos_agrup1','agrup1','Lista 503','Agrup1'])),
    a2: n(get(['votos_agrup2','agrup2','Lista 501','Agrup2'])),
    a3: n(get(['votos_agrup3','agrup3','Lista 502','Agrup3'])),
    a4: n(get(['votos_agrup4','agrup4','Lista 504','Agrup4'])),
    a5: n(get(['votos_agrup5','agrup5','Lista 13','Agrup5'])),
    blanco: n(get(['votos_blanco','blancos','blanco','Blancos'])),
    nulo: n(get(['votos_nulos','nulos','nulo','Nulos'])),
    recurrido: n(get(['votos_recurridos','recurridos','recurrido','Recurridos'])),
    emitidos: n(get(['total_emitidos','emitidos','Total_Emitidos']))
  }
}

function sumRows(rows){
  return rows.reduce((acc,r)=>{
    acc.a1+=r.a1; acc.a2+=r.a2; acc.a3+=r.a3; acc.a4+=r.a4; acc.a5+=r.a5;
    acc.blanco+=r.blanco; acc.nulo+=r.nulo; acc.recurrido+=r.recurrido; acc.emitidos+=r.emitidos;
    return acc
  }, {a1:0,a2:0,a3:0,a4:0,a5:0,blanco:0,nulo:0,recurrido:0,emitidos:0})
}

export default function Resultados(){
  const [raw,setRaw]=useState([])
  const [vista,setVista]=useState('seccion')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch(`${BASE_URL}?action=getMesas`)
        const js = await res.json()
        setRaw(js.map(normRow))
      }catch(e){ console.error(e) }
      finally{ setLoading(false) }
    })()
  },[])

  const porSeccion = useMemo(()=>{
    const map = new Map()
    for(const r of raw){
      if(!map.has(r.seccion)) map.set(r.seccion, [])
      map.get(r.seccion).push(r)
    }
    const rows=[]
    for(const [sec, arr] of map.entries()){
      const s=sumRows(arr)
      rows.push({ key: sec || '(sin sección)', ...s })
    }
    return rows.sort((a,b)=> String(a.key).localeCompare(String(b.key)))
  },[raw])

  const porCircuito = useMemo(()=>{
    const map = new Map()
    for(const r of raw){
      if(!map.has(r.circuito)) map.set(r.circuito, [])
      map.get(r.circuito).push(r)
    }
    const blocks=[]
    for(const [circ, arr] of map.entries()){
      const total=sumRows(arr)
      const detalle=arr.map(x=>({ mesa:x.mesa, a1:x.a1,a2:x.a2,a3:x.a3,a4:x.a4,a5:x.a5, blanco:x.blanco, nulo:x.nulo, recurrido:x.recurrido, emitidos:x.emitidos })).sort((a,b)=> n(a.mesa)-n(b.mesa))
      blocks.push({ circuito: circ || '(sin circuito)', total, detalle })
    }
    return blocks.sort((a,b)=> String(a.circuito).localeCompare(String(b.circuito)))
  },[raw])

  const dataBarSeccion = porSeccion.map(r=>({ name:r.key, 'Lista 503':r.a1, 'Lista 501':r.a2, 'Lista 502':r.a3, 'Lista 504':r.a4, 'Lista 13':r.a5 }))

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={()=>setVista('seccion')} className={`px-4 py-2 rounded ${vista==='seccion'?'bg-black text-white':'bg-gray-200'}`}>Por Sección</button>
        <button onClick={()=>setVista('circuito')} className={`px-4 py-2 rounded ${vista==='circuito'?'bg-black text-white':'bg-gray-200'}`}>Por Circuito</button>
      </div>

      {loading && <div className="text-sm text-gray-600">Cargando resultados…</div>}

      {!loading && vista==='seccion' && (
        <>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBarSeccion} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Lista 503" />
                <Bar dataKey="Lista 501" />
                <Bar dataKey="Lista 502" />
                <Bar dataKey="Lista 504" />
                <Bar dataKey="Lista 13" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border mt-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Sección</th>
                  <th className="border p-2">Lista 503</th>
                  <th className="border p-2">Lista 501</th>
                  <th className="border p-2">Lista 502</th>
                  <th className="border p-2">Lista 504</th>
                  <th className="border p-2">Lista 13</th>
                  <th className="border p-2">Blanco</th>
                  <th className="border p-2">Nulo</th>
                  <th className="border p-2">Recurrido</th>
                  <th className="border p-2">Total Emitidos</th>
                </tr>
              </thead>
              <tbody>
                {porSeccion.map(row=> (
                  <tr key={row.key}>
                    <td className="border p-2 font-semibold">{row.key}</td>
                    <td className="border p-2">{row.a1}</td>
                    <td className="border p-2">{row.a2}</td>
                    <td className="border p-2">{row.a3}</td>
                    <td className="border p-2">{row.a4}</td>
                    <td className="border p-2">{row.a5}</td>
                    <td className="border p-2">{row.blanco}</td>
                    <td className="border p-2">{row.nulo}</td>
                    <td className="border p-2">{row.recurrido}</td>
                    <td className="border p-2 font-semibold">{row.emitidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && vista==='circuito' && (
        <div className="space-y-8">
          {porCircuito.map(block=> (
            <div key={block.circuito} className="border rounded-lg">
              <div className="px-4 py-3 bg-gray-100 font-semibold">
                Circuito: {block.circuito}
              </div>
              <div className="overflow-x-auto p-4">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2">Mesa</th>
                      <th className="border p-2">Lista 503</th>
                      <th className="border p-2">Lista 501</th>
                      <th className="border p-2">Lista 502</th>
                      <th className="border p-2">Lista 504</th>
                      <th className="border p-2">Lista 13</th>
                      <th className="border p-2">Blanco</th>
                      <th className="border p-2">Nulo</th>
                      <th className="border p-2">Recurrido</th>
                      <th className="border p-2">Total Emitidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.detalle.map(m=> (
                      <tr key={m.mesa}>
                        <td className="border p-2">{m.mesa}</td>
                        <td className="border p-2">{m.a1}</td>
                        <td className="border p-2">{m.a2}</td>
                        <td className="border p-2">{m.a3}</td>
                        <td className="border p-2">{m.a4}</td>
                        <td className="border p-2">{m.a5}</td>
                        <td className="border p-2">{m.blanco}</td>
                        <td className="border p-2">{m.nulo}</td>
                        <td className="border p-2">{m.recurrido}</td>
                        <td className="border p-2 font-semibold">{m.emitidos}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td className="border p-2">Total Circuito</td>
                      <td className="border p-2">{block.total.a1}</td>
                      <td className="border p-2">{block.total.a2}</td>
                      <td className="border p-2">{block.total.a3}</td>
                      <td className="border p-2">{block.total.a4}</td>
                      <td className="border p-2">{block.total.a5}</td>
                      <td className="border p-2">{block.total.blanco}</td>
                      <td className="border p-2">{block.total.nulo}</td>
                      <td className="border p-2">{block.total.recurrido}</td>
                      <td className="border p-2">{block.total.emitidos}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
