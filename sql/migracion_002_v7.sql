-- =============================================
-- EFUSA - Migración 002 V7 CORREGIDA
-- 5 Menús + WhatsApp + Caja Diaria Bloqueable
-- =============================================

-- 1. Ampliar usuarios con roles corregidos
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role_v7 VARCHAR(20) DEFAULT 'admin';
UPDATE usuarios SET role = CASE 
  WHEN role = 'admin' THEN 'super_admin' 
  ELSE role END WHERE role = 'admin' AND id = 1;
-- Roles válidos: super_admin, admin, profe
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;
-- No usamos CHECK estricto para permitir migración, validamos en API

-- 2. Ampliar jugadores: género, beca, acudiente, vencimiento, foto, QR
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS genero VARCHAR(10) DEFAULT 'Masculino';
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS tipo_beca VARCHAR(30) DEFAULT 'Normal';
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS descuento_beca NUMERIC(5,2) DEFAULT 0;
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS acudiente_nombre VARCHAR(200);
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS acudiente_telefono VARCHAR(20);
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS acudiente_parentesco VARCHAR(50);
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS qr_code VARCHAR(100);
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS proximo_vencimiento DATE;
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS saldo_pendiente NUMERIC(10,2) DEFAULT 0;
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;

-- Normalizar género existente
UPDATE jugadores SET genero = 'Masculino' WHERE genero IS NULL;

-- Tipo beca valores: Normal, Becado 50%, Becado 100%, Patrocinado
UPDATE jugadores SET descuento_beca = 0 WHERE tipo_beca = 'Normal';
UPDATE jugadores SET descuento_beca = 50 WHERE tipo_beca = 'Becado 50%';
UPDATE jugadores SET descuento_beca = 100 WHERE tipo_beca IN ('Becado 100%', 'Patrocinado');

-- 3. Categorías configurables (antes era ENUM hardcodeado)
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  tipo_genero VARCHAR(20) DEFAULT 'Mixto', -- Masculino / Femenino / Mixto
  mensualidad_base NUMERIC(10,2) DEFAULT 50000,
  edad_min INTEGER,
  edad_max INTEGER,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO categorias (nombre, tipo_genero, mensualidad_base) VALUES
  ('Sub 17-18', 'Mixto', 50000),
  ('Sub 16-15', 'Mixto', 50000),
  ('Sub 14-13', 'Mixto', 40000),
  ('Sub 12-11', 'Mixto', 40000),
  ('Sub 10-9', 'Mixto', 30000),
  ('Sub 8-7', 'Mixto', 30000)
ON CONFLICT (nombre) DO NOTHING;

