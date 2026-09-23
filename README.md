# ERP Futbol

Sistema para escuelas de futbol. Gestiona jugadores, pagos, asistencias, entrenamientos y demas operaciones del dia a dia.

## Tecnologias

- React + TypeScript + Vite
- Tailwind CSS
- React Router

## Requisitos

- Node.js 18+

## Instalacion

```bash
git clone https://github.com/guzmanmaceajavier-bit/ERP-futbol.git
cd ERP-futbol/frontend
npm install
npm run dev
```

Abre http://localhost:5173

Credenciales demo: `admin` / `admin123`

## Scripts

```bash
npm run dev      # desarrollo
npm run build    # produccion
npm run preview  # preview del build
```

## Estructura

```
frontend/src/
├── pages/        # 20 paginas (auth, dashboard, jugadores, pagos, etc.)
├── components/   # ui, data, forms, layout
├── services/     # apiClient, demoStore y servicios por modulo
├── types/        # tipos por dominio
├── hooks/        # useApi, useModal, usePagination, etc.
├── context/      # AuthContext
└── utils/        # constants, formatters, validators, finanzas
```

Los datos se guardan en localStorage en modo demo.

## Deploy

Configurado para Vercel. Cada push a `main` despliega automaticamente.

```
Build:  cd frontend && npm install && npm run build
Output: frontend/dist
```

## Modulos

- **Jugadores** — CRUD, ficha completa, estado financiero
- **Pagos / Caja / Gastos** — registro, anulacion y cierre diario
- **Asistencias / Entrenamientos / Partidos / Convocatorias / Torneos** — gestion deportiva
- **Cobranzas / WhatsApp / Reportes / Bitacora / Configuracion** — control y auditoria
