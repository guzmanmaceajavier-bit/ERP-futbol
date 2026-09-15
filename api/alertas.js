import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if (isDemoMode()) {
    const jugadores = load('jugadores');
    const periodos = load('periodos');
    const descartadas = load('alertas_descartadas', []);
    const manuales = load('alertas_manuales', []);

    if (req.method === 'GET') {
      const hoy = new Date();
      const anioActual = hoy.getFullYear();
      const mesActual = hoy.getMonth() + 1;

      const autoRows = [];
      for (const j of jugadores.filter(j => j.activo !== false)) {
        const periodosJugador = periodos.filter(p => p.jugador_id === j.id && p.anio === anioActual);
        for (const pm of periodosJugador) {
          if (pm.estado === 'beca') continue;
          if (pm.mes > mesActual) continue;

          if (pm.estado === 'pendiente') {
            autoRows.push({
              id: 'auto-' + j.id + '-' + pm.anio + '-' + pm.mes,
              jugador_id: j.id, nombre: j.nombre + ' ' + (j.apellidos || ''),
              categoria: j.categoria, telefono: j.acudiente_telefono || j.telefono,
              pagado: Number(pm.pagado), deuda: Number(pm.objetivo),
              mensualidad_objetivo: Number(pm.objetivo),
              mes_abono: '', tipo_alerta: 'DEUDA', tipo: 'automatica',
              periodo: `${pm.anio}-${String(pm.mes).padStart(2, '0')}`
            });
          } else if (pm.estado === 'abono') {
            autoRows.push({
              id: 'auto-' + j.id + '-' + pm.anio + '-' + pm.mes,
              jugador_id: j.id, nombre: j.nombre + ' ' + (j.apellidos || ''),
              categoria: j.categoria, telefono: j.acudiente_telefono || j.telefono,
              pagado: Number(pm.pagado), deuda: Number(pm.objetivo) - Number(pm.pagado),
              mensualidad_objetivo: Number(pm.objetivo),
              mes_abono: '', tipo_alerta: 'ABONO', tipo: 'automatica',
              periodo: `${pm.anio}-${String(pm.mes).padStart(2, '0')}`
            });
          } else if (pm.estado === 'pendiente' && pm.mes < mesActual) {
            autoRows.push({
              id: 'auto-' + j.id + '-' + pm.anio + '-' + pm.mes,
              jugador_id: j.id, nombre: j.nombre + ' ' + (j.apellidos || ''),
              categoria: j.categoria, telefono: j.acudiente_telefono || j.telefono,
              pagado: 0, deuda: Number(pm.objetivo),
              mensualidad_objetivo: Number(pm.objetivo),
              mes_abono: '', tipo_alerta: 'VENCIMIENTO', tipo: 'automatica',
              periodo: `${pm.anio}-${String(pm.mes).padStart(2, '0')}`
            });
          }
        }
      }

      const manualRows = manuales.map(m => ({
        ...m, tipo: 'manual', descartada: descartadas.includes('manual-' + m.id)
      }));

      const todas = [...autoRows, ...manualRows].filter(a => !a.descartada);
      return res.status(200).json(todas);
    }

    if (req.method === 'POST') {
      const { accion } = req.body;

      if (accion === 'crear') {
        const { jugador_id, titulo, mensaje, fecha_vencimiento } = req.body;
        if (!titulo) return res.status(400).json({ error: 'Titulo requerido' });
        const j = jugadores.find(x => x.id === Number(jugador_id)) || {};
        const alerta = {
          id: nextId(manuales), jugador_id: Number(jugador_id) || null,
          nombre: j.nombre ? j.nombre + ' ' + (j.apellidos || '') : 'General',
          categoria: j.categoria || '', telefono: j.acudiente_telefono || j.telefono || '',
          titulo, mensaje: mensaje || '', fecha_vencimiento: fecha_vencimiento || null,
          tipo_alerta: 'MANUAL', created_at: new Date().toISOString()
        };
        manuales.push(alerta);
        save('alertas_manuales', manuales);
        return res.status(201).json(alerta);
      }

      if (accion === 'descartar') {
        const { alerta_id } = req.body;
        if (!alerta_id) return res.status(400).json({ error: 'alerta_id requerido' });
        if (!descartadas.includes(alerta_id)) descartadas.push(alerta_id);
        save('alertas_descartadas', descartadas);
        return res.status(200).json({ ok: true });
      }

      if (accion === 'restaurar') {
        const { alerta_id } = req.body;
        const idx = descartadas.indexOf(alerta_id);
        if (idx > -1) descartadas.splice(idx, 1);
        save('alertas_descartadas', descartadas);
        return res.status(200).json({ ok: true });
      }

      if (accion === 'whatsapp_masivo') {
        const { alertas_ids, mensaje } = req.body;
        let encolados = 0;
        let cola = load('whatsapp_cola');
        let hist = load('whatsapp_historial');
        for (const aid of (alertas_ids || [])) {
          let telefono, nombre, jugador_id;
          if (String(aid).startsWith('auto-')) {
            const parts = String(aid).replace('auto-', '').split('-');
            const jid = Number(parts[0]);
            const j = jugadores.find(x => x.id === jid);
            if (!j) continue;
            telefono = j.acudiente_telefono || j.telefono;
            nombre = j.nombre + ' ' + (j.apellidos || '');
            jugador_id = j.id;
          } else {
            const m = manuales.find(x => String(x.id) === String(aid));
            if (!m) continue;
            telefono = m.telefono;
            nombre = m.nombre;
            jugador_id = m.jugador_id;
          }
          if (!telefono) continue;
          const msg = mensaje || `Hola ${nombre}, le escribimos de la escuela sobre su saldo pendiente.`;
          cola.push({ id: nextId(cola), jugador_id, telefono, mensaje: msg, estado: 'pendiente', programado_para: new Date().toISOString() });
          hist.push({ id: nextId(hist), jugador_id, telefono, mensaje: msg, tipo: 'masivo', estado: 'en_cola', created_at: new Date().toISOString() });
          encolados++;
        }
        save('whatsapp_cola', cola);
        save('whatsapp_historial', hist);
        return res.status(200).json({ ok: true, encolados, delay_segundos: 15 });
      }

      return res.status(400).json({ error: 'accion requerida' });
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      const idx = manuales.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
      manuales.splice(idx, 1);
      save('alertas_manuales', manuales);
      return res.status(200).json({ mensaje: 'Eliminada' });
    }

    if (req.method === 'PUT') {
      const id = Number(req.body.id);
      const idx = manuales.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
      const { titulo, mensaje, jugador_id, fecha_vencimiento } = req.body;
      if (titulo !== undefined) manuales[idx].titulo = titulo;
      if (mensaje !== undefined) manuales[idx].mensaje = mensaje;
      if (fecha_vencimiento !== undefined) manuales[idx].fecha_vencimiento = fecha_vencimiento;
      if (jugador_id !== undefined) {
        manuales[idx].jugador_id = Number(jugador_id) || null;
        const j = jugadores.find(x => x.id === Number(jugador_id)) || {};
        manuales[idx].nombre = j.nombre ? j.nombre + ' ' + (j.apellidos || '') : 'General';
        manuales[idx].categoria = j.categoria || '';
        manuales[idx].telefono = j.acudiente_telefono || j.telefono || '';
      }
      manuales[idx].updated_at = new Date().toISOString();
      save('alertas_manuales', manuales);
      return res.status(200).json(manuales[idx]);
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // MODO NEON
  try {
    if (req.method === 'GET') {
      const { rows: deudoresData } = await query(`
        SELECT j.id, j.nombre, j.categoria, j.telefono,
               pm.anio, pm.mes, pm.objetivo, pm.pagado, pm.estado
        FROM periodos_mensuales pm
        JOIN jugadores j ON j.id = pm.jugador_id
        WHERE j.activo = true
          AND pm.estado IN ('pendiente', 'abono')
          AND (pm.anio < EXTRACT(YEAR FROM CURRENT_DATE)
               OR (pm.anio = EXTRACT(YEAR FROM CURRENT_DATE) AND pm.mes <= EXTRACT(MONTH FROM CURRENT_DATE)))
        ORDER BY pm.anio, pm.mes
      `);
      const deudores = deudoresData.map(r => ({
        id: r.id + '-' + r.anio + '-' + r.mes,
        jugador_id: r.id, nombre: r.nombre, categoria: r.categoria, telefono: r.telefono,
        pagado: Number(r.pagado), deuda: Number(r.objetivo) - Number(r.pagado),
        mensualidad_objetivo: Number(r.objetivo),
        tipo_alerta: r.estado === 'pendiente' && r.mes < new Date().getMonth() + 1 ? 'VENCIMIENTO' : r.estado === 'abono' ? 'ABONO' : 'DEUDA',
        tipo: 'automatica',
        periodo: `${r.anio}-${String(r.mes).padStart(2, '0')}`
      }));
      return res.status(200).json(deudores);
    }

    if (req.method === 'POST') {
      const { accion } = req.body;
      if (accion === 'whatsapp_masivo') {
        const { alertas_ids, mensaje } = req.body;
        return res.status(200).json({ ok: true, encolados: alertas_ids?.length || 0, delay_segundos: 15 });
      }
      if (accion === 'crear') {
        const { jugador_id, titulo, mensaje, fecha_vencimiento } = req.body;
        if (!titulo) return res.status(400).json({ error: 'Titulo requerido' });
        const { rows } = await query(
          `INSERT INTO alertas_manuales (jugador_id, titulo, mensaje, fecha_vencimiento) VALUES ($1,$2,$3,$4) RETURNING *`,
          [jugador_id || null, titulo, mensaje || null, fecha_vencimiento || null]
        );
        return res.status(201).json(rows[0]);
      }
      return res.status(400).json({ error: 'accion requerida' });
    }

    if (req.method === 'PUT') {
      const id = req.body.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const { titulo, mensaje, fecha_vencimiento } = req.body;
      const { rows } = await query(
        `UPDATE alertas_manuales SET titulo=$1, mensaje=$2, fecha_vencimiento=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
        [titulo, mensaje, fecha_vencimiento, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'No encontrada' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      await query('DELETE FROM alertas_manuales WHERE id=$1', [id]);
      return res.status(200).json({ mensaje: 'Eliminada' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (error) {
    console.error('Error API Alertas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export default authMiddleware(handler);
