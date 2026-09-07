import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

function renderPlantilla(texto, vars) {
  let out = texto;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, v ?? '');
  }
  return out;
}

async function handler(req, res) {
  if(isDemoMode()){
    let hist=load('whatsapp_historial');
    let cola=load('whatsapp_cola');
    let jugadores=load('jugadores');
    if(req.method==='GET'){
      const {tipo, jugador_id}=req.query;
      if(tipo==='plantillas') return res.status(200).json([{codigo:'recordatorio_3dias',nombre:'Recordatorio 3 dias',mensaje:'Hola {nombre_acudiente}, la mensualidad de {nombre_jugador} vence {vencimiento} Valor ${saldo} EFUSA',aprobada_meta:true},{codigo:'mora_dia6',nombre:'Mora dia 6',mensaje:'Hola {nombre_acudiente}, {nombre_jugador} debe ${saldo} EFUSA',aprobada_meta:true},{codigo:'confirmacion_pago',nombre:'Confirmacion',mensaje:'Gracias {nombre_acudiente}, recibimos ${monto} de {nombre_jugador}. Proximo {vencimiento} EFUSA',aprobada_meta:true},{codigo:'abono_incompleto',nombre:'Abono',mensaje:'Abono ${monto}, falta ${saldo} EFUSA',aprobada_meta:true},{codigo:'convocatoria',nombre:'Convocatoria',mensaje:'Convocado {nombre_jugador} el {fecha_partido} EFUSA',aprobada_meta:true}]);
      if(tipo==='historial'){ let out=hist; if(jugador_id) out=out.filter(h=> String(h.jugador_id)===String(jugador_id)); out=out.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).slice(0,100); return res.status(200).json(out); }
      if(tipo==='cola') return res.status(200).json(cola);
      return res.status(400).json({error:'tipo requerido'});
    }
    if(req.method==='POST'){
      const {accion, plantilla_codigo, jugador_id, jugador_ids, mensaje_custom}=req.body;
      if(accion==='individual'){
        const j=jugadores.find(x=>x.id===Number(jugador_id)); if(!j) return res.status(404).json({error:'Jugador no encontrado'});
        const tel=j.acudiente_telefono||j.telefono;
        const msg=mensaje_custom||('Plantilla '+plantilla_codigo+' para '+j.nombre);
        hist.push({id:nextId(hist), jugador_id:j.id, telefono:tel, plantilla_codigo:plantilla_codigo||null, mensaje:msg, tipo:'individual', estado:'enviado', created_at:new Date().toISOString()}); save('whatsapp_historial', hist);
        const waUrl='https://wa.me/57'+tel.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(msg);
        return res.status(200).json({ok:true, mensaje:msg, waUrl, modo:'local'});
      }
      if(accion==='masivo'){
        const ids=jugador_ids||[]; let encolados=0; ids.forEach(jid=>{ const j=jugadores.find(x=>x.id===Number(jid)); if(!j||j.whatsapp_opt_out) return; const tel=j.acudiente_telefono||j.telefono; const msg=mensaje_custom||('Masivo '+plantilla_codigo); cola.push({id:nextId(cola), jugador_id:j.id, telefono:tel, mensaje:msg, estado:'pendiente', programado_para:new Date().toISOString()}); hist.push({id:nextId(hist), jugador_id:j.id, telefono:tel, plantilla_codigo:plantilla_codigo||null, mensaje:msg, tipo:'masivo', estado:'en_cola', created_at:new Date().toISOString()}); encolados++; }); save('whatsapp_cola', cola); save('whatsapp_historial', hist); return res.status(200).json({ok:true, encolados, delay_segundos:15});
      }
      if(accion==='opt_out'){ const j=jugadores.find(x=>x.id===Number(req.body.jugador_id)); if(j){ j.whatsapp_opt_out=!!req.body.opt_out; save('jugadores', jugadores); } return res.status(200).json({ok:true}); }
      return res.status(400).json({error:'accion invalida'});
    }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  try {
    if (req.method === 'GET') {
      const { tipo, jugador_id } = req.query;
      if (tipo === 'plantillas') {
        const { rows } = await query('SELECT * FROM whatsapp_plantillas WHERE activa=true ORDER BY nombre');
        return res.status(200).json(rows);
      }
      if (tipo === 'historial') {
        let sql = 'SELECT w.*, j.nombre as jugador_nombre FROM whatsapp_historial w LEFT JOIN jugadores j ON j.id=w.jugador_id WHERE 1=1';
        const params = [];
        if (jugador_id) { params.push(jugador_id); sql += ` AND w.jugador_id=$${params.length}`; }
        sql += ' ORDER BY w.created_at DESC LIMIT 100';
        const { rows } = await query(sql, params);
        return res.status(200).json(rows);
      }
      if (tipo === 'cola') {
        const { rows } = await query('SELECT * FROM whatsapp_cola ORDER BY programado_para ASC LIMIT 50');
        return res.status(200).json(rows);
      }
      return res.status(400).json({ error: 'tipo requerido: plantillas|historial|cola' });
    }

    if (req.method === 'POST') {
      const { accion, plantilla_codigo, jugador_id, jugador_ids, mensaje_custom, variables } = req.body;

      // Mensaje individual
      if (accion === 'individual') {
        if (!jugador_id) return res.status(400).json({ error: 'jugador_id requerido' });
        const { rows: jug } = await query('SELECT * FROM jugadores WHERE id=$1', [jugador_id]);
        if (!jug.rows[0]) return res.status(404).json({ error: 'Jugador no encontrado' });
        const j = jug.rows[0];
        if (j.whatsapp_opt_out) return res.status(400).json({ error: 'Jugador hizo OPT OUT (STOP)' });

        let mensaje = mensaje_custom || '';
        if (plantilla_codigo) {
          const { rows: pl } = await query('SELECT * FROM whatsapp_plantillas WHERE codigo=$1', [plantilla_codigo]);
          if (!pl[0]) return res.status(404).json({ error: 'Plantilla no existe' });
          const vars = {
            nombre_acudiente: j.acudiente_nombre || j.nombre,
            nombre_jugador: j.nombre + ' ' + (j.apellidos||''),
            categoria: j.categoria,
            saldo: j.saldo_pendiente || (j.mensualidad_objetivo - j.mensualidad),
            vencimiento: j.proximo_vencimiento || 'próximo mes',
            mes: new Date().toLocaleDateString('es-ES',{month:'long'}),
            monto: variables?.monto || '',
            recibo: variables?.recibo || '',
            ...variables
          };
          mensaje = renderPlantilla(pl[0].mensaje, vars);
        }
        const telefono = j.acudiente_telefono || j.telefono;
        await query(`INSERT INTO whatsapp_historial (jugador_id, telefono, plantilla_codigo, mensaje, tipo, estado, enviado_por) VALUES ($1,$2,$3,$4,'individual','enviado',$5)`, [j.id, telefono, plantilla_codigo || null, mensaje, req.usuario.id]);
        // Simular envío: en producción aquí iría Twilio/Baileys
        const waUrl = `https://wa.me/57${telefono.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(mensaje)}`;
        return res.status(200).json({ ok:true, mensaje, waUrl, modo:'simulado - abre wa.me' });
      }

      // Mensaje masivo con cola 15s
      if (accion === 'masivo') {
        if (!jugador_ids || !Array.isArray(jugador_ids) || jugador_ids.length===0) return res.status(400).json({ error: 'jugador_ids requerido' });
        if (jugador_ids.length > 100) return res.status(400).json({ error: 'Máximo 100 por lote (anti-baneo)' });
        const { rows: delayRow } = await query("SELECT valor FROM configuracion WHERE clave='whatsapp_delay_segundos'");
        const delay = Number(delayRow[0]?.valor || 15);

        // Obtener plantilla
        let plantillaTexto = mensaje_custom || '';
        if (plantilla_codigo) {
          const { rows: pl } = await query('SELECT * FROM whatsapp_plantillas WHERE codigo=$1', [plantilla_codigo]);
          if (!pl[0]) return res.status(404).json({ error: 'Plantilla no existe' });
          if (!pl[0].aprobada_meta) return res.status(400).json({ error: 'Plantilla no aprobada por Meta' });
          plantillaTexto = pl[0].mensaje;
        }

        let programado = new Date();
        let encolados = 0;
        for (const jid of jugador_ids) {
          const { rows: jug } = await query('SELECT * FROM jugadores WHERE id=$1', [jid]);
          if (!jug[0] || jug[0].whatsapp_opt_out) continue;
          const j = jug[0];
          const vars = {
            nombre_acudiente: j.acudiente_nombre || j.nombre,
            nombre_jugador: j.nombre + ' ' + (j.apellidos||''),
            categoria: j.categoria,
            saldo: j.saldo_pendiente || 0,
            vencimiento: j.proximo_vencimiento || '',
            ...variables
          };
          const msg = renderPlantilla(plantillaTexto, vars);
          const telefono = j.acudiente_telefono || j.telefono;
          await query(`INSERT INTO whatsapp_cola (jugador_id, telefono, mensaje, programado_para) VALUES ($1,$2,$3,$4)`, [j.id, telefono, msg, programado.toISOString()]);
          await query(`INSERT INTO whatsapp_historial (jugador_id, telefono, plantilla_codigo, mensaje, tipo, estado) VALUES ($1,$2,$3,$4,'masivo','en_cola')`, [j.id, telefono, plantilla_codigo || null, msg]);
          programado = new Date(programado.getTime() + delay*1000);
          encolados++;
        }
        return res.status(200).json({ ok:true, encolados, delay_segundos: delay, mensaje: `Encolados ${encolados} mensajes, 1 cada ${delay}s` });
      }

      if (accion === 'opt_out') {
        const { jugador_id: jid, opt_out } = req.body;
        await query('UPDATE jugadores SET whatsapp_opt_out=$1 WHERE id=$2', [!!opt_out, jid]);
        return res.status(200).json({ ok:true });
      }

      return res.status(400).json({ error: 'accion: individual | masivo | opt_out' });
    }

    // Procesar cola (cron simulado)
    if (req.method === 'PATCH') {
      const { rows } = await query(`SELECT * FROM whatsapp_cola WHERE estado='pendiente' AND programado_para <= NOW() ORDER BY programado_para LIMIT 1`);
      if (rows.length===0) return res.status(200).json({ nada:true });
      const item = rows[0];
      await query(`UPDATE whatsapp_cola SET estado='enviado' WHERE id=$1`, [item.id]);
      await query(`UPDATE whatsapp_historial SET estado='enviado' WHERE jugador_id=$1 AND mensaje=$2 AND estado='en_cola'`, [item.jugador_id, item.mensaje]);
      return res.status(200).json({ enviado: item });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('WhatsApp API:', e);
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
