# ERP Futbol

Sistema web completo para gestionar escuelas de futbol. React + TypeScript + Vite + Tailwind CSS.

Funciona en modo demo con datos en localStorage (sin backend) o con PostgreSQL (Neon) via Node.js.

---

## Deploy en Vercel

```bash
# 1. Subir a GitHub
git add . && git commit -m "feat: descripcion" && git push origin main

# 2. En Vercel: New Project > Import Git Repository > seleccionar ERP-futbol
# 3. Build settings:
#    - Framework: Vite
#    - Root directory: /
#    - Build command: cd frontend && npm install && npm run build
#    - Output directory: frontend/dist
# 4. Redeploy
```

En Vercel el sistema funciona en **modo demo automatico** (localStorage, sin backend).

---

## Como correr local

```bash
# Instalar dependencias
cd frontend && npm install && cd ..

# Opcion 1: doble clic en iniciar.bat
# Opcion 2: manual
node api/index.js          # Backend en :3000
cd frontend && npx vite    # Frontend en :5173
```

- Credenciales: `admin` / `admin123`
- Sin backend detectado: entra en modo demo automaticamente

---

## Arquitectura

```
/
├── api/                        # Backend Node.js (solo API, no sirve archivos estaticos)
│   ├── index.js                # Servidor HTTP + router centralizado (20 modulos)
│   ├── _auth.js                # JWT auth middleware
│   ├── _db.js                  # Conexion PostgreSQL (Neon)
│   ├── _store.js               # Lectura/escritura JSON (demo)
│   ├── _bitacora.js            # Logger de auditoria
│   ├── auth.js                 # Login / registro
│   ├── jugadores.js            # CRUD jugadores + saldo desde periodos
│   ├── pagos.js                # Pagos con sistema de periodos
│   ├── periodos.js             # API de periodos mensuales
│   ├── categorias.js           # CRUD categorias
│   ├── profesores.js           # CRUD profesores + nomina
│   ├── asistencias.js          # Control de asistencia
│   ├── gastos.js               # CRUD gastos
│   ├── caja.js                 # Control de caja diaria
│   ├── inventario.js           # Inventario de equipamiento
│   ├── torneos.js              # CRUD torneos
│   ├── alertas.js              # Alertas automaticas desde periodos
│   ├── notas.js                # Notas por jugador
│   ├── bitacora.js             # Log de auditoria
│   ├── reportes.js             # Reportes financieros
│   ├── whatsapp.js             # Envio de mensajes
│   ├── config.js               # Configuracion del sistema
│   ├── entrenamientos.js       # CRUD entrenamientos
│   ├── partidos.js             # CRUD partidos
│   └── convocatorias.js        # CRUD convocatorias
│
├── frontend/                   # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/              # 20 paginas del sistema
│       ├── components/         # Componentes reutilizables (UI, forms, data, feedback)
│       ├── services/           # apiClient + demoStore (mock completo en localStorage)
│       ├── types/              # Tipos TypeScript por modulo
│       ├── hooks/              # useApi, useModal, usePagination, useToast, useDebounce
│       ├── context/            # AuthContext (login/logout/roles)
│       ├── layouts/            # MainLayout + AuthLayout
│       └── utils/              # constantes, formatters
│
├── sql/                        # Migraciones PostgreSQL (001, 002, 003_periodos)
├── data/                       # JSONs (solo modo demo local)
├── vercel.json                 # Configuracion Vercel (outputDirectory, SPA rewrites)
├── .vercelignore               # Excluye api/, data/, sql/ del deploy
└── iniciar.bat                 # Inicia backend + frontend
```

---

## Modulos del sistema

### Dashboard
- Saludo personalizado con nombre de escuela configurable
- 6 KPIs: ingresos del mes, gastos del mes, balance, total jugadores, pagos pendientes, pagos hoy
- Resumen financiero con comparativa vs mes anterior
- Estado de mensualidades con barra de progreso y conteo por estado
- Ultimos 5 pagos
- Alertas por prioridad (DEUDA roja, ABONO azul, VENCIMIENTO amarillo)
- Acciones rapidas: registrar pago, agregar jugador, ver reportes, WhatsApp

### ESCUELA
- **Jugadores**: CRUD completo con busqueda, filtros (categoria/genero), becas, acudientes, toggle activo/inactivo, saldo pendiente, link a pagos, WhatsApp directo
- **Categorias**: CRUD con mensualidad base, genero, profesor asignado (se resuelve el nombre automaticamente)
- **Profesores**: CRUD con especialidad, salario, fecha de ingreso
- **Asistencias**: Registro por categoria con vista consolidada
- **Torneos**: CRUD con categoria requerida y convocados
- **Notas**: Notas por jugador con autor y fecha

