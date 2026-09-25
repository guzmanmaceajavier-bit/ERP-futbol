# ERP FÚTBOL — EFUSA

### Documento técnico de proyecto

| | |
|---|---|
| **Proyecto** | ERP Fútbol / EFUSA |
| **Tipo** | Sistema ERP para escuelas de fútbol |
| **Versión** | 1.0.0 |
| **Fecha** | Septiembre 2026 |
| **Modalidad** | Web SPA, 100% frontend (modo demo) |
| **Repositorio** | github.com/guzmanmaceajavier-bit/ERP-futbol |
| **Deploy** | Vercel (automático desde `main`) |

---

## 1. Resumen ejecutivo

ERP Fútbol es una aplicación web de gestión integral para escuelas de fútbol. Centraliza la operativa diaria —jugadores, categorías, profesores, asistencias, entrenamientos, partidos, convocatorias, torneos, pagos, caja, gastos, inventario, notas, cobranzas, WhatsApp, reportes, bitácora y configuración— en una única plataforma con roles de usuario y auditoría.

La versión actual funciona **sin backend**: los datos viven en `localStorage` de forma persistente (modo demo), lo que permite probar el 100% de la funcionalidad sin servidor. La arquitectura de servicios está preparada para conectar a una API real reemplazando únicamente el mock (`demoStore.ts`), sin tocar la UI.

**Métricas de la base de código:**

| Métrica | Valor |
|---|---|
| Archivos TypeScript/TSX | 121 |
| Líneas de código | 11.304 |
| Páginas / módulos | 20 |
| Servicios | 20 (más `apiClient` y `demoStore`) |
| Tipos de dominio | 21 |
| Componentes UI | 14 (+ `data`, `forms`, `layout`, `feedback`, `dashboard`) |
| Roles de usuario | 7 |
| Rutas | 20 |

---

## 2. Objetivos

### Objetivo general
Construir un sistema de gestión que permita a una escuela de fútbol administrar su operativa completa desde un único entorno web, con control de accesos por roles y trazabilidad de todas las acciones financieras.

### Objetivos específicos
1. **Gestión de personas:** jugadores, categorías y profesores con ficha completa.
2. **Gestión deportiva:** asistencias vinculadas a entrenamientos, partidos, convocatorias y torneos.
3. **Gestión financiera:** un flujo cerrado `Pago → Periodos → Cobranzas → Caja → Reportes`, con anulaciones auditadas y cierre diario de caja.
4. **Control y auditoría:** bitácora de acciones y respaldos exportables.
5. **Acceso seguro:** 7 roles con permisos granulares por módulo.

---

## 3. Stack tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | ^18.3.1 | Base de la UI |
| TypeScript | ^5.5.4 | Tipado estático en todo el código |
| Vite | ^5.4.2 | Build y servidor de desarrollo |
| Tailwind CSS | ^3.4.10 | Sistema de estilos utilitario |
| React Router | ^6.26.0 | Enrutamiento SPA |
| Chart.js / react-chartjs-2 | ^4.4.4 / ^5.2.0 | Gráficas de reportes y dashboard |
| lucide-react | ^0.400.0 | Iconos (envueltos con nombres en español) |

### Herramientas
- **PostCSS + Autoprefixer** — prefijos CSS.
- **Modo demo** — `localStorage` con claves `erp_demo_mode`, `erp_demo_data`, `erp_demo_version`.

### Identidad visual
| Elemento | Valor |
|---|---|
| Fondo principal | `#0B1120` (tema oscuro) |
| Acento / éxito | `#22C55E` |
| Títulos | Space Grotesk |
| Cuerpo | Inter |
| Números | JetBrains Mono (monoespaciada) |

---

## 4. Arquitectura

