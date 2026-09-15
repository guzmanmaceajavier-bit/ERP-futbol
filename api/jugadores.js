import { query, isDemoMode } from './_db.js';
import { authMiddleware } from './_auth.js';
import { load, save, nextId } from './_store.js';

async function handler(req, res) {
  if (isDemoMode()) {
    let jugadores = load('jugadores');
    let periodos = load('periodos');

    if (req.method === 'GET') {
      const { genero, categoria } = req.query;
      let out = jugadores;
      if (genero) out = out.filter(j => j.genero === genero);
      if (categoria) out = out.filter(j => j.categoria === categoria);

      const anioActual = new Date().getFullYear();
      out = out.map(r => {
        const base = Number(r.mensualidad_objetivo) || 50000;
        const desc = Number(r.descuento_beca) || 0;
        const periodosJugador = periodos.filter(p => p.jugador_id === r.id && p.anio === anioActual);
        const totalPagado = periodosJugador.reduce((s, p) => s + Number(p.pagado), 0);
        const totalObjetivo = periodosJugador.reduce((s, p) => s + Number(p.objetivo), 0);
        return {
          ...r,
          objetivo_real: Math.round(base * (1 - desc / 100)),
          saldo_pendiente: totalObjetivo - totalPagado,
          mensualidad: totalPagado,
          proximo_vencimiento: periodosJugador.filter(p => p.estado !== 'completo' && p.estado !== 'beca').sort((a, b) => a.anio - b.anio || a.mes - b.mes)[0] ? `${periodosJugador.filter(p => p.estado !== 'completo' && p.estado !== 'beca').sort((a, b) => a.anio - b.anio || a.mes - b.mes)[0].anio}-${String(periodosJugador.filter(p => p.estado !== 'completo' && p.estado !== 'beca').sort((a, b) => a.anio - b.anio || a.mes - b.mes)[0].mes).padStart(2, '0')}-28` : null
        };
      });
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad, genero, tipo_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco } = req.body;
      if (!nombre || !categoria || !telefono) return res.status(400).json({ error: 'Nombre, categoria y telefono requeridos' });
      let base = categoria.includes('17') || categoria.includes('16') ? 50000 : categoria.includes('14') || categoria.includes('12') ? 40000 : 30000;
      let desc = 0;
      if (tipo_beca === 'Becado 50%') desc = 50;
      else if (tipo_beca === 'Becado 100%' || tipo_beca === 'Patrocinado') desc = 100;
      const j = {
        id: nextId(jugadores), nombre, apellidos: apellidos || '', fecha_nacimiento: fecha_nacimiento || null,
        tipo_identificacion: tipo_identificacion || null, numero_identificacion: numero_identificacion || null,
        categoria, telefono, mensualidad: 0, mensualidad_objetivo: base,
        genero: genero || 'Masculino', tipo_beca: tipo_beca || 'Normal', descuento_beca: desc,
        acudiente_nombre: acudiente_nombre || null, acudiente_telefono: acudiente_telefono || null,
        acudiente_parentesco: acudiente_parentesco || null, whatsapp_opt_out: false,
        activo: true, created_at: new Date().toISOString()
      };
      jugadores.push(j);
      save('jugadores', jugadores);

      if (tipo_beca === 'Becado 100%' || tipo_beca === 'Patrocinado') {
        const anioActual = new Date().getFullYear();
        for (let m = 1; m <= 12; m++) {
          const existente = periodos.find(p => p.jugador_id === j.id && p.anio === anioActual && p.mes === m);
          if (!existente) {
            periodos.push({
              id: nextId(periodos), jugador_id: j.id, anio: anioActual, mes: m,
              objetivo: 0, pagado: 0, estado: 'beca', notas: 'Beca asignada al crear jugador',
              created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            });
          }
        }
        save('periodos', periodos);
      }

      return res.status(201).json(j);
    }

    if (req.method === 'PUT') {
      const id = Number(req.body.id || req.query.id);
      const idx = jugadores.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
      const b = req.body;
      let desc = 0;
      if (b.tipo_beca === 'Becado 50%') desc = 50;
      else if (b.tipo_beca === 'Becado 100%' || b.tipo_beca === 'Patrocinado') desc = 100;
      jugadores[idx] = {
        ...jugadores[idx], nombre: b.nombre || jugadores[idx].nombre, apellidos: b.apellidos || '',
        categoria: b.categoria || jugadores[idx].categoria, telefono: b.telefono || jugadores[idx].telefono,
        genero: b.genero || jugadores[idx].genero, tipo_beca: b.tipo_beca || jugadores[idx].tipo_beca,
        descuento_beca: desc, acudiente_nombre: b.acudiente_nombre || null,
        acudiente_telefono: b.acudiente_telefono || null, activo: b.activo !== false,
        mensualidad_objetivo: b.mensualidad_objetivo || jugadores[idx].mensualidad_objetivo
      };
      save('jugadores', jugadores);

      if (b.tipo_beca === 'Becado 100%' || b.tipo_beca === 'Patrocinado') {
        const anioActual = new Date().getFullYear();
        for (let m = 1; m <= 12; m++) {
          const existente = periodos.find(p => p.jugador_id === id && p.anio === anioActual && p.mes === m);
          if (!existente) {
            periodos.push({
              id: nextId(periodos), jugador_id: id, anio: anioActual, mes: m,
              objetivo: 0, pagado: 0, estado: 'beca', notas: 'Beca asignada',
              created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            });
          }
        }
        save('periodos', periodos);
      }

      return res.status(200).json(jugadores[idx]);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      jugadores = jugadores.filter(x => x.id !== id);
      save('jugadores', jugadores);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // MODO NEON
  try {
    if (req.method === 'GET') {
      const { genero, categoria } = req.query;
      const anioActual = new Date().getFullYear();
      let sql = `
        SELECT j.id, j.nombre, j.apellidos, j.fecha_nacimiento, j.tipo_identificacion,
               j.numero_identificacion, j.categoria, j.telefono, j.mensualidad_objetivo,
               j.activo, j.genero, j.tipo_beca, j.descuento_beca, j.acudiente_nombre,
               j.acudiente_telefono, j.acudiente_parentesco, j.whatsapp_opt_out,
               j.foto_url, j.created_at,
               COALESCE(SUM(pm.pagado), 0) as mensualidad,
               COALESCE(SUM(pm.objetivo) - SUM(pm.pagado), 0) as saldo_pendiente
        FROM jugadores j
        LEFT JOIN periodos_mensuales pm ON pm.jugador_id = j.id AND pm.anio = $1
        WHERE 1=1`;
      const params = [anioActual];
      if (genero) { params.push(genero); sql += ` AND j.genero = $${params.length}`; }
      if (categoria) { params.push(categoria); sql += ` AND j.categoria = $${params.length}`; }
      sql += ' GROUP BY j.id ORDER BY j.created_at DESC';
      const result = await query(sql, params);
      const rows = result.rows.map(r => {
        const base = Number(r.mensualidad_objetivo) || 50000;
        const desc = Number(r.descuento_beca) || 0;
        return { ...r, objetivo_real: Math.round(base * (1 - desc / 100)) };
      });
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad, genero, tipo_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco } = req.body;
      if (!nombre || !categoria || !telefono) return res.status(400).json({ error: 'Nombre, categoria y telefono son obligatorios' });
      const catCheck = await query('SELECT mensualidad_base FROM categorias WHERE nombre=$1', [categoria]);
      let base = 50000;
      if (catCheck.rows[0]) base = Number(catCheck.rows[0].mensualidad_base);
      else base = categoria.includes('17') || categoria.includes('16') ? 50000 : categoria.includes('14') || categoria.includes('12') ? 40000 : 30000;
      let descuento = 0;
      if (tipo_beca === 'Becado 50%') descuento = 50;
      else if (tipo_beca === 'Becado 100%' || tipo_beca === 'Patrocinado') descuento = 100;
      const result = await query(
        `INSERT INTO jugadores (nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad_objetivo, activo, genero, tipo_beca, descuento_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [nombre, apellidos || '', fecha_nacimiento || null, tipo_identificacion || null, numero_identificacion || null, categoria, telefono, base, genero || 'Masculino', tipo_beca || 'Normal', descuento, acudiente_nombre || null, acudiente_telefono || null, acudiente_parentesco || null]
      );

      if (tipo_beca === 'Becado 100%' || tipo_beca === 'Patrocinado') {
        const jId = result.rows[0].id;
        const anioActual = new Date().getFullYear();
        for (let m = 1; m <= 12; m++) {
          await query(
            `INSERT INTO periodos_mensuales (jugador_id, anio, mes, objetivo, pagado, estado, notas)
             VALUES ($1,$2,$3,0,0,'beca','Beca asignada al crear jugador')
             ON CONFLICT (jugador_id, anio, mes) DO NOTHING`,
            [jId, anioActual, m]
          );
        }
      }

      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const id = req.body.id || req.query.id;
      const { nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad, activo, genero, tipo_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco, whatsapp_opt_out } = req.body;
      if (!id || !nombre || !categoria || !telefono) return res.status(400).json({ error: 'Datos incompletos' });
      let descuento = 0;
      if (tipo_beca === 'Becado 50%') descuento = 50;
      else if (tipo_beca === 'Becado 100%' || tipo_beca === 'Patrocinado') descuento = 100;
      const catCheck = await query('SELECT mensualidad_base FROM categorias WHERE nombre=$1', [categoria]);
      let base = Number(catCheck.rows[0]?.mensualidad_base) || 50000;
      const result = await query(
        `UPDATE jugadores SET nombre=$1, apellidos=$2, fecha_nacimiento=$3, tipo_identificacion=$4,
         numero_identificacion=$5, categoria=$6, telefono=$7, activo=$8, genero=$9, tipo_beca=$10,
         descuento_beca=$11, acudiente_nombre=$12, acudiente_telefono=$13, acudiente_parentesco=$14,
         whatsapp_opt_out=$15, mensualidad_objetivo=$16 WHERE id=$17 RETURNING *`,
        [nombre, apellidos || '', fecha_nacimiento || null, tipo_identificacion || null, numero_identificacion || null, categoria, telefono, activo !== false, genero || 'Masculino', tipo_beca || 'Normal', descuento, acudiente_nombre || null, acudiente_telefono || null, acudiente_parentesco || null, !!whatsapp_opt_out, base, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });

      if (tipo_beca === 'Becado 100%' || tipo_beca === 'Patrocinado') {
        const anioActual = new Date().getFullYear();
        for (let m = 1; m <= 12; m++) {
          await query(
            `INSERT INTO periodos_mensuales (jugador_id, anio, mes, objetivo, pagado, estado, notas)
             VALUES ($1,$2,$3,0,0,'beca','Beca asignada')
             ON CONFLICT (jugador_id, anio, mes) DO NOTHING`,
            [id, anioActual, m]
          );
        }
      }

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      await query('DELETE FROM jugadores WHERE id=$1', [id]);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
