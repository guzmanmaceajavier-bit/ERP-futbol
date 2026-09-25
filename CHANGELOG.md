# Changelog

Todo notable de este proyecto queda documentado en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Las versiones siguen [SemVer](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Dependencias entre modulos: los selects de categoria ahora se cargan desde el menu Categorias.
- La mensualidad del jugador se deriva de la mensualidad base de la categoria seleccionada.
- Calculo automatico de la edad a partir de la fecha de nacimiento en la ficha del jugador.
- ESLint, Prettier, EditorConfig, NVMRC y GitAttributes.
- Tests base con Vitest.

### Changed
- Cobranzas rediseñado como centro financiero (Jugador · Categoria · Periodo · Mensualidad · Abonado · Saldo · Vencimiento).

## [1.0.0] - 2026-09-25

### Added
- 20 modulos operativos: Jugadores, Categorias, Profesores, Asistencias, Entrenamientos, Partidos, Convocatorias, Torneos, Pagos, Caja, Gastos, Reportes, Inventario, Notas, Cobranzas, WhatsApp, Bitacora, Configuracion, Dashboard y Login.
- Flujo financiero cerrado: Pago -> Periodos -> Cobranzas -> Caja -> Reportes -> Bitacora.
- 7 roles de usuario con permisos por modulo y RoleGuard en cada ruta.
- Modo demo con persistencia en localStorage (sin backend).
- Factura de cobro imprimible, exportar a Excel/PDF y respaldo JSON.
- Auditoria de 20 acciones tipadas en Bitacora.
