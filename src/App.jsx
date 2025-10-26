import React, { useEffect, useMemo, useState } from 'react'

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpZQqVIJ0D2deCvet6Ph0o4U4YgMu5MHyuTjDYyqpnHZOUTINjy8GaD1yThZe4dgWJdw/exec'
// Exportación pública en CSV (la xlsx requiere librería extra).
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS978Nn4obPIwsh_LfqYdeLVq-gcN_rJMWMzgYQTimP7JPkRa3oxyYS7Zl1X-BGI_ijLH8XSRsWnDHs/pub?output=csv'

export default function App() {
  // Identificación
  const [mesa, setMesa] = useState('')
  const [seccion, setSeccion] = useState('')
  const [circuito, setCircuito] = useState('')
  const [habilitados, setHabilitados] = useState('')

  // Votos
  const [v503, setV503] = useState('')
  const [v501, setV501] = useState('')
  const [v502, setV502] = useState('')
  const [v504, setV504] = useState('')
  const [v13, setV13] = useState('')
  const [blancos, setBlancos] = useState('')
  const [nulos, setNulos] = useState('')
  const [recurridos, setRecurridos] = useState('')

  // Hoja Lugares (cargada una sola vez)
  const [lugares, setLugares] = useState([])
  const [cargandoLugares, setCargandoLugares] = useState(true)
  const [errorLugares, setErrorLugares] = useState('')

  // Banner inferior
  const [banner, setBanner] = useState({ show: false, type: 'success', text: '' })

  useEffect(() => {
    let t
    if (banner.show) t = setTimeout(() => setBanner({ show: false, type: 'success', text: '' }), 5000)
    return () => clearTimeout(t)
  }, [banner.show])

  // CSV parser simple que soporta comillas y comas dentro de campos
  function parseCSV(text) {
    const rows = []
    let cur = [], field = '', inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i], next = text[i+1]
      if (inQuotes) {
        if (c === '"' && next === '"') { field += '"'; i++ } // doble comilla -> comilla escapada
        else if (c === '"') { inQuotes = false }
        else { field += c }
      } else {
        if (c === '"') inQuotes = true
        else if (c === ',') { cur.push(field); field = '' }
        else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = '' }
        else { field += c }
      }
    }
    if (field.length || cur.length) { cur.push(field); rows.push(cur) }
    return rows
  }

  // Cargar hoja Lugares una sola vez
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(SHEET_CSV_URL)
        const csv = await res.text()
        const rows = parseCSV(csv)

        if (!rows.length) throw new Error('CSV vacío')
        const headers = rows[0].map(h => h.trim().toLowerCase())
        const idx = {
          seccion: headers.findIndex(h => h.includes('seccion') || h.includes('sección')),
          circuito: headers.findIndex(h => h.includes('circuito')),
          desde: headers.findIndex(h => h.includes('desde')),
          hasta: headers.findIndex(h => h.includes('hasta')),
        }
        if (idx.seccion === -1 || idx.circuito === -1 || idx.desde === -1 || idx.hasta === -1) {
          throw new Error('No se hallaron columnas requeridas (Sección, Circuito, Desde, Hasta).')
        }

        const data = rows.slice(1)
          .filter(r => r.length >= Math.max(idx.seccion, idx.circuito, idx.desde, idx.hasta) + 1)
          .map(r => ({
            seccion: r[idx.seccion]?.trim() ?? '',
            circuito: r[idx.circuito]?.trim() ?? '',
            desde: Number((r[idx.desde] ?? '').toString().replace(/[^0-9]/g, '')) || 0,
            hasta: Number((r[idx.hasta] ?? '').toString().replace(/[^0-9]/g, '')) || 0,
          }))
          .filter(x => x.desde && x.hasta && x.seccion)

        setLugares(data)
        setErrorLugares('')
      } catch (e) {
        console.error(e)
        setErrorLugares('No se pudo cargar la hoja "Lugares". Verifique el enlace público.')
      } finally {
        setCargandoLugares(false)
      }
    }
    load()
  }, [])

  function safeNum(v) {
    const n = parseInt(v, 10)
    return Number.isFinite(n) ? n : 0
  }

  const totalEmitidos = useMemo(() => {
    return safeNum(v503) + safeNum(v501) + safeNum(v502) + safeNum(v504) + safeNum(v13) + safeNum(blancos) + safeNum(nulos) + safeNum(recurridos)
  }, [v503, v501, v502, v504, v13, blancos, nulos, recurridos])

  // Al salir del campo Mesa (onBlur), buscar en Lugares y completar sección y circuito
  function onMesaBlur() {
    const nMesa = safeNum(mesa)
    if (!nMesa || !lugares.length) return
    const match = lugares.find(row => nMesa >= row.desde && nMesa <= row.hasta)
    if (match) {
      setSeccion(match.seccion)
      setCircuito(match.circuito)
    } else {
      setSeccion('')
      setCircuito('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      seccion,
      circuito,
      nro_mesa: mesa,
      votos_agrup1: safeNum(v503),
      votos_agrup2: safeNum(v501),
      votos_agrup3: safeNum(v502),
      votos_agrup4: safeNum(v504),
      votos_agrup5: safeNum(v13),
      votos_blanco: safeNum(blancos),
      votos_nulos: safeNum(nulos),
      votos_recurridos: safeNum(recurridos),
      votantes_habilitados: safeNum(habilitados),
      total_emitidos: totalEmitidos,
      observaciones: '',
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setBanner({ show: true, type: 'success', text: 'Datos enviados correctamente✅' })
      setMesa(''); setSeccion(''); setCircuito(''); setHabilitados('')
      setV503(''); setV501(''); setV502(''); setV504(''); setV13('')
      setBlancos(''); setNulos(''); setRecurridos('')
    } catch (e) {
      console.error(e)
      setBanner({ show: true, type: 'error', text: 'Error al enviar los datos. Verifique la conexión ❌' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex flex-col items-center mb-6">
          <img src="https://www.cosedo.com.ar/logo_pro_app.png" alt="logo" className="h-24 mb-3" />
          <h1 className="text-2xl font-bold text-black">Escrutinio 2025 - La Pampa</h1>
        </div>

        {cargandoLugares ? (
          <div className="mb-4 text-sm text-gray-600">Cargando tabla de Lugares…</div>
        ) : errorLugares ? (
          <div className="mb-4 text-sm text-red-600">{errorLugares}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloque 1: Mesa primero, luego Sección, Circuito y Habilitados */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold">Mesa</label>
              <input
                type="number"
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                onBlur={onMesaBlur}
                required
                className="border p-2 rounded mt-1"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold">Sección</label>
              <input
                type="text"
                value={seccion}
                onChange={(e) => setSeccion(e.target.value)}
                className="border p-2 rounded mt-1"
                placeholder="(autocompleta)"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold">Circuito</label>
              <input
                type="text"
                value={circuito}
                onChange={(e) => setCircuito(e.target.value)}
                className="border p-2 rounded mt-1"
                placeholder="(autocompleta)"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold">Total habilitados</label>
              <input
                type="number"
                min={0}
                value={habilitados}
                onChange={(e) => setHabilitados(e.target.value)}
                required
                className="border p-2 rounded mt-1"
              />
            </div>
          </div>

          {/* Bloque 2: Votos */}
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
            ].map(([label, value, setter], i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="w-2/3 font-medium">{label}</div>
                <div className="w-1/3">
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total emitidos (en vivo) */}
          <div className="text-right font-semibold">Total emitidos: {totalEmitidos}</div>

          <div>
            <button type="submit" className="w-full bg-black text-white py-3 rounded-xl">Enviar Datos</button>
          </div>
        </form>
      </div>

      {/* Banner flotante inferior */}
      {banner.show && (
        <div
          className={`fixed left-1/2 transform -translate-x-1/2 bottom-6 px-4 py-3 rounded-lg text-white shadow-lg ${banner.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {banner.text}
        </div>
      )}
    </div>
  )
}
