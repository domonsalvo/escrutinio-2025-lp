import React, { useMemo, useRef, useState } from 'react'
const BASE_URL = 'https://script.google.com/macros/s/AKfycbxpZQqVIJ0D2deCvet6Ph0o4U4YgMu5MHyuTjDYyqpnHZOUTINjy8GaD1yThZe4dgWJdw/exec'
const N = v => { const n=parseInt(v,10); return Number.isFinite(n)?n:0 }

export default function Formulario(){
  const [form, setForm] = useState({
    'Nro Mesa': '',
    'Sección': '',
    'Circuito': '',
    'Votantes Habilitados': '',
    'Lista 503 Frente Defendemos LP': '',
    'Lista 501 Alianza LLA': '',
    'Lista 502 Frente FIT': '',
    'Lista 504 Frente Cambia LP': '',
    'Lista 13 MAS': '',
    'Votos Blanco': '',
    'Votos Nulos': '',
    'Votos Recurridos': '',
    'Suma Votos Emitidos': '',
    'Observaciones': ''
  })
  const [lugares, setLugares] = useState(null)
  const fetched = useRef(false)

  async function ensureLugares(){
    if(fetched.current) return
    try{
      const res = await fetch(`${BASE_URL}?action=getLugares`)
      const js = await res.json()
      const data = (Array.isArray(js)?js:[]).map(r=> ({
        seccion: r['Seccion'] ?? r['Sección'] ?? r['SECCION'] ?? '',
        circuito: r['Circuito'] ?? r['CIRCUITO'] ?? '',
        desde: N(r['Desde'] ?? r['DESDE'] ?? r['desde'] ?? 0),
        hasta: N(r['Hasta'] ?? r['HASTA'] ?? r['hasta'] ?? 0),
      })).filter(r=> r.desde && r.hasta)
      setLugares(data); fetched.current=true
    }catch(e){ console.error(e) }
  }

  const totalEmitidos = useMemo(()=>{
    return N(form['Lista 503 Frente Defendemos LP']) + N(form['Lista 501 Alianza LLA'])
      + N(form['Lista 502 Frente FIT']) + N(form['Lista 504 Frente Cambia LP'])
      + N(form['Lista 13 MAS']) + N(form['Votos Blanco'])
      + N(form['Votos Nulos']) + N(form['Votos Recurridos'])
  },[form])

  function handleChange(e){
    const { name, value } = e.target
    const f = { ...form, [name]: value }
    const votoCampos = ['Lista 503 Frente Defendemos LP','Lista 501 Alianza LLA','Lista 502 Frente FIT','Lista 504 Frente Cambia LP','Lista 13 MAS','Votos Blanco','Votos Nulos','Votos Recurridos']
    if(votoCampos.includes(name)){
      f['Suma Votos Emitidos'] = (
        N(f['Lista 503 Frente Defendemos LP']) + N(f['Lista 501 Alianza LLA']) + N(f['Lista 502 Frente FIT'])
        + N(f['Lista 504 Frente Cambia LP']) + N(f['Lista 13 MAS']) + N(f['Votos Blanco'])
        + N(f['Votos Nulos']) + N(f['Votos Recurridos'])
      )
    }
    setForm(f)
  }

  async function onMesaBlur(){
    await ensureLugares()
    const mesa = N(form['Nro Mesa']); if(!mesa || !lugares) return
    const r = lugares.find(x=> mesa>=x.desde && mesa<=x.hasta)
    setForm(f => ({ ...f, 'Sección': r? (r.seccion||'') : '', 'Circuito': r? (r.circuito||'') : '' }))
  }

  async function handleSubmit(e){
    e.preventDefault()
    const payload = { ...form, 'Suma Votos Emitidos': totalEmitidos }
    try{
      await fetch(BASE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
      alert('Datos enviados correctamente ✅')
      setForm({
        'Nro Mesa': '','Sección': '','Circuito': '','Votantes Habilitados': '',
        'Lista 503 Frente Defendemos LP': '','Lista 501 Alianza LLA': '','Lista 502 Frente FIT': '',
        'Lista 504 Frente Cambia LP': '','Lista 13 MAS': '','Votos Blanco': '','Votos Nulos': '', 'Votos Recurridos': '',
        'Suma Votos Emitidos': '','Observaciones': ''
      })
    }catch(e){
      console.error(e); alert('Error al enviar los datos ❌')
    }
  }

  const order = ['Nro Mesa','Sección','Circuito','Votantes Habilitados','Lista 503 Frente Defendemos LP','Lista 501 Alianza LLA','Lista 502 Frente FIT','Lista 504 Frente Cambia LP','Lista 13 MAS','Votos Blanco','Votos Nulos','Votos Recurridos','Suma Votos Emitidos','Observaciones']

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        {order.map(key => (
          <div className="row" key={key}>
            <label htmlFor={key}>{key}</label>
            <input
              id={key}
              name={key}
              type={(key==='Observaciones') ? 'text' : 'number'}
              onBlur={key==='Nro Mesa' ? onMesaBlur : undefined}
              value={String(form[key])}
              onChange={handleChange}
              readOnly={key==='Suma Votos Emitidos'}
              placeholder={(key==='Sección' || key==='Circuito') ? '(autocompleta)' : ''}
            />
          </div>
        ))}
        <button className="btn full" type="submit">Enviar</button>
        <div className="muted center" style={{marginTop:'6px'}}>Total emitidos (auto): {totalEmitidos}</div>
      </form>
    </div>
  )
}