### DEPORTIVO
- **Entrenamientos**: CRUD con entrenador, tema y estado
- **Partidos**: CRUD con rival, resultado y goles
- **Convocatorias**: Seleccion de jugadores por partido

### DINERO
- **Pagos**: Registro con sistema de periodos, tipos (completo/abono/adelantado), PeriodoGrid visual, meses cubiertos
- **Caja**: Apertura/cierre diario con saldo inicial, calculo automatico de saldo final, desbloqueo
- **Gastos**: CRUD con categorias (nomina, arriendo, equipamiento, servicios, etc.)
- **Reportes**: 3 vistas - Recaudado por mes, por categoria, estado de cuenta

### CANCHA
- **Inventario**: CRUD con stock, stock minimo y proveedor

### SISTEMA
- **Alertas**: Automaticas desde periodos + manuales, muestra nombre del jugador, deuda y categoria, descarte y restaurar
- **WhatsApp**: Plantillas disponibles (pago, recordatorio, bienvenida, promocion), historial de envios con estado
- **Bitacora**: Log de auditoria (quien, que, cuando, detalle)
- **Configuracion**: 7 secciones
  1. Datos de la escuela
  2. Reglas de cobro (dia pago, dia mora)
  3. WhatsApp y notificaciones (editor de plantillas)
  4. Usuarios y seguridad (roles, sesiones)
  5. Backup y restauracion (17 datasets, export/import JSON)
  6. Mantenimiento (estado del sistema, datos demo)
  7. Zona de peligro (reset total, bitacora, super_admin only)

---

## Sistema de periodos de pago

El nucleo del sistema financiero:

```
Jugador
  └── periodos_mensuales (un registro por mes)
        ├── objetivo: $50.000 (snapshot historico)
        ├── pagado: $70.000
        ├── estado: pendiente | abono | completo | beca
        └── pago_periodos (tabla intermedia N:N)
              └── pago → monto_aplicado por periodo
```

- **Pagos completos**: crean 1 periodo
- **Pagos adelantados**: crean N periodos con `meses_cubiertos[]`
- **Excedentes**: van a `saldos_favor`
- **Editar/eliminar pago**: reversa exacta de `monto_aplicado` en cada periodo afectado
- **Becas 100%**: crean periodos automaticamente con objetivo=0
- **saldo_pendiente**: calculado desde periodos (no stored)
- **Alertas**: generadas automaticamente desde periodos con estado pendiente/abono

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| `super_admin` | Todo: config, bitacora, zona de peligro, usuarios |
| `admin` | Todo lo operativo (pagos, caja, gastos, reportes, alertas, whatsapp) |
| `entrenador` / `profe` | Jugadores, categorias, entrenamientos, partidos, convocatorias, asistencias, torneos, notas |
| `auxiliar` | Jugadores (lectura), asistencias, inventario |

---

## Login y autenticacion

- Login con usuario/contrasena
- Boton mostrar/ocultar contrasena
- Demo mode: credenciales `admin` / `admin123` (solo visible en modo demo)
- JWT con 24h expiracion (backend) o token demo (frontend)
- Logout con confirmacion
- Proteccion de rutas por rol
- Modo demo: detecta automaticamente si no hay backend localhost

---

## Datos demo (modo frontend)

El sistema genera 10 jugadores, 3 profesores, 6 categorias, 3 pagos, 3 gastos, 4 periodos, 3 alertas, 2 notas, 4 plantillas WhatsApp y 3 historiales de envio.

Todos los CRUD (crear, editar, eliminar) funcionan en localStorage sin backend.

---

## Tecnologias

- **Backend**: Node.js puro (sin Express), HTTP nativo, archivos JSON
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Base de datos**: PostgreSQL (Neon) o JSON files (demo)
- **Auth**: JWT con 24h expiracion
- **UI**: Space Grotesk (titulos), JetBrains Mono (numeros), Inter (body)
- **Deploy**: Vercel (frontend estatico), detecta backend automaticamente

---

## Migracion a PostgreSQL

```bash
psql tu_base -f sql/migracion_001.sql
psql tu_base -f sql/migracion_002.sql
psql tu_base -f sql/migracion_003_periodos.sql
```

Configurar `DATABASE_URL` en `.env`:

```
DATABASE_URL=postgresql://usuario:password@host:5432/dbname
```

---

## Git

```bash
git add .
git commit -m "feat: descripcion"
git push origin main
```
