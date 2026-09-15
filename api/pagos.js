import { query, isDemoMode } from './_db.js';
import { authMiddleware } from './_auth.js';
import { load, save, nextId } from './_store.js';

function calcularEstado(pagado, objetivo) {
  if (pagado <= 0) return 'pendiente';
  if (pagado >= objetivo) return 'completo';
  return 'abono';
}

async function handler(req, res) {
  if (isDemoMode()) {
    let pagos = load('pagos');
    let jugadores = load('jugadores');
    let periodos = load('periodos');
    let pagoPeriodos = load('pago_periodos');
    let saldosFavor = load('saldos_favor');

    if (req.method === 'GET') {
      const jid = req.query.jugador_id;
      let out = pagos.map(p => {
        const j = jugadores.find(x => x.id === Number(p.jugador_id));
        return { ...p, jugador: j ? j.nombre + ' ' + (j.apellidos || '') : 'N/A', jugador_telefono: j?.telefono, jugador_categoria: j?.categoria };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      if (jid) out = out.filter(x => String(x.jugador_id) === String(jid));
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { jugador_id, monto, fecha, tipo, observacion, mes_pago, cantidad_meses, meses_cubiertos } = req.body;
      if (!jugador_id || !monto || !fecha) return res.status(400).json({ error: 'Jugador, monto y fecha requeridos' });

      const jIdx = jugadores.findIndex(x => x.id === Number(jugador_id));
      if (jIdx === -1) return res.status(404).json({ error: 'Jugador no existe' });
      const j = jugadores[jIdx];

      const base = Number(j.mensualidad_objetivo) || 50000;
      const desc = Number(j.descuento_beca) || 0;
      const objetivoMes = j.tipo_beca === 'Becado 100%' || j.tipo_beca === 'Patrocinado' ? 0 : Math.round(base * (1 - desc / 100));

      const mesesAcubir = (Array.isArray(meses_cubiertos) && meses_cubiertos.length > 0)
        ? meses_cubiertos.map(m => ({ anio: Number(m.anio), mes: Number(m.mes) }))
        : [];
      if (tipo === 'adelantado' && mesesAcubir.length === 0) return res.status(400).json({ error: 'Adelantado requiere meses_cubiertos' });
      if (mesesAcubir.length === 0 && fecha) {
        const f = new Date(fecha);
        if (!isNaN(f.getTime())) mesesAcubir.push({ anio: f.getFullYear(), mes: f.getMonth() + 1 });
      }

      const recibo = 'REC-' + Date.now().toString().slice(-6);
      let montoRestante = Number(monto);
      const asignaciones = [];

      for (const periodo of mesesAcubir) {
        if (montoRestante <= 0) break;

        let periodIdx = periodos.findIndex(p => p.jugador_id === Number(jugador_id) && p.anio === periodo.anio && p.mes === periodo.mes);
        if (periodIdx === -1) {
          const nuevo = {
            id: nextId(periodos), jugador_id: Number(jugador_id), anio: periodo.anio, mes: periodo.mes,
            objetivo: objetivoMes, pagado: 0, estado: 'pendiente', notas: null,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          };
          periodos.push(nuevo);
          periodIdx = periodos.length - 1;
        }

        const obj = Number(periodos[periodIdx].objetivo);
        const yaPagado = Number(periodos[periodIdx].pagado);
        const falta = Math.max(0, obj - yaPagado);
        const aAplicar = Math.min(montoRestante, falta);

        if (aAplicar > 0) {
          periodos[periodIdx].pagado = yaPagado + aAplicar;
          periodos[periodIdx].estado = calcularEstado(periodos[periodIdx].pagado, obj);
          periodos[periodIdx].updated_at = new Date().toISOString();
          montoRestante -= aAplicar;
          asignaciones.push({ periodo_id: periodos[periodIdx].id, monto_aplicado: aAplicar });
        }
      }

      let saldoFavorGenerado = 0;
      if (montoRestante > 0) {
        const excedentePermitido = true;
        if (excedentePermitido) {
          saldosFavor.push({
            id: nextId(saldosFavor), jugador_id: Number(jugador_id), monto: montoRestante,
            origen_pago_id: null, usado: false, notas: 'Excedente del pago ' + recibo,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          });
          saldoFavorGenerado = montoRestante;
          montoRestante = 0;
        }
      }

      const primerPeriodo = mesesAcubir[0];
      const venc = new Date(primerPeriodo.anio, primerPeriodo.mes - 1 + 1, 0);
      const vencStr = venc.toISOString().split('T')[0];

      const totalAsignado = Number(monto) - montoRestante;
      const estadoPago = totalAsignado >= objetivoMes * mesesAcubir.length ? 'completo' : totalAsignado > 0 ? 'abono' : 'completo';

      const nuevoPago = {
        id: nextId(pagos), jugador_id: Number(jugador_id), monto: Number(monto), fecha,
        tipo: tipo || 'abono', observacion: observacion || null,
        mes_pago: mes_pago || null, cantidad_meses: Number(cantidad_meses) || 1,
        periodo_inicio: null, periodo_fin: null,
        recibo_numero: recibo, vencimiento: vencStr,
        estado_pago: estadoPago, saldo_pendiente: montoRestante,
        created_at: new Date().toISOString()
      };
      pagos.push(nuevoPago);

      for (const asig of asignaciones) {
        pagoPeriodos.push({
          id: nextId(pagoPeriodos), pago_id: nuevoPago.id,
          periodo_id: asig.periodo_id, monto_aplicado: asig.monto_aplicado,
          created_at: new Date().toISOString()
        });
      }

      save('pagos', pagos);
      save('periodos', periodos);
      save('pago_periodos', pagoPeriodos);
      save('saldos_favor', saldosFavor);

      const tel = j.acudiente_telefono || j.telefono;
      if (tel && !j.whatsapp_opt_out) {
        let hist = load('whatsapp_historial');
        const msg = estadoPago === 'abono'
          ? `Hola ${j.acudiente_nombre || j.nombre}, ${j.nombre} abono $${Number(monto).toLocaleString()}, le faltan $${(obj - totalAsignado).toLocaleString()}. Vence ${vencStr}.`
          : `Gracias ${j.acudiente_nombre || j.nombre}, recibimos $${Number(monto).toLocaleString()} de ${j.nombre}. Recibo ${recibo}.`;
        hist.push({ id: nextId(hist), jugador_id: j.id, telefono: tel, plantilla_codigo: estadoPago === 'abono' ? 'abono_incompleto' : 'confirmacion_pago', mensaje: msg, tipo: 'automatico', estado: 'enviado', created_at: new Date().toISOString() });
        save('whatsapp_historial', hist);
      }

      return res.status(201).json({ ...nuevoPago, asignaciones, saldo_favor: saldoFavorGenerado });
    }

    if (req.method === 'PUT') {
      const id = Number(req.body.id || req.query.id);
      const idx = pagos.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
      const old = pagos[idx];

      const viejoAsignaciones = pagoPeriodos.filter(pp => pp.pago_id === id);
      for (const va of viejoAsignaciones) {
        const pi = periodos.findIndex(p => p.id === va.periodo_id);
        if (pi !== -1) {
          periodos[pi].pagado = Math.max(0, Number(periodos[pi].pagado) - Number(va.monto_aplicado));
          periodos[pi].estado = calcularEstado(periodos[pi].pagado, Number(periodos[pi].objetivo));
          periodos[pi].updated_at = new Date().toISOString();
        }
      }
      pagoPeriodos = pagoPeriodos.filter(pp => pp.pago_id !== id);

      const { jugador_id, monto, fecha, tipo, observacion, mes_pago, meses_cubiertos } = req.body;
      const jIdx = jugadores.findIndex(x => x.id === Number(jugador_id));
      if (jIdx === -1) return res.status(404).json({ error: 'Jugador no existe' });
      const j = jugadores[jIdx];

      const base = Number(j.mensualidad_objetivo) || 50000;
      const desc = Number(j.descuento_beca) || 0;
      const objetivoMes = j.tipo_beca === 'Becado 100%' || j.tipo_beca === 'Patrocinado' ? 0 : Math.round(base * (1 - desc / 100));

      const mesesAcubir = (Array.isArray(meses_cubiertos) && meses_cubiertos.length > 0)
        ? meses_cubiertos.map(m => ({ anio: Number(m.anio), mes: Number(m.mes) }))
        : [];
      if (tipo === 'adelantado' && mesesAcubir.length === 0) return res.status(400).json({ error: 'Adelantado requiere meses_cubiertos' });
      if (mesesAcubir.length === 0 && fecha) {
        const f = new Date(fecha);
        if (!isNaN(f.getTime())) mesesAcubir.push({ anio: f.getFullYear(), mes: f.getMonth() + 1 });
      }

      let montoRestante = Number(monto);
      const nuevasAsignaciones = [];

      for (const periodo of mesesAcubir) {
        if (montoRestante <= 0) break;
        let periodIdx = periodos.findIndex(p => p.jugador_id === Number(jugador_id) && p.anio === periodo.anio && p.mes === periodo.mes);
        if (periodIdx === -1) {
          const nuevo = {
            id: nextId(periodos), jugador_id: Number(jugador_id), anio: periodo.anio, mes: periodo.mes,
            objetivo: objetivoMes, pagado: 0, estado: 'pendiente', notas: null,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          };
          periodos.push(nuevo);
          periodIdx = periodos.length - 1;
        }
        const obj = Number(periodos[periodIdx].objetivo);
        const yaPagado = Number(periodos[periodIdx].pagado);
        const falta = Math.max(0, obj - yaPagado);
        const aAplicar = Math.min(montoRestante, falta);
        if (aAplicar > 0) {
          periodos[periodIdx].pagado = yaPagado + aAplicar;
          periodos[periodIdx].estado = calcularEstado(periodos[periodIdx].pagado, obj);
          periodos[periodIdx].updated_at = new Date().toISOString();
          montoRestante -= aAplicar;
          nuevasAsignaciones.push({ periodo_id: periodos[periodIdx].id, monto_aplicado: aAplicar });
        }
      }

      const primerPeriodo = mesesAcubir[0];
      const venc = new Date(primerPeriodo.anio, primerPeriodo.mes - 1 + 1, 0);
      const totalAsignado = Number(monto) - montoRestante;

      pagos[idx] = { ...pagos[idx], jugador_id: Number(jugador_id), monto: Number(monto), fecha, tipo: tipo || old.tipo, observacion: observacion || old.observacion, mes_pago: mes_pago || old.mes_pago, vencimiento: venc.toISOString().split('T')[0], estado_pago: totalAsignado >= objetivoMes ? 'completo' : 'abono', saldo_pendiente: montoRestante };

      for (const asig of nuevasAsignaciones) {
        pagoPeriodos.push({
          id: nextId(pagoPeriodos), pago_id: id,
          periodo_id: asig.periodo_id, monto_aplicado: asig.monto_aplicado,
          created_at: new Date().toISOString()
        });
      }

      save('pagos', pagos);
      save('periodos', periodos);
      save('pago_periodos', pagoPeriodos);
      return res.status(200).json(pagos[idx]);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.body.id || req.query.id);
      const p = pagos.find(x => x.id === id);
      if (!p) return res.status(404).json({ error: 'No encontrado' });

      const asignaciones = pagoPeriodos.filter(pp => pp.pago_id === id);
      for (const a of asignaciones) {
        const pi = periodos.findIndex(p => p.id === a.periodo_id);
        if (pi !== -1) {
          periodos[pi].pagado = Math.max(0, Number(periodos[pi].pagado) - Number(a.monto_aplicado));
          periodos[pi].estado = calcularEstado(periodos[pi].pagado, Number(periodos[pi].objetivo));
          periodos[pi].updated_at = new Date().toISOString();
        }
      }
      pagoPeriodos = pagoPeriodos.filter(pp => pp.pago_id !== id);
      pagos = pagos.filter(x => x.id !== id);

      save('pagos', pagos);
      save('periodos', periodos);
      save('pago_periodos', pagoPeriodos);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // MODO NEON
  try {
    if (req.method === 'GET') {
      const jid = req.query.jugador_id;
      let sql = `SELECT p.id, p.jugador_id, j.nombre AS jugador, j.apellidos, j.telefono AS jugador_telefono,
                 j.acudiente_telefono, j.categoria AS jugador_categoria, p.monto, p.fecha, p.tipo, p.observacion,
                 p.mes_pago, p.cantidad_meses, p.recibo_numero, p.vencimiento, p.estado_pago, p.created_at
                 FROM pagos p JOIN jugadores j ON j.id=p.jugador_id`;
      const params = [];
      if (jid) { sql += ` WHERE p.jugador_id=$1`; params.push(jid); }
      sql += ' ORDER BY p.created_at DESC';
      const { rows } = await query(sql, params);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { jugador_id, monto, fecha, tipo, observacion, mes_pago, cantidad_meses, meses_cubiertos } = req.body;
      if (!jugador_id || !monto || !fecha) return res.status(400).json({ error: 'Jugador, monto y fecha requeridos' });

      const jug = await query('SELECT mensualidad_objetivo, descuento_beca, tipo_beca, acudiente_telefono, telefono, acudiente_nombre, whatsapp_opt_out FROM jugadores WHERE id=$1', [jugador_id]);
      if (jug.rows.length === 0) return res.status(404).json({ error: 'Jugador no existe' });
      const j = jug.rows[0];

      const base = Number(j.mensualidad_objetivo) || 50000;
      const desc = Number(j.descuento_beca) || 0;
      const objetivoMes = j.tipo_beca === 'Becado 100%' || j.tipo_beca === 'Patrocinado' ? 0 : Math.round(base * (1 - desc / 100));

      const mesesAcubir = (Array.isArray(meses_cubiertos) && meses_cubiertos.length > 0)
        ? meses_cubiertos.map(m => ({ anio: Number(m.anio), mes: Number(m.mes) }))
        : [];
      if (tipo === 'adelantado' && mesesAcubir.length === 0) return res.status(400).json({ error: 'Adelantado requiere meses_cubiertos' });
      if (mesesAcubir.length === 0 && fecha) {
        const f = new Date(fecha);
        if (!isNaN(f.getTime())) mesesAcubir.push({ anio: f.getFullYear(), mes: f.getMonth() + 1 });
      }

      const recibo = 'REC-' + Date.now().toString().slice(-6);
      let montoRestante = Number(monto);
      const asignaciones = [];

      for (const periodo of mesesAcubir) {
        if (montoRestante <= 0) break;

        const upsert = await query(`
          INSERT INTO periodos_mensuales (jugador_id, anio, mes, objetivo, pagado, estado)
          VALUES ($1,$2,$3,$4,0,'pendiente')
          ON CONFLICT (jugador_id, anio, mes) DO UPDATE SET updated_at=NOW()
          RETURNING id, objetivo, pagado
        `, [jugador_id, periodo.anio, periodo.mes, objetivoMes]);

        const periodId = upsert.rows[0].id;
        const obj = Number(upsert.rows[0].objetivo);
        const yaPagado = Number(upsert.rows[0].pagado);
        const falta = Math.max(0, obj - yaPagado);
        const aAplicar = Math.min(montoRestante, falta);

        if (aAplicar > 0) {
          const nuevoEstado = calcularEstado(yaPagado + aAplicar, obj);
          await query('UPDATE periodos_mensuales SET pagado=pagado+$1, estado=$2, updated_at=NOW() WHERE id=$3', [aAplicar, nuevoEstado, periodId]);
          montoRestante -= aAplicar;
          asignaciones.push({ periodo_id: periodId, monto_aplicado: aAplicar });
        }
      }

      if (montoRestante > 0) {
        await query(`INSERT INTO saldos_favor (jugador_id, monto, notas) VALUES ($1,$2,$3)`, [jugador_id, montoRestante, 'Excedente del pago ' + recibo]);
      }

      const primerPeriodo = mesesAcubir[0];
      const venc = new Date(primerPeriodo.anio, primerPeriodo.mes, 0);
      const vencStr = venc.toISOString().split('T')[0];
      const totalAsignado = Number(monto) - montoRestante;

      const { rows } = await query(`
        INSERT INTO pagos (jugador_id, monto, fecha, tipo, observacion, mes_pago, cantidad_meses, recibo_numero, vencimiento, estado_pago, saldo_pendiente)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
      `, [jugador_id, monto, fecha, tipo || 'abono', observacion || null, mes_pago || null, Number(cantidad_meses) || 1, recibo, vencStr, totalAsignado >= objetivoMes ? 'completo' : 'abono', montoRestante]);

      const pagoId = rows[0].id;
      for (const asig of asignaciones) {
        await query('INSERT INTO pago_periodos (pago_id, periodo_id, monto_aplicado) VALUES ($1,$2,$3)', [pagoId, asig.periodo_id, asig.monto_aplicado]);
      }

      const tel = j.acudiente_telefono || j.telefono;
      if (tel && !j.whatsapp_opt_out) {
        const msg = totalAsignado < objetivoMes
          ? `Hola ${j.acudiente_nombre || jugador_id}, abono $${Number(monto).toLocaleString()}, le faltan $${(objetivoMes - totalAsignado).toLocaleString()}. Vence ${vencStr}.`
          : `Gracias ${j.acudiente_nombre || jugador_id}, recibimos $${Number(monto).toLocaleString()}. Recibo ${recibo}.`;
        await query(`INSERT INTO whatsapp_historial (jugador_id, telefono, plantilla_codigo, mensaje, tipo, estado) VALUES ($1,$2,$3,$4,'automatico','enviado')`, [jugador_id, tel, totalAsignado >= objetivoMes ? 'confirmacion_pago' : 'abono_incompleto', msg]);
      }

      return res.status(201).json({ ...rows[0], asignaciones });
    }

    if (req.method === 'PUT') {
      const id = req.body.id || req.query.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const { rows: oldRows } = await query('SELECT * FROM pagos WHERE id=$1', [id]);
      if (oldRows.length === 0) return res.status(404).json({ error: 'No encontrado' });
      const old = oldRows[0];

      const viejas = await query('SELECT * FROM pago_periodos WHERE pago_id=$1', [id]);
      for (const va of viejas.rows) {
        await query('UPDATE periodos_mensuales SET pagado=GREATEST(0,pagado-$1), estado=CASE WHEN GREATEST(0,pagado-$2)>=objetivo THEN \'completo\' WHEN GREATEST(0,pagado-$3)>0 THEN \'abono\' ELSE \'pendiente\' END, updated_at=NOW() WHERE id=$4', [va.monto_aplicado, va.monto_aplicado, va.monto_aplicado, va.periodo_id]);
      }
      await query('DELETE FROM pago_periodos WHERE pago_id=$1', [id]);

      const { jugador_id, monto, fecha, tipo, observacion, mes_pago, meses_cubiertos } = req.body;
      const jug = await query('SELECT mensualidad_objetivo, descuento_beca, tipo_beca FROM jugadores WHERE id=$1', [jugador_id]);
      if (jug.rows.length === 0) return res.status(404).json({ error: 'Jugador no existe' });
      const j = jug.rows[0];
      const base = Number(j.mensualidad_objetivo) || 50000;
      const desc = Number(j.descuento_beca) || 0;
      const objetivoMes = j.tipo_beca === 'Becado 100%' || j.tipo_beca === 'Patrocinado' ? 0 : Math.round(base * (1 - desc / 100));

      const mesesAcubir = (Array.isArray(meses_cubiertos) && meses_cubiertos.length > 0)
        ? meses_cubiertos.map(m => ({ anio: Number(m.anio), mes: Number(m.mes) }))
        : [];
      if (tipo === 'adelantado' && mesesAcubir.length === 0) return res.status(400).json({ error: 'Adelantado requiere meses_cubiertos' });
      if (mesesAcubir.length === 0 && fecha) {
        const f = new Date(fecha);
        if (!isNaN(f.getTime())) mesesAcubir.push({ anio: f.getFullYear(), mes: f.getMonth() + 1 });
      }

      let montoRestante = Number(monto);
      const nuevasAsignaciones = [];

      for (const periodo of mesesAcubir) {
        if (montoRestante <= 0) break;
        const upsert = await query(`INSERT INTO periodos_mensuales (jugador_id, anio, mes, objetivo, pagado, estado) VALUES ($1,$2,$3,$4,0,'pendiente') ON CONFLICT (jugador_id, anio, mes) DO UPDATE SET updated_at=NOW() RETURNING id, objetivo, pagado`, [jugador_id, periodo.anio, periodo.mes, objetivoMes]);
        const periodId = upsert.rows[0].id;
        const obj = Number(upsert.rows[0].objetivo);
        const yaPagado = Number(upsert.rows[0].pagado);
        const falta = Math.max(0, obj - yaPagado);
        const aAplicar = Math.min(montoRestante, falta);
        if (aAplicar > 0) {
          await query('UPDATE periodos_mensuales SET pagado=pagado+$1, estado=CASE WHEN pagado+$2>=objetivo THEN \'completo\' WHEN pagado+$3>0 THEN \'abono\' ELSE \'pendiente\' END, updated_at=NOW() WHERE id=$4', [aAplicar, aAplicar, aAplicar, periodId]);
          montoRestante -= aAplicar;
          nuevasAsignaciones.push({ periodo_id: periodId, monto_aplicado: aAplicar });
        }
      }

      const primerPeriodo = mesesAcubir[0];
      const venc = new Date(primerPeriodo.anio, primerPeriodo.mes, 0);
      const totalAsignado = Number(monto) - montoRestante;

      const { rows } = await query(`UPDATE pagos SET jugador_id=$1, monto=$2, fecha=$3, tipo=$4, observacion=$5, mes_pago=$6, cantidad_meses=$7, vencimiento=$8, estado_pago=$9, saldo_pendiente=$10 WHERE id=$11 RETURNING *`,
        [jugador_id, monto, fecha, tipo, observacion, mes_pago, Number(cantidad_meses) || 1, venc.toISOString().split('T')[0], totalAsignado >= objetivoMes ? 'completo' : 'abono', montoRestante, id]);

      for (const asig of nuevasAsignaciones) {
        await query('INSERT INTO pago_periodos (pago_id, periodo_id, monto_aplicado) VALUES ($1,$2,$3)', [id, asig.periodo_id, asig.monto_aplicado]);
      }

      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      const { rows: pd } = await query('SELECT * FROM pagos WHERE id=$1', [id]);
      if (pd.length === 0) return res.status(404).json({ error: 'No encontrado' });

      const asignaciones = await query('SELECT * FROM pago_periodos WHERE pago_id=$1', [id]);
      for (const a of asignaciones.rows) {
        await query('UPDATE periodos_mensuales SET pagado=GREATEST(0,pagado-$1), estado=CASE WHEN GREATEST(0,pagado-$2)>=objetivo THEN \'completo\' WHEN GREATEST(0,pagado-$3)>0 THEN \'abono\' ELSE \'pendiente\' END, updated_at=NOW() WHERE id=$4', [a.monto_aplicado, a.monto_aplicado, a.monto_aplicado, a.periodo_id]);
      }
      await query('DELETE FROM pago_periodos WHERE pago_id=$1', [id]);
      await query('DELETE FROM pagos WHERE id=$1', [id]);

      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    console.error('Pagos API:', e);
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
