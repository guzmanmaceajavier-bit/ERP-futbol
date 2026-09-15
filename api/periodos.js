import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';
import { registrarBitacora } from './_bitacora.js';

function calcularEstado(pagado, objetivo) {
  if (pagado <= 0) return 'pendiente';
  if (pagado >= objetivo) return 'completo';
  return 'abono';
}

async function handler(req, res) {
  if (isDemoMode()) {
    let periodos = load('periodos');
    let pagos = load('pagos');
    let jugadores = load('jugadores');
    let pagoPeriodos = load('pago_periodos');

    if (req.method === 'GET') {
      const { jugador_id, anio, resumen } = req.query;

      if (resumen === 'true') {
        const anioActual = Number(anio) || new Date().getFullYear();
        const jugadoresActivos = jugadores.filter(j => j.activo !== false);
        const resultado = jugadoresActivos.map(j => {
          const periodosJugador = periodos.filter(p => p.jugador_id === j.id && p.anio === anioActual);
          const totalPagado = periodosJugador.reduce((s, p) => s + Number(p.pagado), 0);
          const totalObjetivo = periodosJugador.reduce((s, p) => s + Number(p.objetivo), 0);
          return {
            jugador_id: j.id,
            nombre: j.nombre + ' ' + (j.apellidos || ''),
            categoria: j.categoria,
            telefono: j.telefono,
            periodos: periodosJugador,
            total_pagado: totalPagado,
            total_objetivo: totalObjetivo,
            saldo: totalObjetivo - totalPagado
          };
        });
        return res.status(200).json(resultado);
      }

      let out = periodos;
      if (jugador_id) out = out.filter(p => p.jugador_id === Number(jugador_id));
      if (anio) out = out.filter(p => p.anio === Number(anio));
      out = out.sort((a, b) => a.anio - b.anio || a.mes - b.mes);
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { accion } = req.body;

      if (accion === 'generar') {
        const { jugador_id, anio } = req.body;
        if (!jugador_id || !anio) return res.status(400).json({ error: 'jugador_id y anio requeridos' });
        const j = jugadores.find(x => x.id === Number(jugador_id));
        if (!j) return res.status(404).json({ error: 'Jugador no existe' });
        const objetivo = Number(j.mensualidad_objetivo) || 50000;
        const desc = Number(j.descuento_beca) || 0;
        const objetivoReal = Math.round(objetivo * (1 - desc / 100));
        const creados = [];
        for (let m = 1; m <= 12; m++) {
          const existente = periodos.find(p => p.jugador_id === Number(jugador_id) && p.anio === Number(anio) && p.mes === m);
          if (!existente) {
            const nuevo = {
              id: nextId(periodos),
              jugador_id: Number(jugador_id),
              anio: Number(anio),
              mes: m,
              objetivo: j.tipo_beca === 'Becado 100%' || j.tipo_beca === 'Patrocinado' ? 0 : objetivoReal,
              pagado: 0,
              estado: j.tipo_beca === 'Becado 100%' || j.tipo_beca === 'Patrocinado' ? 'beca' : 'pendiente',
              notas: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            periodos.push(nuevo);
            creados.push(nuevo);
          }
        }
        save('periodos', periodos);
        return res.status(201).json({ ok: true, creados: creados.length });
      }

      if (accion === 'upsert') {
        const { jugador_id, anio, mes, objetivo, estado, notas } = req.body;
        if (!jugador_id || !anio || !mes) return res.status(400).json({ error: 'jugador_id, anio y mes requeridos' });
        const idx = periodos.findIndex(p => p.jugador_id === Number(jugador_id) && p.anio === Number(anio) && p.mes === Number(mes));
        if (idx !== -1) {
          if (estado !== undefined) periodos[idx].estado = estado;
          if (notas !== undefined) periodos[idx].notas = notas;
          periodos[idx].updated_at = new Date().toISOString();
          save('periodos', periodos);
          return res.status(200).json(periodos[idx]);
        }
        const nuevo = {
          id: nextId(periodos),
          jugador_id: Number(jugador_id),
          anio: Number(anio),
          mes: Number(mes),
          objetivo: Number(objetivo) || 0,
          pagado: 0,
          estado: estado || 'pendiente',
          notas: notas || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        periodos.push(nuevo);
        save('periodos', periodos);
        return res.status(201).json(nuevo);
      }

      return res.status(400).json({ error: 'accion requerida: generar | upsert' });
    }

    if (req.method === 'PATCH') {
      const id = Number(req.body.id || req.query.id);
      const idx = periodos.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Periodo no encontrado' });
      const { estado, notas, pagado } = req.body;
      if (estado !== undefined) periodos[idx].estado = estado;
      if (notas !== undefined) periodos[idx].notas = notas;
      if (pagado !== undefined) periodos[idx].pagado = Number(pagado);
      periodos[idx].updated_at = new Date().toISOString();
      save('periodos', periodos);
      return res.status(200).json(periodos[idx]);
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // MODO NEON
  try {
    if (req.method === 'GET') {
      const { jugador_id, anio, resumen } = req.query;

      if (resumen === 'true') {
        const anioActual = Number(anio) || new Date().getFullYear();
        const { rows } = await query(`
          SELECT j.id as jugador_id, j.nombre || ' ' || COALESCE(j.apellidos,'') as nombre,
                 j.categoria, j.telefono,
                 COALESCE(SUM(pm.pagado),0) as total_pagado,
                 COALESCE(SUM(pm.objetivo),0) as total_objetivo,
                 COALESCE(SUM(pm.objetivo) - SUM(pm.pagado),0) as saldo
          FROM jugadores j
          LEFT JOIN periodos_mensuales pm ON pm.jugador_id = j.id AND pm.anio = $1
          WHERE j.activo = true
          GROUP BY j.id, j.nombre, j.apellidos, j.categoria, j.telefono
          ORDER BY j.nombre
        `, [anioActual]);
        return res.status(200).json(rows);
      }

      let sql = 'SELECT * FROM periodos_mensuales WHERE 1=1';
      const params = [];
      if (jugador_id) { params.push(jugador_id); sql += ` AND jugador_id=$${params.length}`; }
      if (anio) { params.push(anio); sql += ` AND anio=$${params.length}`; }
      sql += ' ORDER BY anio, mes';
      const { rows } = await query(sql, params);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { accion } = req.body;

      if (accion === 'generar') {
        const { jugador_id, anio } = req.body;
        if (!jugador_id || !anio) return res.status(400).json({ error: 'jugador_id y anio requeridos' });
        const jug = await query('SELECT mensualidad_objetivo, descuento_beca, tipo_beca FROM jugadores WHERE id=$1', [jugador_id]);
        if (jug.rows.length === 0) return res.status(404).json({ error: 'Jugador no existe' });
        const j = jug.rows[0];
        const objetivo = Number(j.mensualidad_objetivo) || 50000;
        const desc = Number(j.descuento_beca) || 0;
        const objetivoReal = j.tipo_beca === 'Becado 100%' || j.tipo_beca === 'Patrocinado' ? 0 : Math.round(objetivo * (1 - desc / 100));
        const estadoDefault = j.tipo_beca === 'Becado 100%' || j.tipo_beca === 'Patrocinado' ? 'beca' : 'pendiente';
        let creados = 0;
        for (let m = 1; m <= 12; m++) {
          const res = await query(`
            INSERT INTO periodos_mensuales (jugador_id, anio, mes, objetivo, estado)
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (jugador_id, anio, mes) DO NOTHING
          `, [jugador_id, anio, m, objetivoReal, estadoDefault]);
          creados += res.rowCount || 0;
        }
        return res.status(201).json({ ok: true, creados });
      }

      if (accion === 'upsert') {
        const { jugador_id, anio, mes, objetivo, estado, notas } = req.body;
        if (!jugador_id || !anio || !mes) return res.status(400).json({ error: 'jugador_id, anio y mes requeridos' });
        const { rows } = await query(`
          INSERT INTO periodos_mensuales (jugador_id, anio, mes, objetivo, estado, notas)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (jugador_id, anio, mes) DO UPDATE SET
            estado = COALESCE($5, periodos_mensuales.estado),
            notas = COALESCE($6, periodos_mensuales.notas),
            updated_at = NOW()
          RETURNING *
        `, [jugador_id, anio, mes, objetivo || 0, estado || 'pendiente', notas || null]);
        return res.status(201).json(rows[0]);
      }

      return res.status(400).json({ error: 'accion requerida: generar | upsert' });
    }

    if (req.method === 'PATCH') {
      const id = req.body.id || req.query.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const { estado, notas, pagado } = req.body;
      const sets = [];
      const params = [];
      if (estado !== undefined) { params.push(estado); sets.push(`estado=$${params.length}`); }
      if (notas !== undefined) { params.push(notas); sets.push(`notas=$${params.length}`); }
      if (pagado !== undefined) { params.push(Number(pagado)); sets.push(`pagado=$${params.length}`); }
      if (sets.length === 0) return res.status(400).json({ error: 'Sin cambios' });
      sets.push('updated_at=NOW()');
      params.push(id);
      const { rows } = await query(`UPDATE periodos_mensuales SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`, params);
      if (rows.length === 0) return res.status(404).json({ error: 'Periodo no encontrado' });
      return res.status(200).json(rows[0]);
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    console.error('Periodos API:', e);
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
