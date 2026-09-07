-- =============================================
-- EFUSA - Migración 001
-- Fecha: 2024-07-09
-- =============================================

-- 1. Tabla de usuarios (autenticación)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(200),
  role VARCHAR(50) DEFAULT 'admin',
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Agregar columna mensualidad_objetivo a jugadores
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS mensualidad_objetivo NUMERIC(10,2) DEFAULT 50000;

-- 3. Actualizar mensualidad_objetivo según categoría
UPDATE jugadores SET mensualidad_objetivo = 50000 WHERE categoria IN ('Sub 17-18', 'Sub 16-15') AND mensualidad_objetivo IS NULL;
UPDATE jugadores SET mensualidad_objetivo = 40000 WHERE categoria IN ('Sub 14-13', 'Sub 12-11') AND mensualidad_objetivo IS NULL;
UPDATE jugadores SET mensualidad_objetivo = 30000 WHERE categoria IN ('Sub 10-9', 'Sub 8-7') AND mensualidad_objetivo IS NULL;

-- 4. Tabla de asistencia
CREATE TABLE IF NOT EXISTS asistencias (
  id SERIAL PRIMARY KEY,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  presente BOOLEAN DEFAULT true,
  observacion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(jugador_id, fecha)
);

-- 5. Tabla de torneos
CREATE TABLE IF NOT EXISTS torneos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  lugar VARCHAR(200),
  costo NUMERIC(10,2) DEFAULT 0,
  observacion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Tabla de torneo_jugadores (convocados)
CREATE TABLE IF NOT EXISTS torneo_jugadores (
  id SERIAL PRIMARY KEY,
  torneo_id INTEGER NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  convocado BOOLEAN DEFAULT true,
  UNIQUE(torneo_id, jugador_id)
);

-- 7. Tabla de notas por jugador
CREATE TABLE IF NOT EXISTS notas_jugador (
  id SERIAL PRIMARY KEY,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  nota TEXT NOT NULL,
  creado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Insertar usuario admin por defecto (contraseña: admin123)
-- Cambiar después del primer inicio de sesión
INSERT INTO usuarios (username, password, nombre, role)
VALUES ('admin', '$2a$10$8KzQMGx5C5Kc5Q5y5Q5u5u5y5u5y5u5y5u5y5u5y5u5y5u5y5u5y', 'Administrador', 'admin')
ON CONFLICT (username) DO NOTHING;
