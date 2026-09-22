# ERP Futbol

Sistema de gestion para escuelas de futbol. Administra jugadores, pagos, entrenamientos, inventario y mas — todo desde un solo lugar.

> **Demo:** `admin` / `admin123` — funciona sin backend, datos en localStorage.

---

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS**
- **React Router** + **Chart.js**
- Deploy en **Vercel** (SPA)

---

## Inicio rapido

```bash
# Clonar
git clone https://github.com/guzmanmaceajavier-bit/ERP-futbol.git
cd ERP-futbol/frontend

# Instalar y correr
npm install
npm run dev
```

Abre http://localhost:5173 y entra con `admin` / `admin123`.

```bash
npm run build   # build de produccion
npm run preview # preview local del build
```

---

## Estructura

```
frontend/src/
├── pages/                 # 20 paginas, una carpeta por modulo
│   ├── auth/              # Login
│   ├── dashboard/         # KPIs, resumen financiero, alertas
│   ├── jugadores/         # JugadorForm, JugadorDetail, JugadorHistorial
│   ├── categorias/
│   ├── profesores/
│   ├── asistencias/
│   ├── torneos/
│   ├── entrenamientos/
│   ├── partidos/
│   ├── convocatorias/
│   ├── pagos/             # PagoForm, PagoDetail, PeriodoGrid
│   ├── caja/
│   ├── gastos/
│   ├── reportes/
│   ├── inventario/
│   ├── notas/
│   ├── alertas/
│   ├── whatsapp/
│   ├── bitacora/
│   └── configuracion/
├── components/
│   ├── ui/                # Button, Input, Textarea, Select, Badge, Avatar, Tooltip, DatePicker, PeriodoGrid
│   ├── data/              # DataTable, SearchBar, FilterSelect, Pagination, TableSkeleton
│   ├── feedback/          # LoadingOverlay, ErrorState, SuccessState, ToastList
│   ├── forms/             # FormModal, ConfirmDialog
│   ├── layout/            # Sidebar, PageHeader, Breadcrumbs, Header
│   └── dashboard/         # KPICard, QuickActions
├── services/              # apiClient + demoStore (mock localStorage) + 18 servicios
├── types/                 # Tipos por dominio
├── hooks/                 # useApi, useForm, useModal, usePagination, useToast, useDebounce
├── context/               # AuthContext
├── layouts/               # MainLayout, AuthLayout
└── utils/                 # constants, formatters, validators, storage, permissions
```

---

## Modulos

| Grupo | Paginas |
|-------|---------|
| **Escuela** | Jugadores, Categorias, Profesores, Asistencias, Torneos, Notas |
| **Deportivo** | Entrenamientos, Partidos, Convocatorias |
| **Dinero** | Pagos, Caja, Gastos, Reportes |
| **Cancha** | Inventario |
| **Sistema** | Alertas, WhatsApp, Bitacora, Configuracion |

**Dashboard** incluye: 6 KPIs, resumen financiero con comparativa mensual, estado de mensualidades, ultimos pagos, alertas por prioridad y acciones rapidas.

---

## Roles

| Rol | Acceso |
|-----|--------|
| `super_admin` | Todo |
| `admin` | Operativa completa |
| `entrenador` / `profe` | Jugadores, categorias, deportivo, notas |
| `auxiliar` | Jugadores (lectura), asistencias, inventario |

Rutas protegidas con `RoleGuard`. El sidebar filtra el menu segun el rol.

---

## Datos demo

Sin backend, `demoStore` genera datos iniciales en localStorage:

- 10 jugadores, 3 profesores, 6 categorias
- 3 pagos, 3 gastos, 4 periodos, 3 alertas
- 4 plantillas WhatsApp, historial, notas, caja

Todo el CRUD funciona local. Para resetear: Configuracion > Zona de peligro.

---

## Deploy

Conectado a Vercel via GitHub. Cada push a `main` despliega automaticamente.

`vercel.json` ya configurado:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist"
}
```

Si lo despliegas manual: importa el repo en Vercel y listo — detecta Vite automaticamente.

---

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Dev server con HMR |
| `npm run build` | `tsc -b && vite build` |
| `npm run preview` | Sirve el build local |

---

## Notas

- Fuentes: Space Grotesk (titulos), JetBrains Mono (numeros), Inter (body)
- Tema oscuro, acento `#22C55E`
- Sin acentos en la UI (ASCII) por compatibilidad
- Auth mock: cualquier intento con `admin`/`admin123` genera token demo en localStorage
