# Escrutinio 2025 - La Pampa

App React (Vite) con 3 pestañas:
- **Cargar Datos**: formulario clásico, Observaciones y Suma Votos Emitidos automática, autocompletar Sección/Circuito por mesa (desde hoja *Lugares*).
- **Ver Resultados**: filtros de Sección y Circuito (automático), tabla y gráfico de barras con colores políticos.
- **Resumen General**: totales y gráficos de barras + pastel, con exportación a CSV.

Conectada a tu Apps Script: 
`https://script.google.com/macros/s/AKfycbxpZQqVIJ0D2deCvet6Ph0o4U4YgMu5MHyuTjDYyqpnHZOUTINjy8GaD1yThZe4dgWJdw/exec`

## Desarrollo local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy en Netlify
1. Subí el repo a GitHub (rama `main`).
2. En https://app.netlify.com → **Add new site** → **Import from Git** → GitHub → elegí el repo.
3. Configuración:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Deploy.

> Si tu Apps Script cambió, actualizá la URL en: `Formulario.jsx`, `Resultados.jsx` y `Resumen.jsx` (const `BASE_URL`).

## Columnas esperadas
**Mesas**: `Timestamp | Sección | Circuito | Nro Mesa | Lista 503 Frente Defendemos LP | Lista 501 Alianza LLA | Lista 502 Frente FIT | Lista 504 Frente Cambia LP | Lista 13 MAS | Votos Blanco | Votos Nulos | Votos Recurridos | Votantes Habilitados | Suma Votos Emitidos | Observaciones`

**Lugares**: `Seccion | Circuito | ... | Desde | Hasta` (usado para autocompletar Sección/Circuito).
