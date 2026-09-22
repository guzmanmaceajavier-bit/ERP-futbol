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
│   ├── dashboard/         # KPIs, cobranza pendiente, resumen financiero
│   ├── jugadores/         # JugadorForm, JugadorDetail, JugadorHistorial
│   ├── categorias/        # edad, horario, dias, cancha, cupo
│   ├── profesores/        # contrato, categorias asignadas
│   ├── asistencias/       # registro + resumen por jugador (%)
│   ├── torneos/           # estado, equipos participantes
│   ├── entrenamientos/    # link a asistencias
│   ├── partidos/          # localia, torneo, arbitro
│   ├── convocatorias/     # estados por convocado
│   ├── pagos/             # PagoForm, PagoDetail, anulacion, PeriodoGrid
│   ├── caja/              # movimientos, saldo sistema vs contado
│   ├── gastos/            # anulacion, comprobante
│   ├── reportes/          # por mes, categoria, cuenta, caja
│   ├── inventario/        # movimientos entrada/salida/ajuste
│   ├── notas/             # tipo, visibilidad
│   ├── alertas/           # centro de cobranza
│   ├── whatsapp/          # plantillas + historial
│   ├── bitacora/          # filtros, detalle antes/despues
│   └── configuracion/     # 7 secciones
├── components/
│   ├── ui/                # Button, Input, Textarea, Select, Badge, Avatar, Tooltip, DatePicker, PeriodoGrid
│   ├── data/              # DataTable, SearchBar, FilterSelect, Pagination, TableSkeleton
│   ├── feedback/          # LoadingOverlay, ErrorState, SuccessState, ToastList
│   ├── forms/             # FormModal, ConfirmDialog
│   ├── layout/            # Sidebar, PageHeader, Breadcrumbs, Header
│   └── dashboard/         # KPICard, QuickActions
├── services/              # apiClient + demoStore (mock localStorage) + 18 servicios
├── types/                 # Tipos por dominio (jugador, pago, caja, cobranza, etc.)
├── hooks/                 # useApi, useForm, useModal, usePagination, useToast, useDebounce
├── context/               # AuthContext
├── layouts/               # MainLayout, AuthLayout
└── utils/                 # constants, formatters, validators, storage, permissions
```

---

## Modulos

| Grupo | Paginas | Detalles |
|-------|---------|----------|
| **Escuela** | Jugadores, Categorias, Profesores, Asistencias, Torneos, Notas | Jugadores con estado (activo/inactivo/retirado), categorias con info operativa, profesores con contrato, asistencias con % y resumen |
| **Deportivo** | Entrenamientos, Partidos, Convocatorias | Partidos con localia/torneo/arbitro, convocatorias con estados |
| **Dinero** | Pagos, Caja, Gastos, Reportes | Pagos y gastos con anulacion y bitacora, caja con movimientos y diferencia sistema/contado |
| **Cancha** | Inventario | Movimientos de stock (entrada/salida/ajuste) con historial |
| **Sistema** | Cobranzas, WhatsApp, Bitacora, Configuracion | Cobranza con flujo contactado→prometio→cobrar, bitacora con filtros y detalle |

**Dashboard** incluye: 6 KPIs, cobranza pendiente (deuda total, morosidad %, al dia vs deudores), resumen financiero con comparativa mensual, estado de mensualidades, ultimos pagos, acciones rapidas.

---

## Roles

| Rol | Acceso |
|-----|--------|
| `super_admin` | Todo |
| `admin` | Operativa completa |
| `tesorero` | Jugadores, pagos, caja, gastos, reportes, cobranzas, whatsapp, inventario |
| `entrenador` / `profe` | Jugadores, categorias, deportivo, notas |
| `auxiliar` / `asistente` | Jugadores (lectura), asistencias, inventario |

Rutas protegidas con `RoleGuard`. El sidebar filtra el menu segun el rol.

---

## Flujo financiero

```
Jugador → Periodos (mensualidad, pagado, saldo, estado, vencimiento)
           → Pagos (monto, metodo, recibo, registrado_por)
             → Caja (movimientos: ingreso/gasto/anulacion/ajuste)
               → Reportes (recaudo, utilidad, caja)

periodos es fuente unica de verdad. Anular un pago recalcula el periodo
y registra motivo en bitacora. Alertas/Cobranzas solo gestiona seguimiento,
no crea deuda artificial.
```

---

## Datos demo

Sin backend, `demoStore` genera datos iniciales en localStorage:

- 10 jugadores (con estados, fecha ingreso), 3 profesores, 6 categorias
- 3 pagos, 3 gastos, 4 periodos, 3 alertas de cobranza
- 4 plantillas WhatsApp, historial, notas, caja, inventario con movimientos

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
- Auth mock: `admin`/`admin123` genera token demo en localStorage
