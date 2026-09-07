# ERP Futbol - Sistema de Gestion Integral

Sistema web para la gestion integral de escuelas de futbol.
Jugadores, pagos, asistencias, inventario, reportes y mas.

Modo demo con archivos JSON (sin base de datos).

---

## Tecnologias

- Frontend: HTML, TailwindCSS, JavaScript Vanilla
- Backend: Node.js
- Modo demo: archivos JSON en carpeta `data/`

---

## Inicio rapido

```bash
npm install
node api/index.js
```

Abrir http://localhost:3000

Usuario: admin / Contrasena: admin123

---

## Estructura del proyecto

```
/
├── api/                    # Backend Node.js
│   ├── index.js            # Servidor principal
│   ├── jugadores.js        # API jugadores
│   ├── pagos.js            # API pagos
│   ├── asistencias.js      # API asistencias
│   ├── alertas.js          # API alertas
│   ├── categorias.js       # API categorias
│   ├── profesores.js       # API profesores
│   ├── inventario.js       # API inventario
│   ├── gastos.js           # API gastos
│   ├── reportes.js         # API reportes
│   ├── notas.js            # API notas
│   ├── caja.js             # API caja
│   ├── bitacora.js         # API bitacora
│   ├── torneos.js          # API torneos
│   ├── whatsapp.js         # API whatsapp
│   └── config.js           # API configuracion
│
├── public/                 # Frontend
│   ├── index.html          # Dashboard
│   ├── jugadores.html      # Gestion de jugadores
│   ├── pagos.html          # Registro de pagos/ingresos
│   ├── asistencias.html    # Control de asistencias
│   ├── alertas.html        # Alertas y notificaciones
│   ├── categorias.html     # Gestion de categorias
│   ├── profesores.html     # Gestion de profesores
│   ├── inventario.html     # Control de inventario
│   ├── gastos.html         # Control de gastos
│   ├── reportes.html       # Reportes y graficas
│   ├── notas.html          # Notas de jugadores
│   ├── caja.html           # Control de caja
│   ├── bitacora.html       # Bitacora de actividad
│   ├── torneos.html        # Gestion de torneos
│   ├── configuracion.html  # Configuracion del sistema
│   ├── sw.js               # Service worker
│   └── recursos/
│       ├── js/             # JavaScript frontend
│       └── css/            # Estilos
│
├── data/                   # Archivos JSON (modo demo)
├── sql/                    # Scripts SQL
├── package.json
└── vercel.json
```

---

## Caracteristicas

- CRUD completo de jugadores con categorias
- Registro y control de pagos/ingresos
- Alertas de pagos pendientes (manuales y automaticas)
- Control de asistencias
- Gestion de categorias y profesores
- Inventario y control de gastos
- Reportes con graficas
- Sistema de bitacora
- Gestion de torneos
- WhatsApp integrado
- Diseno responsive
- Modo demo sin base de datos

---

## Autor

Proyecto desarrollado por guzmanmaceajavier-bit.
