# ERP Futbol

Sistema web para gestionar escuelas de futbol. Jugadores, pagos, asistencias, inventario, reportes y mas.

Funciona en modo demo con archivos JSON, sin necesidad de base de datos.

---

## Como correr

```bash
npm install
node api/index.js
```

Abrir http://localhost:3000

Credenciales: admin / admin123

---

## Estructura

```
/
├── api/                    # Backend Node.js
│   ├── index.js            # Servidor
│   ├── jugadores.js        # CRUD jugadores
│   ├── pagos.js            # Pagos e ingresos
│   ├── asistencias.js      # Control de asistencia
│   ├── alertas.js          # Alertas de pago
│   ├── categorias.js       # Categorias
│   ├── profesores.js       # Profesores
│   ├── inventario.js       # Inventario
│   ├── gastos.js           # Gastos
│   ├── reportes.js         # Reportes
│   ├── notas.js            # Notas
│   ├── caja.js             # Caja
│   ├── bitacora.js         # Bitacora
│   ├── torneos.js          # Torneos
│   ├── whatsapp.js         # Mensajes WhatsApp
│   └── config.js           # Configuracion
│
├── public/                 # Frontend (HTML + JS)
│   ├── index.html          # Dashboard
│   ├── jugadores.html      # Jugadores
│   ├── pagos.html          # Pagos
│   ├── asistencias.html    # Asistencias
│   ├── alertas.html        # Alertas
│   ├── categorias.html     # Categorias
│   ├── profesores.html     # Profesores
│   ├── inventario.html     # Inventario
│   ├── gastos.html         # Gastos
│   ├── reportes.html       # Reportes
│   ├── notas.html          # Notas
│   ├── caja.html           # Caja
│   ├── bitacora.html       # Bitacora
│   ├── torneos.html        # Torneos
│   ├── configuracion.html  # Configuracion
│   └── recursos/
│       ├── js/             # Logica frontend
│       └── css/            # Estilos
│
├── data/                   # JSONs (solo demo)
├── sql/                    # Migraciones SQL
├── package.json
└── vercel.json
```

---

## Que incluye

- CRUD de jugadores con busqueda y filtros por categoria
- Registro de pagos con recibo automatico
- Alertas manuales y automaticas de pagos pendientes
- Control de asistencia
- Gestion de categorias y profesores
- Inventario de uniformes/equipos
- Control de gastos
- Reportes con graficas
- Bitacora de actividad
- Torneos
- Envio de mensajes por WhatsApp
- Todo responsive
