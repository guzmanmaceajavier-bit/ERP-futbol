# ERP Futbol

Sistema web completo para gestionar escuelas de futbol. React + TypeScript + Node.js.

Funciona en modo demo con archivos JSON (sin base de datos) o con PostgreSQL (Neon).

---

## Como correr

```bash
# Instalar dependencias del frontend
cd frontend && npm install && cd ..

# Iniciar backend y frontend
doble clic en iniciar.bat
```

O manualmente:

```bash
# Terminal 1 - Backend
node api/index.js

# Terminal 2 - Frontend
cd frontend && npx vite
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Credenciales: `admin` / `admin123`

---

## Arquitectura

```
/
├── api/                        # Backend Node.js (solo API)
│   ├── index.js                # Servidor HTTP + router
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
├── frontend/                   # React + TypeScript + Tailwind
│   └── src/
│       ├── pages/              # 20 paginas del sistema
│       ├── components/         # Componentes reutilizables
│       ├── services/           # Consumo de API
│       ├── types/              # Tipos TypeScript
│       ├── hooks/              # Custom hooks
│       ├── context/            # Auth context
│       └── utils/              # Constantes, formatters
│
├── sql/                        # Migraciones PostgreSQL
├── data/                       # JSONs (solo modo demo)
└── iniciar.bat                 # Inicia backend + frontend
```

---

## Modulos del sistema

### Dashboard
- 6 KPIs (ingresos, gastos, balance, jugadores, pagos pendientes, pagos hoy)
- Resumen financiero con comparativa mes anterior
- Estado de mensualidades con barra de progreso
- Ultimos pagos y alertas pendientes
- Acciones rapidas

### ESCUELA
- **Jugadores**: CRUD con busqueda, filtros, becas, acudientes, toggle activo/inactivo
- **Categorias**: CRUD con mensualidad base y profesor asignado
- **Profesores**: CRUD con especialidad, salario y pago de nomina
- **Notas**: Notas por jugador con autor y fecha

### DEPORTIVO
- **Asistencias**: Registro por categoria con vista consolidada
- **Torneos**: CRUD con categoria requerida y convocados
- **Entrenamientos**: CRUD con entrenador, tema y estado
- **Partidos**: CRUD con rival, resultado y goles
- **Convocatorias**: Seleccion de jugadores por partido

### DINERO
- **Pagos/Ingresos**: Registro con sistema de periodos, tipos (mensual/abono/adelantado), PeriodoGrid visual
- **Caja**: Apertura/cierre diario, control de saldo
- **Gastos**: CRUD con categorias (nomina, arriendo, servicios, etc.)
- **Reportes**: Recaudado por mes, por categoria, estado de cuenta

### CANCHA
- **Inventario**: CRUD con stock, stock minimo y proveedor

### SISTEMA
- **Alertas**: Automaticas desde periodos + manuales, descarte y WhatsApp masivo
- **WhatsApp**: Plantillas automaticas con variables, historial de envios
- **Bitacora**: Log de auditoria (quien, que, cuando)
- **Configuracion**: 7 secciones (escuela, cobros, WhatsApp, usuarios, backup, mantenimiento, zona de peligro)

---

## Sistema de periodos de pago

El nucleo del sistema financiero. Cada jugador tiene periodos mensuales en `periodos_mensuales`:

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
- **Pagos adelantados**: crean N periodos
- **Excedentes**: van a `saldos_favor`
- **Editar/eliminar pago**: reversa exacta de asignaciones
- **Becas 100%**: crean periodos automaticamente con objetivo=0
- **saldo_pendiente**: calculado desde periodos (no stored)

---

## Roles

| Rol | Acceso |
|-----|--------|
| `super_admin` | Todo: config, bitacora, zona de peligro, usuarios |
| `admin` | Todo lo operativo |
| `entrenador` | Jugadores, categorias, asistencias, torneos, notas |
| `auxiliar` | Jugadores (lectura), asistencias, inventario |

---

## Tecnologias

- **Backend**: Node.js puro (sin Express), HTTP nativo
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Base de datos**: PostgreSQL (Neon) o JSON files (demo)
- **Auth**: JWT con 24h expiracion
- **UI**: Space Grotesk (titulos), JetBrains Mono (numeros), Inter (body)

---

## Migracion a PostgreSQL

```bash
# Ejecutar en orden:
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
