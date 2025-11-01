import React, { useState } from 'react'
import Formulario from './components/Formulario.jsx'
import Resultados from './components/Resultados.jsx'
import Resumen from './components/Resumen.jsx'

export default function App(){
  const [vista, setVista] = useState('carga')

  return (
    <div>
      <header className="header">
        <div className="container center">
          <img className="logo" src="https://www.cosedo.com.ar/logo_pro_app.png" alt="Logo" />
          <div className="title">Escrutinio 2025 - La Pampa</div>
          <div className="tabs">
            <button className={`tab ${vista==='carga'?'active':''}`} onClick={()=>setVista('carga')}>Cargar Datos</button>
            <button className={`tab ${vista==='resultados'?'active':''}`} onClick={()=>setVista('resultados')}>Ver Resultados</button>
            <button className={`tab ${vista==='resumen'?'active':''}`} onClick={()=>setVista('resumen')}>Resumen General</button>
          </div>
        </div>
      </header>

      <main className="container" style={{paddingTop: '20px'}}>
        {vista==='carga' && <Formulario />}
        {vista==='resultados' && <Resultados />}
        {vista==='resumen' && <Resumen />}
      </main>
    </div>
  )
}
