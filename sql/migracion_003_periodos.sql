-- =============================================
-- ERP Futbol - Migracion 003: Sistema de Periodos
-- Fecha: 2026-09-15
-- =============================================

-- 1. Tabla periodos_mensuales
CREATE TABLE IF NOT EXISTS periodos_mensuales (
  id SERIAL PRIMARY KEY,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  objetivo NUMERIC(10,2) NOT NULL,
  pagado NUMERIC(10,2) DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(jugador_id, anio, mes)
);

CREATE INDEX IF NOT EXISTS idx_periodos_jugador ON periodos_mensuales(jugador_id);
CREATE INDEX IF NOT EXISTS idx_periodos_anio_mes ON periodos_mensuales(anio, mes);

-- 2. Tabla pago_periodos (relacion N:N entre pagos y periodos)
CREATE TABLE IF NOT EXISTS pago_periodos (
  id SERIAL PRIMARY KEY,
  pago_id INTEGER NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
  periodo_id INTEGER NOT NULL REFERENCES periodos_mensuales(id) ON DELETE CASCADE,
  monto_aplicado NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pago_id, periodo_id)
);

CREATE INDEX IF NOT EXISTS idx_pago_periodos_pago ON pago_periodos(pago_id);
CREATE INDEX IF NOT EXISTS idx_pago_periodos_periodo ON pago_periodos(periodo_id);