-- 4. Tabla GASTOS
CREATE TABLE IF NOT EXISTS gastos (
  id SERIAL PRIMARY KEY,
  concepto VARCHAR(200) NOT NULL,
  descripcion TEXT,
  monto NUMERIC(10,2) NOT NULL,
  categoria VARCHAR(100) DEFAULT 'General', -- Balones, Uniformes, Agua, Nómina, etc
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  comprobante_url TEXT,
  creado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Tabla CAJA DIARIA BLOQUEABLE
CREATE TABLE IF NOT EXISTS caja_diaria (
  id SERIAL PRIMARY KEY,
  fecha DATE UNIQUE NOT NULL,
  saldo_inicial NUMERIC(10,2) DEFAULT 0,
  total_ingresos NUMERIC(10,2) DEFAULT 0,
  total_gastos NUMERIC(10,2) DEFAULT 0,
  saldo_final NUMERIC(10,2) DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'abierta', -- abierta, cerrada, bloqueada
  abierta_por INTEGER REFERENCES usuarios(id),
  cerrada_por INTEGER REFERENCES usuarios(id),
  desbloqueada_por INTEGER REFERENCES usuarios(id),
  motivo_desbloqueo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Tabla PROFESORES (nómina automática a gastos)
CREATE TABLE IF NOT EXISTS profesores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  telefono VARCHAR(20),
  especialidad VARCHAR(100),
  salario NUMERIC(10,2) DEFAULT 0,
  fecha_ingreso DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Tabla PAGOS PROFESORES (para nómina)
CREATE TABLE IF NOT EXISTS pagos_profesores (
  id SERIAL PRIMARY KEY,
  profesor_id INTEGER NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  monto NUMERIC(10,2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  mes_pago VARCHAR(20),
  observacion TEXT,
  gasto_id INTEGER REFERENCES gastos(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Tabla INVENTARIO
CREATE TABLE IF NOT EXISTS inventario (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(100) DEFAULT 'General',
  stock INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 5,
  costo_unitario NUMERIC(10,2) DEFAULT 0,
  proveedor VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO inventario (nombre, categoria, stock, stock_minimo, costo_unitario) VALUES
  ('Balón #5', 'Balones', 12, 5, 80000),
  ('Conos', 'Entrenamiento', 30, 10, 5000),
  ('Uniforme Local', 'Uniformes', 20, 5, 60000)
ON CONFLICT DO NOTHING;

-- 9. Ampliar TORNEOS con género
ALTER TABLE torneos ADD COLUMN IF NOT EXISTS tipo_genero VARCHAR(20) DEFAULT 'Mixto';
ALTER TABLE torneos ADD COLUMN IF NOT EXISTS categoria_requerida VARCHAR(100);

-- 10. Ampliar PAGOS con lógica V7
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS saldo_pendiente NUMERIC(10,2) DEFAULT 0;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS vencimiento DATE;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'completo'; -- completo, abono, mora
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS recibo_numero VARCHAR(20);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS mes_abonado VARCHAR(20);

-- Generar recibo_numero para pagos existentes
UPDATE pagos SET recibo_numero = 'REC-' || LPAD(id::text, 5, '0') WHERE recibo_numero IS NULL;

-- 11. Tabla BITÁCORA TOTAL
CREATE TABLE IF NOT EXISTS bitacora (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP DEFAULT NOW(),
  usuario_id INTEGER REFERENCES usuarios(id),
  usuario_nombre VARCHAR(200),
  accion VARCHAR(100) NOT NULL, -- CREAR, EDITAR, ELIMINAR, CIERRE_CAJA, DESBLOQUEO, WHATSAPP
  modulo VARCHAR(100), -- jugadores, pagos, caja, etc
  detalle TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_modulo ON bitacora(modulo);

-- 12. Tabla WHATSAPP PLANTILLAS
CREATE TABLE IF NOT EXISTS whatsapp_plantillas (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL, -- recordatorio_3dias, mora_dia6, confirmacion_pago, abono_incompleto, convocatoria, faltas_3
  nombre VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL, -- con variables {nombre_acudiente}, {nombre_jugador}, {saldo}, {vencimiento}, {categoria}
  aprobada_meta BOOLEAN DEFAULT false,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO whatsapp_plantillas (codigo, nombre, mensaje, aprobada_meta) VALUES
  ('recordatorio_3dias', 'Recordatorio 3 días antes', 'Hola {nombre_acudiente}, la mensualidad de {nombre_jugador} ({categoria}) vence el {vencimiento}. Valor: ${saldo}. ¡Queda al día y evita mora! ⚽ EFUSA', true),
  ('mora_dia6', 'Alerta mora día 6', 'Hola {nombre_acudiente}, {nombre_jugador} pasó a estado DEBE. Le falta ${saldo} de {mes}. Evite recargo. EFUSA', true),
  ('confirmacion_pago', 'Confirmación de pago', 'Gracias {nombre_acudiente}, recibimos ${monto} de {nombre_jugador}. Próximo pago: {vencimiento}. Recibo {recibo}. ¡Gracias! ✅ EFUSA', true),
  ('abono_incompleto', 'Abono incompleto', '{nombre_acudiente}, {nombre_jugador} abonó ${monto}, le faltan ${saldo} para quedar al día. EFUSA', true),
  ('convocatoria', 'Convocatoria partido', 'Hola {nombre_acudiente}, {nombre_jugador} está convocado el {fecha_partido} vs {rival}. Cancha {cancha}. ¡Presente! 🏆 EFUSA', true),
  ('faltas_3', 'Alerta 3 faltas', 'Hola {nombre_acudiente}, {nombre_jugador} lleva 3 faltas seguidas. Te esperamos. EFUSA', true)
ON CONFLICT (codigo) DO NOTHING;

-- 13. Tabla WHATSAPP HISTORIAL
CREATE TABLE IF NOT EXISTS whatsapp_historial (
  id SERIAL PRIMARY KEY,
  jugador_id INTEGER REFERENCES jugadores(id) ON DELETE SET NULL,
  telefono VARCHAR(20) NOT NULL,
  plantilla_codigo VARCHAR(50) REFERENCES whatsapp_plantillas(codigo),
  mensaje TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'individual', -- automatico, masivo, individual
  estado VARCHAR(20) DEFAULT 'enviado', -- en_cola, enviado, leido, fallido, opt_out
  cola_posicion INTEGER,
  enviado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_jugador ON whatsapp_historial(jugador_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_fecha ON whatsapp_historial(created_at DESC);

-- 14. Tabla WHATSAPP COLA (para masivos con delay 15s)
CREATE TABLE IF NOT EXISTS whatsapp_cola (
  id SERIAL PRIMARY KEY,
  jugador_id INTEGER REFERENCES jugadores(id),
  telefono VARCHAR(20) NOT NULL,
  mensaje TEXT NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, enviando, enviado, fallido
  intentos INTEGER DEFAULT 0,
  programado_para TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 15. Tabla CONFIGURACIÓN (Solo Super Admin)
CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('escuela_nombre', 'EFUSA', 'Nombre de la escuela'),
  ('escuela_telefono', '3000000000', 'Teléfono principal'),
  ('regla_dias_recordatorio', '3', 'Días antes de vencer para recordar'),
  ('regla_dia_mora', '6', 'Día del mes que pasa a mora'),
  ('regla_recargo_mora', '0', 'Recargo por mora'),
  ('whatsapp_delay_segundos', '15', 'Delay entre mensajes masivos'),
  ('caja_bloqueo_automatico', 'true', 'Bloquear caja al cerrar día')
ON CONFLICT (clave) DO NOTHING;

-- 16. Actualizar mensualidad_objetivo considerando beca
-- (se calculará en API: mensualidad_base * (1 - descuento/100))

-- 17. Crear usuario profe por defecto
INSERT INTO usuarios (username, password, nombre, role) VALUES
  ('profe', '$2a$10$8KzQMGx5C5Kc5Q5y5Q5u5y5u5y5u5y5u5y', 'Profesor Demo', 'profe')
ON CONFLICT (username) DO NOTHING;