```
frontend/src/
├── App.tsx                 # Rutas + ProtectedRoute + RoleGuard + ErrorBoundary
├── pages/                  # 20 módulos (uno por carpeta)
│   ├── auth/               # Login
│   ├── dashboard/          # KPIs y resumen
│   ├── jugadores/          # Lista + Form + Ficha (4 secciones / 7 tabs)
│   ├── categorias/         # CRUD + operativa
│   ├── profesores/         # CRUD + contratos
│   ├── asistencias/        # 4 estados + export Excel/PDF
│   ├── entrenamientos/     # CRUD + vínculo con asistencias
│   ├── partidos/           # Detalle (EFUSA vs rival)
│   ├── convocatorias/      # Estados por convocado
│   ├── torneos/            # CRUD + tabla de equipos
│   ├── pagos/              # Registro + historial + estado de cuentas + factura
│   ├── caja/               # Apertura / cierre / reabrir
│   ├── gastos/             # CRUD + anulación
│   ├── reportes/           # 4 tabs (mes, categoría, cuenta, caja)
│   ├── inventario/         # CRUD + movimientos
│   ├── notas/              # Tipos + visibilidad
│   ├── alertas/            # Cobranzas (centro financiero)
│   ├── whatsapp/           # Plantillas + historial
│   ├── bitacora/           # 20 acciones auditadas
│   └── configuracion/      # 7 secciones + backup + zona peligro
├── components/
│   ├── ui/                 # Button, Input, Select, Badge, Avatar, Icon, ...
│   ├── data/               # DataTable, SearchBar, FilterSelect, Pagination
│   ├── feedback/           # Loading, Error, Success, Toast, ErrorBoundary
│   ├── forms/              # FormModal, ConfirmDialog, FormField, FormGrid
│   ├── layout/             # Sidebar, PageHeader, Breadcrumbs, Header
│   └── dashboard/          # KPICard, QuickActions
├── services/               # apiClient + demoStore + 20 servicios de dominio
├── types/                  # 21 tipos por dominio
├── hooks/                  # useApi, useForm, useModal, usePagination, useToast, useDebounce
├── context/                # AuthContext (login, logout, roles)
├── layouts/                # MainLayout (sidebar colapsable), AuthLayout
└── utils/                  # constants, formatters, validators, permissions, finanzas, factura, storage
```

### Patrón de datos

```
UI (pages) → hooks/useApi → services/{recurso}Service → apiClient
                                                        ├─ localhost  → demoStore (localStorage)
                                                        └─ producción → fetch(api) [preparado]
```

El cambio a backend real requiere solo implementar las rutas HTTP en `apiClient.ts`; **la UI no cambia**.

---

## 5. Módulos funcionalidad

| # | Módulo | Ruta | Funciones principales | Roles |
|---|---|---|---|---|
| 1 | Login | `/login` | Autenticación, mostrar/ocultar password | Todos |
| 2 | Dashboard | `/` | KPIs, cobranza pendiente, resumen financiero | Todos |
| 3 | Jugadores | `/jugadores` | CRUD, ficha (personal, deportiva, médica, acudiente), estado de cuentas | Todos |
| 4 | Categorías | `/categorias` | CRUD, edad, horario, cupo, profesor asignado | admin, entrenador, profe |
| 5 | Profesores | `/profesores` | CRUD, contrato, salario, categorías asignadas | super_admin, admin |
| 6 | Asistencias | `/asistencias` | 4 estados, excusas, vínculo a entrenamiento, export Excel/PDF | Todos (académico) |
| 7 | Entrenamientos | `/entrenamientos` | CRUD, genera registro de asistencia | admin, entrenador, profe |
| 8 | Partidos | `/partidos` | Detalle por jugador (titular, minutos, goles, notas) | admin, entrenador, profe |
| 9 | Convocatorias | `/convocatorias` | Estados por convocado, WhatsApp masivo | admin, entrenador, profe |
| 10 | Torneos | `/torneos` | CRUD + tabla de equipos | admin, entrenador, profe |
| 11 | **Pagos** | `/pagos` | Registro (completo/abono/adelantado), historial, estado de cuentas, factura | super_admin, admin, tesorero |
| 12 | Caja | `/caja` | Apertura, cierre, reabrir con motivo, diferencia sistema/contado | super_admin, admin, tesorero |
| 13 | Gastos | `/gastos` | CRUD, anulación con motivo | super_admin, admin, tesorero |
| 14 | Reportes | `/reportes` | Cobranza por mes, categoría, estado de cuenta, caja | super_admin, admin, tesorero |
| 15 | Inventario | `/inventario` | CRUD, entradas/salidas/ajustes, stock mínimo | + auxiliar, asistente |
| 16 | Notas | `/notas` | Tipos (académica/medica/admin), visibilidad pública/privada | admin, entrenador, profe |
| 17 | **Cobranzas** | `/alertas` | Centro financiero: KPIs, filtros, cobrar, factura | super_admin, admin, tesorero |
| 18 | WhatsApp | `/whatsapp` | Plantillas, historial de envíos | super_admin, admin, tesorero |
| 19 | Bitácora | `/bitacora` | 20 acciones tipadas, filtros, detalle expandible | super_admin |
| 20 | Configuración | `/configuracion` | Datos de la escuela, reglas, respaldo, zona peligro | super_admin |

---

