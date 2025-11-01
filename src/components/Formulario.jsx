import React, { useEffect, useMemo, useState } from 'react'

const BASE_URL = 'https://script.google.com/macros/s/AKfycbxpZQqVIJ0D2deCvet6Ph0o4U4YgMu5MHyuTjDYyqpnHZOUTINjy8GaD1yThZe4dgWJdw/exec'

function safeNum(v){ const n=parseInt(v,10); return Number.isFinite(n)?n:0 }

export default function Formulario(){
  const [mesa,setMesa]=useState('')
  const [seccion,setSeccion]=useState('')
  const [circuito,setCircuito]=useState('')
  const [habilitados,setHabilitados]=useState('')
  const [v503,setV503]=useState('')
  const [v501,setV501]=useState('')
  const [v502,setV502]=useState('')
  const [v504,setV504]=useState('')
  const [v13,setV13]=useState('')
  const [blancos,setBlancos]=useState('')
  const [nulos,setNulos]=useState('')
  const [recurridos,setRecurridos]=useState('')
  const [lugares,setLugares]=useState([])
  const [loading,setLoading]=useState(true)
  const [banner,setBanner]=useState({show:false,type:'success',text:''})

  useEffect(()=>{ let t; if(banner.show){ t=setTimeout(()=>setBanner({show:false,type:'success',text:''}),5000) } return ()=>clearTimeout(t)},[banner.show])

  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch(`${BASE_URL}?action=getLugares`)
        const data = await res.json()
        const norm = data.map(r=> ({
          seccion: r.Seccion ?? r.SECCION ?? r.seccion ?? '',
          circuito: r.Circuito ?? r.CIRCUITO ?? r.circuito ?? '',
          desde: Number(String(r.Desde ?? r.desde ?? '').replace(/\D/g,'')) || 0,
          hasta: Number(String(r.Hasta ?? r.hasta ?? '').replace(/\D/g,'')) || 0
        })).filter(x=>x.desde && x.hasta)
        setLugares(norm)
      }catch(e){ console.error(e) }
      finally{ setLoading(false) }
    })()
  },[])

  const totalEmitidos=useMemo(()=> safeNum(v503)+safeNum(v501)+safeNum(v502)+safeNum(v504)+safeNum(v13)+safeNum(blancos)+safeNum(nulos)+safeNum(recurridos), [v503,v501,v502,v504,v13,blancos,nulos,recurridos])

  function onMesaBlur(){
    const n=safeNum(mesa); if(!n||!lugares.length) return;
    const m=lugares.find(r=> n>=r.desde && n<=r.hasta )
    if(m){ setSeccion(m.seccion); setCircuito(m.circuito) } else { setSeccion(''); setCircuito('') }
  }

  async function handleSubmit(e){
    e.preventDefault()
    const payload={
      Mesa: mesa,
      Seccion: seccion,
      Circuito: circuito,
      Total_Habilitados: safeNum(habilitados),
      Agrup1: safeNum(v503),
      Agrup2: safeNum(v501),
      Agrup3: safeNum(v502),
      Agrup4: safeNum(v504),
      Agrup5: safeNum(v13),
      Blancos: safeNum(blancos),
      Nulos: safeNum(nulos),
      Recurridos: safeNum(recurridos),
      Total_Emitidos: totalEmitidos
    }
    try{
      await fetch(BASE_URL,{ method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
      setBanner({show:true,type:'success',text:'Datos enviados correctamente✅'})
      setMesa(''); setSeccion(''); setCircuito(''); setHabilitados('')
      setV503(''); setV501(''); setV502(''); setV504(''); setV13('')
      setBlancos(''); setNulos(''); setRecurridos('')
    }catch(e){
      console.error(e); setBanner({show:true,type:'error',text:'Error al enviar los datos. Verifique la conexión ❌'})
    }
  }

  return (
    <div>
      {loading && <div className="mb-4 text-sm text-gray-600">Cargando tabla de Lugares…</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="font-semibold">Mesa</label>
            <input type="number" value={mesa} onChange={e=>setMesa(e.target.value)} onBlur={onMesaBlur} required className="border p-2 rounded mt-1" />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold">Sección</label>
            <input type="text" value={seccion} onChange={e=>setSeccion(e.target.value)} className="border p-2 rounded mt-1" placeholder="(autocompleta)" />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold">Circuito</label>
            <input type="text" value={circuito} onChange={e=>setCircuito(e.target.value)} className="border p-2 rounded mt-1" placeholder="(autocompleta)" />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold">Total habilitados</label>
            <input type="number" min={0} value={habilitados} onChange={e=>setHabilitados(e.target.value)} required className="border p-2 rounded mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            ['Lista 503 Frente Defendemos LP', v503, setV503],
            ['Lista 501 Alianza LLA', v501, setV501],
            ['Lista 502 Frente FIT', v502, setV502],
            ['Lista 504 Frente Cambia LP', v504, setV504],
            ['Lista 13 MAS', v13, setV13],
            ['Votos en Blanco', blancos, setBlancos],
            ['Votos Nulos', nulos, setNulos],
            ['Votos Recurridos', recurridos, setRecurridos],
          ].map(([label,val,setVal],i)=>(
            <div key={i} className="flex items-center justify-between">
              <div className="w-2/3 font-medium">{label}</div>
              <div className="w-1/3"><input type="number" min={0} value={val} onChange={e=>setVal(e.target.value)} className="border p-2 rounded w-full" /></div>
            </div>
          ))}
        </div>

        <div className="text-right font-semibold">Total emitidos: {totalEmitidos}</div>

        <button type="submit" className="w-full bg-black text-white py-3 rounded-xl">Enviar Datos</button>
      </form>

      {banner.show && (
        <div className={`fixed left-1/2 transform -translate-x-1/2 bottom-6 px-4 py-3 rounded-lg text-white shadow-lg ${banner.type==='success'?'bg-green-600':'bg-red-600'}`}>
          {banner.text}
        </div>
      )}
    </div>
  )
}
