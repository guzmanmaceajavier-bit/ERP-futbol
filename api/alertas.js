import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if (isDemoMode()) {
    const jugadores = load('jugadores');
    const pagos = load('pagos');
    const descartadas = load('alertas_descartadas', []);
    const manuales = load('alertas_manuales', []);

    // GET - Calcular alertas automaticas + manuales
    if (req.method === 'GET') {
      const hoy = new Date();
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      // Alertas automaticas (deudas计算)
      const autoRows = jugadores.filter(j => j.activo !== false).map(j => {
        const ultimo = pagos.filter(p => p.jugador_id === j.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        const base = Number(j.mensualidad_objetivo) || 50000;
        const desc = Number(j.descuento_beca) || 0;
        const meta = Math.round(base * (1 - desc / 100));
        const pagado = Number(j.mensualidad) || 0;
        const esVencido = ultimo && new Date(ultimo.fecha) < primerDia;
        let tipo = 'DEUDA';
        let deuda = meta - pagado;
        if (esVencido && pagado >= meta) { tipo = 'VENCIMIENTO'; deuda = meta; }
        return {
          id: j.id, nombre: j.nombre + ' ' + (j.apellidos || ''), categoria: j.categoria,
          telefono: j.acudiente_telefono || j.telefono, mensualidad: pagado, mensualidad_objetivo: meta,
          mes_abono: ultimo?.mes_pago || '', fecha_ultimo_pago: ultimo?.fecha || null,
          _tipo: tipo, _deuda: deuda, tipo: 'automatica', jugador_id: j.id
        };
      }).filter(x => x._deuda > 0 || x._tipo === 'VENCIMIENTO')
        .map(j => ({
          id: 'auto-' + j.id, jugador_id: j.jugador_id, nombre: j.nombre, categoria: j.categoria,
          telefono: j.telefono, pagado: j.mensualidad, deuda: Math.max(0, j._deuda),
          mes_abono: j.mes_abono, tipo_alerta: j._tipo, mensualidad_objetivo: j.mensualidad_objetivo,
          tipo: 'automatica', descartada: descartadas.includes('auto-' + j.id)
        }));

      // Alertas manuales
      const manualRows = manuales.map(m => ({
        ...m, tipo: 'manual', descartada: descartadas.includes('manual-' + m.id)
      }));

      const todas = [...autoRows, ...manualRows].filter(a => !a.descartada);
      return res.status(200).json(todas);
    }

    // POST - Crear alerta manual
    if (req.method === 'POST') {
      const { accion } = req.body;

      // Crear alerta manual
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

      // Descartar alerta
      if (accion === 'descartar') {
        const { alerta_id } = req.body;
        if (!alerta_id) return res.status(400).json({ error: 'alerta_id requerido' });
        if (!descartadas.includes(alerta_id)) descartadas.push(alerta_id);
        save('alertas_descartadas', descartadas);
        return res.status(200).json({ ok: true });
      }

      // Restaurar alerta descartada
      if (accion === 'restaurar') {
        const { alerta_id } = req.body;
        const idx = descartadas.indexOf(alerta_id);
        if (idx > -1) descartadas.splice(idx, 1);
        save('alertas_descartadas', descartadas);
        return res.status(200).json({ ok: true });
      }

      // WhatsApp masivo
      if (accion === 'whatsapp_masivo') {
        const { alertas_ids, mensaje } = req.body;
        let encolados = 0;
        let cola = load('whatsapp_cola');
        let hist = load('whatsapp_historial');
        for (const aid of (alertas_ids || [])) {
          let telefono, nombre, jugador_id;
          if (String(aid).startsWith('auto-')) {
            const jid = Number(String(aid).replace('auto-', ''));
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
          const msg = mensaje || `Hola ${nombre}, le escribimos de EFUSA sobre su saldo pendiente.`;
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

    // DELETE - Eliminar alerta manual
    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      const idx = manuales.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
      manuales.splice(idx, 1);
      save('alertas_manuales', manuales);
      return res.status(200).json({ mensaje: 'Eliminada' });
    }

    // PUT - Editar alerta manual
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
        SELECT j.id, j.nombre, j.categoria, j.telefono, j.mensualidad, j.mensualidad_objetivo,
               p.mes_pago AS mes_abono, p.fecha AS fecha_ultimo_pago
        FROM jugadores j
        LEFT JOIN (
          SELECT DISTINCT ON (jugador_id) jugador_id, mes_pago, fecha
          FROM pagos ORDER BY jugador_id, fecha DESC
        ) p ON j.id = p.jugador_id
        WHERE j.activo = true
          AND (j.mensualidad < j.mensualidad_objetivo OR p.fecha < date_trunc('month', CURRENT_DATE))
        ORDER BY CASE WHEN p.fecha < date_trunc('month', CURRENT_DATE) THEN 0 ELSE 1 END, p.fecha ASC
      `);
      const hoy = new Date();
      const primerDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const deudores = deudoresData.map(j => {
        const meta = Number(j.mensualidad_objetivo) || 50000;
        const esPagoVencido = j.fecha_ultimo_pago && new Date(j.fecha_ultimo_pago) < primerDiaMesActual;
        let tipoAlerta = 'DEUDA';
        let deudaCalculada = meta - Number(j.mensualidad);
        if (esPagoVencido && Number(j.mensualidad) >= meta) {
          tipoAlerta = 'VENCIMIENTO';
          deudaCalculada = meta;
        }
        return {
          id: j.id, jugador_id: j.id, nombre: j.nombre, categoria: j.categoria, telefono: j.telefono,
          pagado: Number(j.mensualidad), deuda: Math.max(0, deudaCalculada),
          mes_abono: j.mes_abono, tipo_alerta: tipoAlerta, mensualidad_objetivo: meta, tipo: 'automatica'
        };
      });
      return res.status(200).json(deudores);
    }

    if (req.method === 'POST') {
      const { accion } = req.body;
      if (accion === 'whatsapp_masivo') {
        const { alertas_ids, mensaje } = req.body;
        return res.status(200).json({ ok: true, encolados: alertas_ids?.length || 0, delay_segundos: 15 });
      }
      return res.status(400).json({ error: 'accion requerida' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (error) {
    console.error('Error API Alertas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export default authMiddleware(handler);