## 6. Flujo financiero (núcleo del sistema)

```
                    ┌─────────────┐
   Registrar pago → │    PAGO     │
                    └──────┬──────┘
                           │ snapshot de mensualidad (objetivo)
                           │ vencimiento día 10
                           ▼
                    ┌─────────────┐
                    │  PERIODOS   │  ← fuente única de verdad
                    │ objetivo    │
                    │ pagado      │  N:N vía pago_periodos
                    │ saldo       │  (soporta adelantados)
                    │ estado      │
                    └──────┬──────┘
                           │ saldo = objetivo − pagado
                           ▼
                    ┌─────────────┐
                    │   JUGADOR   │  saldo_pendiente
                    │             │  ultimo_pago
                    │             │  proximo_vencimiento
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌────────┐ ┌──────────┐
       │ COBRANZAS  │ │  CAJA  │ │ DASHBOARD│
       │ (solo lee) │ │ingresos│ │ REPORTES │
       └────────────┘ └────────┘ └────┬─────┘
                                      ▼
                               ┌────────────┐
                               │ BITÁCORA   │
                               └────────────┘
```

### Reglas de negocio

1. **`periodos` es la fuente única de verdad** — nunca se duplican saldos en otra tabla.
2. **Tipos de pago:**
   - **Completo** → 1 periodo en estado `completo`.
   - **Abono** → 1 periodo `abono` con saldo restante.
   - **Adelantado** → N periodos (`$150.000 / $50.000` = 3 periodos `completo`).
   - **Mixto** → `$125.000 / $50.000` = 2 `completo` + 1 `abono` de $25.000.
3. **Estados financieros:** `al_dia`, `proximo_vencer`, `vence_hoy`, `vencido`, `abono`, `adelantado` (calculados en `utils/finanzas.ts`).
4. **Anulación de pago** → revierte `periodo.pagado/saldo/estado` + `saldo_pendiente` del jugador y escribe en bitácora.
5. **Caja cerrada** → bloquea anulaciones del día; exige registrar un ajuste.
6. **Cobranzas nunca modifica la deuda** — es de solo lectura; su función es seguimiento y contacto.
7. **Cambiar la mensualidad de un jugador** no altera periodos anteriores (los periodos guardan snapshot del objetivo).

---

## 7. Roles y permisos

Jerarquía (`utils/permissions.ts`): `super_admin` (5) > `admin` (4) > `tesorero` (3) > `entrenador`/`profe` (2) > `auxiliar`/`asistente` (1).

| Rol | Alcance |
|---|---|
| `super_admin` | Todo + bitácora + configuración + respaldos |
| `admin` | Operativa completa |
| `tesorero` | Jugadores, pagos, caja, gastos, reportes, cobranzas, WhatsApp, inventario |
| `entrenador` / `profe` | Jugadores, categorías, deportivo, notas |
| `auxiliar` / `asistente` | Jugadores (lectura), asistencias, inventario |

**Protección en dos capas:**
1. `RoleGuard` por ruta en `App.tsx` (redirige a `/` si el rol no está autorizado).
2. Sidebar filtra los menús según `roles` de cada ítem.

---

## 8. Modelo de datos (dominios)

21 tipos en `frontend/src/types/`:

| Dominio | Tipo | Relaciones clave |
|---|---|---|
| Personas | `jugador`, `categoria`, `profesor` | `categoria.profesor_id` = fuente del vínculo |
| Finanzas | `pago`, `periodo`, `caja`, `gasto` | `pago` → `pago_periodos` → `periodo` |
| Académico | `asistencia`, `entrenamiento` | `asistencia.entrenamiento_id` |
| Competencia | `partido`, `convocatoria`, `torneo` | `partido.torneo_id`, `convocatoria.partido_id` |
| Control | `alerta`, `nota`, `bitacora`, `config`, `whatsapp`, `inventario`, `reporte` | `alerta.jugador_id`, `nota.jugador_id` |

**Criterio de vinculación:** las relaciones usan **ID**, nunca nombres. Donde se muestra nombre (ej. entrenador en entrenamientos), se resuelve desde `profesorService` al momento de cargar.

---

## 9. Diseño de interfaz

### Sistema de componentes reutilizables
- **UI:** Button, Input, Textarea, Select, Badge, Avatar, Icon, NumberInput, DatePicker, Tooltip, PeriodoGrid, Spinner, EmptyState, ActionsCell
- **Data:** DataTable, SearchBar, FilterSelect, Pagination, TableSkeleton
- **Feedback:** LoadingOverlay, ErrorState, SuccessState, ToastList, ErrorBoundary
- **Forms:** FormModal, ConfirmDialog, FormField, FormGrid
- **Layout:** Sidebar (6 grupos, colapsable), PageHeader, Breadcrumbs, Header