-- 3. Tabla saldos_favor
CREATE TABLE IF NOT EXISTS saldos_favor (
  id SERIAL PRIMARY KEY,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  monto NUMERIC(10,2) NOT NULL,
  origen_pago_id INTEGER REFERENCES pagos(id) ON DELETE SET NULL,
  usado BOOLEAN DEFAULT false,
  usado_en_pago_id INTEGER REFERENCES pagos(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saldos_favor_jugador ON saldos_favor(jugador_id);

-- 4. Configuracion: dia limite de pago y excedente
INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('dia_limite_pago', '5', 'Dia del mes limite para pago sin recargo'),
  ('excedente_permitido', 'true', 'Permitir saldo a favor cuando el pago excede el objetivo')
ON CONFLICT (clave) DO NOTHING;

-- 5. Tabla ENTRENAMIENTOS
CREATE TABLE IF NOT EXISTS entrenamientos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  hora VARCHAR(10),
  categoria VARCHAR(100) NOT NULL,
  entrenador VARCHAR(200),
  lugar VARCHAR(200),
  tema VARCHAR(200),
  observaciones TEXT,
  estado VARCHAR(20) DEFAULT 'programado',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Tabla PARTIDOS
CREATE TABLE IF NOT EXISTS partidos (
  id SERIAL PRIMARY KEY,
  rival VARCHAR(200) NOT NULL,
  fecha DATE NOT NULL,
  hora VARCHAR(10),
  lugar VARCHAR(200),
  categoria VARCHAR(100) NOT NULL,
  resultado VARCHAR(20),
  goles_favor INTEGER,
  goles_contra INTEGER,
  observaciones TEXT,
  estado VARCHAR(20) DEFAULT 'programado',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Tabla CONVOCATORIAS
CREATE TABLE IF NOT EXISTS convocatorias (
  id SERIAL PRIMARY KEY,
  partido_id INTEGER REFERENCES partidos(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL,
  convocados JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Migracion de pagos existentes a periodos
-- Paso 5a: Crear periodos desde pagos normales (no adelantados)
INSERT INTO periodos_mensuales (jugador_id, anio, mes, objetivo, pagado, estado)
SELECT
  p.jugador_id,
  EXTRACT(YEAR FROM p.fecha)::INTEGER,
  EXTRACT(MONTH FROM p.fecha)::INTEGER,
  COALESCE(j.mensualidad_objetivo, 50000),
  p.monto,
  CASE
    WHEN p.monto >= COALESCE(j.mensualidad_objetivo, 50000) THEN 'completo'
    WHEN p.monto > 0 THEN 'abono'
    ELSE 'pendiente'
  END
FROM pagos p
JOIN jugadores j ON j.id = p.jugador_id
WHERE p.tipo != 'adelantado'
ON CONFLICT (jugador_id, anio, mes) DO UPDATE SET
  pagado = periodos_mensuales.pagado + EXCLUDED.pagado,
  updated_at = NOW(),
  estado = CASE
    WHEN periodos_mensuales.pagado + EXCLUDED.pagado >= periodos_mensuales.objetivo THEN 'completo'
    WHEN periodos_mensuales.pagado + EXCLUDED.pagado > 0 THEN 'abono'
    ELSE 'pendiente'
  END;

-- Paso 5b: Crear pago_periodos para pagos normales
INSERT INTO pago_periodos (pago_id, periodo_id, monto_aplicado)
SELECT
  p.id,
  pm.id,
  p.monto
FROM pagos p
JOIN periodos_mensuales pm ON pm.jugador_id = p.jugador_id
  AND pm.anio = EXTRACT(YEAR FROM p.fecha)::INTEGER
  AND pm.mes = EXTRACT(MONTH FROM p.fecha)::INTEGER
WHERE p.tipo != 'adelantado';

-- Paso 5c: Migrar pagos adelantados
-- Distribuir monto entre los meses cubiertos
DO $$
DECLARE
  r RECORD;
  mes_base INTEGER;
  anio_base INTEGER;
  monto_por_mes NUMERIC;
  i INTEGER;
  mes_actual INTEGER;
  anio_actual INTEGER;
  periodo_id_val INTEGER;
BEGIN
  FOR r IN SELECT p.*, p.cantidad_meses FROM pagos p WHERE p.tipo = 'adelantado' AND p.cantidad_meses > 1
  LOOP
    anio_base := EXTRACT(YEAR FROM r.fecha)::INTEGER;
    mes_base := EXTRACT(MONTH FROM r.fecha)::INTEGER;
    monto_por_mes := ROUND(r.monto / r.cantidad_meses);

    FOR i IN 0 .. (r.cantidad_meses - 1)
    LOOP
      mes_actual := mes_base + i;
      anio_actual := anio_base;
      WHILE mes_actual > 12 LOOP
        mes_actual := mes_actual - 12;
        anio_actual := anio_actual + 1;
      END LOOP;

      -- Upsert periodo
      INSERT INTO periodos_mensuales (jugador_id, anio, mes, objetivo, pagado, estado)
      VALUES (r.jugador_id, anio_actual, mes_actual,
        COALESCE((SELECT mensualidad_objetivo FROM jugadores WHERE id = r.jugador_id), 50000),
        monto_por_mes,
        CASE WHEN monto_por_mes >= COALESCE((SELECT mensualidad_objetivo FROM jugadores WHERE id = r.jugador_id), 50000)
          THEN 'completo' ELSE 'abono' END)
      ON CONFLICT (jugador_id, anio, mes) DO UPDATE SET
        pagado = periodos_mensuales.pagado + monto_por_mes,
        updated_at = NOW(),
        estado = CASE
          WHEN periodos_mensuales.pagado + monto_por_mes >= periodos_mensuales.objetivo THEN 'completo'
          WHEN periodos_mensuales.pagado + monto_por_mes > 0 THEN 'abono'
          ELSE 'pendiente'
        END;

      -- Crear pago_periodo
      SELECT id INTO periodo_id_val FROM periodos_mensuales
        WHERE jugador_id = r.jugador_id AND anio = anio_actual AND mes = mes_actual;

      IF NOT EXISTS (SELECT 1 FROM pago_periodos WHERE pago_id = r.id AND periodo_id = periodo_id_val) THEN
        INSERT INTO pago_periodos (pago_id, periodo_id, monto_aplicado)
        VALUES (r.id, periodo_id_val, monto_por_mes);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 6. Eliminar columnas obsoletas de jugadores
ALTER TABLE jugadores DROP COLUMN IF EXISTS saldo_pendiente;
ALTER TABLE jugadores DROP COLUMN IF EXISTS proximo_vencimiento;
ALTER TABLE jugadores DROP COLUMN IF EXISTS mensualidad;

-- 7. Eliminar columnas obsoletas de pagos
ALTER TABLE pagos DROP COLUMN IF EXISTS mes_abonado;
