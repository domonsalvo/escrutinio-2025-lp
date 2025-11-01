import React, { useState } from 'react'
import Formulario from './components/Formulario.jsx'
import Resultados from './components/Resultados.jsx'
import Resumen from './components/Resumen.jsx'

export default function App(){
  const [vista, setVista] = useState('carga')
  const tab = (id, label) => (
    <button onClick={()=>setVista(id)} className={`px-4 py-2 rounded ${vista===id?'bg-black text-white':'bg-gray-200'}`}>{label}</button>
  )
  return (
    <div className="min-h-screen">
      <header className="py-6 border-b">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <img src="https://www.cosedo.com.ar/logo_pro_app.png" alt="logo" className="h-20 mb-2" />
          <h1 className="text-2xl font-bold">Escrutinio 2025 - La Pampa</h1>
          <nav className="mt-4 flex gap-2">
            {tab('carga','Cargar Datos')}
            {tab('resultados','Ver Resultados')}
            {tab('resumen','Resumen General')}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {vista==='carga' && <Formulario/>}
        {vista==='resultados' && <Resultados/>}
        {vista==='resumen' && <Resumen/>}
      </main>
    </div>
  )
}