### Reglas de UX aplicadas en todo el sistema
- **Paginación** en todas las tablas que pueden crecer (búsqueda + filtro + paginación combinados).
- **Validación** con `validators.ts` y feedback inline.
- **Doble clic bloqueado** durante el envío (`saving` deshabilita el botón).
- **Estados vacíos / carga / error** consistentes en cada lista.
- **Confirmaciones destructivas** con `ConfirmDialog` (anular, eliminar, reabrir caja).
- **Factura de cobro imprimible** desde Pagos y Cobranzas (`window.print()` → PDF).
- **Exportar** a Excel (CSV) y PDF en Asistencias.
- **Accesibilidad:** iconos con `title`, contraste alto sobre fondo oscuro, navegación por teclado.

---

## 10. Seguridad y auditoría

| Mecanismo | Implementación |
|---|---|
| Control de acceso | `RoleGuard` + `PERMISOS` por módulo |
| Auditoría | Bitácora con 20 acciones tipadas (qué, quién, cuándo, motivo) |
| Anulaciones | Siempre con motivo obligatorio + registro en bitácora |
| Cierre de caja | Bloquea ediciones retroactivas del día |
| Respaldo | Exportación/importación JSON desde Configuración |
| Error global | `ErrorBoundary` envolviendo el layout principal |
| Datos | Validación de entrada, sin claves ni secretos en el cliente |

> **Nota:** en modo demo la autenticación es simulada (`admin`/`admin123` en `localStorage`). La versión con backend debe implementar JWT real.

---

## 11. Calidad y pruebas

- **Verificación de tipos:** `npx tsc --noEmit` limpio (0 errores).
- **Build de producción:** `tsc -b && vite build` sin errores.
- **Auditoría de integración:** 21/21 pruebas de flujo pasado (pagos, anulaciones, caja, roles).
- **Auditoría de código:** revisión de botones/acciones por cada uno de los 20 módulos (verificado que cada acción esté conectada).
- **Sin deuda técnica conocida:** código muerto eliminado, imports sin usar limpiados, iconos centralizados.

> Pendiente formal: no hay suite de tests unitarios automatizados (fuera de alcance de la fase actual).

---

## 12. Despliegue

**Plataforma:** Vercel — cada push a `main` despliega automáticamente.

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist"
}
```

- **SPA rewrites:** rutas manejadas por `index.html` (evita 404 en recarga).
- **Caché:** `/assets/*` con `immutable` por un año.
- **Una vez desplegado:** hacer `Ctrl+Shift+R` (recarga dura) para ver los cambios.

---

## 13. Estado actual

### Completado
- 20 módulos con CRUD completo sobre `localStorage`.
- Flujo financiero cerrado y verificado extremo a extremo.
- Rediseño de Cobranzas como centro financiero (Jugador, Categoría, Periodo, Mensualidad, Abonado, Estado, Saldo, Vencimiento + Cobrar/Factura).
- Datos ficticios eliminados: el sistema arranca **vacío**, el usuario llena manualmente.
- Paginación, filtros y búsqueda integrados en todas las listas.
- Respaldo/restore, factura imprimible, export Excel/PDF, bitácora completa.
- Roles y permisos en todas las rutas.

### Fuera de alcance (por decisión)
- Backend / PostgreSQL / API real (eliminado; solo frontend).
- Suite de tests automatizados.
- Login real con JWT.
- Nómina automática, conversión automática inventario→gasto, tabla de posiciones.

---

## 14. Ruta a producción (fase backend)

1. Reimplementar rutas HTTP en `apiClient.ts` (la UI no cambia).
2. Modelo de datos relacional en PostgreSQL: `jugadores`, `categorias`, `profesores`, `pagos`, `periodos`, `pago_periodos`, `caja`, `gastos`, `asistencias`, etc.
3. Auth real con JWT + bcrypt y `permissions` del lado servidor.
4. Migración de datos existentes en `localStorage`.
5. Webhook oficial de WhatsApp Business Cloud API.

---

## Anexo A — Ejecución

```bash
git clone https://github.com/guzmanmaceajavier-bit/ERP-futbol.git
cd ERP-futbol/frontend
npm install
npm run dev      # → http://localhost:5173
```

**Credenciales demo:** `admin` / `admin123`

```bash
npm run build    # producción
npm run preview  # previsualizar build
```
