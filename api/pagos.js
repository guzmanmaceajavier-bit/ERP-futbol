import { query, isDemoMode } from './_db.js';
import { authMiddleware } from './_auth.js';
import { load, save, nextId } from './_store.js';

function vencimiento30(fechaStr){
  const d=new Date(fechaStr); d.setDate(d.getDate()+30); return d.toISOString().split('T')[0];
}

async function handler(req, res){
  if(isDemoMode()){
    let pagos=load('pagos');
    let jugadores=load('jugadores');
    if(req.method==='GET'){
      const jid=req.query.jugador_id;
      let out = pagos.map(p=>{
        const j=jugadores.find(x=>x.id===Number(p.jugador_id));
        return {...p, jugador: j? j.nombre+' '+(j.apellidos||'') : 'N/A', jugador_telefono: j?.telefono, jugador_categoria: j?.categoria };
      }).sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
      if(jid) out=out.filter(x=> String(x.jugador_id)===String(jid));
      return res.status(200).json(out);
    }
    if(req.method==='POST'){
      const { jugador_id, monto, fecha, tipo, observacion, mes_pago, cantidad_meses, periodo_inicio, periodo_fin, mes_abonado } = req.body;
      if(!jugador_id||!monto||!fecha) return res.status(400).json({ error:'Jugador, monto y fecha requeridos'});
      const cant=Number(cantidad_meses)||1;
      const jIdx=jugadores.findIndex(x=>x.id===Number(jugador_id));
      if(jIdx===-1) return res.status(404).json({ error:'Jugador no existe'});
      const base=Number(jugadores[jIdx].mensualidad_objetivo)||50000;
      const desc=Number(jugadores[jIdx].descuento_beca)||0;
      const objetivo=Math.round(base*(1-desc/100));
      let estado='completo', saldo=0;
      if(objetivo===0) estado='completo';
      else if(Number(monto)>=objetivo) estado='completo';
      else if(Number(monto)>0){ estado='abono'; saldo=objetivo-Number(monto); }
      const venc=vencimiento30(fecha);
      const recibo='REC-'+Date.now().toString().slice(-6);
      const nuevo={ id:nextId(pagos), jugador_id:Number(jugador_id), monto:Number(monto), fecha, tipo:tipo||'abono', observacion:observacion||null, mes_pago:mes_pago||mes_abonado||null, cantidad_meses:cant, periodo_inicio:periodo_inicio||null, periodo_fin:periodo_fin||null, recibo_numero:recibo, vencimiento:venc, estado_pago:estado, saldo_pendiente:saldo, mes_abonado:mes_abonado||mes_pago||null, created_at:new Date().toISOString() };
      pagos.push(nuevo); save('pagos', pagos);
      // actualizar jugador
      jugadores[jIdx].mensualidad = (Number(jugadores[jIdx].mensualidad)||0)+Number(monto);
      jugadores[jIdx].proximo_vencimiento=venc;
      jugadores[jIdx].saldo_pendiente=saldo;
      save('jugadores', jugadores);
      // whatsapp auto
      let hist=load('whatsapp_historial');
      const tel=jugadores[jIdx].acudiente_telefono||jugadores[jIdx].telefono;
      if(tel && !jugadores[jIdx].whatsapp_opt_out){
        const msg=estado==='abono'? `Hola ${jugadores[jIdx].acudiente_nombre||jugadores[jIdx].nombre}, ${jugadores[jIdx].nombre} abonó $${Number(monto).toLocaleString()}, le faltan $${saldo.toLocaleString()}. Vence ${venc}. EFUSA` : `Gracias ${jugadores[jIdx].acudiente_nombre||jugadores[jIdx].nombre}, recibimos $${Number(monto).toLocaleString()} de ${jugadores[jIdx].nombre}. Próximo: ${venc}. Recibo ${recibo}. EFUSA ✅`;
        hist.push({ id:nextId(hist), jugador_id:jugadores[jIdx].id, telefono:tel, plantilla_codigo:estado==='abono'?'abono_incompleto':'confirmacion_pago', mensaje:msg, tipo:'automatico', estado:'enviado', created_at:new Date().toISOString()});
        save('whatsapp_historial', hist);
      }
      return res.status(201).json(nuevo);
    }
    if(req.method==='PUT'){
      const id=Number(req.body.id||req.query.id);
      const idx=pagos.findIndex(x=>x.id===id);
      if(idx===-1) return res.status(404).json({ error:'No encontrado'});
      const old=pagos[idx];
      const { jugador_id, monto, fecha, tipo, observacion, mes_pago } = req.body;
      // ajustar mensualidad del jugador viejo
      let jugadores2=load('jugadores');
      const oldJ=jugadores2.findIndex(x=>x.id===Number(old.jugador_id));
      if(oldJ!==-1) jugadores2[oldJ].mensualidad=Math.max(0,(Number(jugadores2[oldJ].mensualidad)||0)-Number(old.monto));
      // sumar al jugador nuevo (o mismo)
      const newJ=jugadores2.findIndex(x=>x.id===Number(jugador_id));
      if(newJ!==-1) jugadores2[newJ].mensualidad=(Number(jugadores2[newJ].mensualidad)||0)+Number(monto);
      // recalcular vencimiento y saldo del jugador afectado
      const jIdx=newJ!==-1?newJ:oldJ;
      if(jIdx!==-1){
        const base=Number(jugadores2[jIdx].mensualidad_objetivo)||50000;
        const desc=Number(jugadores2[jIdx].descuento_beca)||0;
        const objetivo=Math.round(base*(1-desc/100));
        const pagado=Number(jugadores2[jIdx].mensualidad)||0;
        jugadores2[jIdx].saldo_pendiente=Math.max(0, objetivo-pagado);
        jugadores2[jIdx].proximo_vencimiento=vencimiento30(fecha||new Date().toISOString().split('T')[0]);
      }
      save('jugadores', jugadores2);
      const venc=vencimiento30(fecha||old.fecha);
      pagos[idx]={...pagos[idx], jugador_id:Number(jugador_id), monto:Number(monto), fecha, tipo:tipo||old.tipo, observacion:observacion||old.observacion, mes_pago:mes_pago||old.mes_pago, vencimiento:venc, estado_pago:Number(monto)>=((Number(jugadores2[jIdx]?.mensualidad_objetivo)||50000))?'completo':'abono', saldo_pendiente:Math.max(0,((Number(jugadores2[jIdx]?.mensualidad_objetivo)||50000))-Number(monto))};
      save('pagos', pagos);
      return res.status(200).json(pagos[idx]);
    }
    if(req.method==='DELETE'){
      const id=Number(req.query.id);
      const p=pagos.find(x=>x.id===id);
      if(!p) return res.status(404).json({ error:'No encontrado'});
      pagos=pagos.filter(x=>x.id!==id); save('pagos', pagos);
      // Recalcular jugador
      let jugadores2=load('jugadores');
      const jIdx=jugadores2.findIndex(x=>x.id===Number(p.jugador_id));
      if(jIdx!==-1){
        jugadores2[jIdx].mensualidad=Math.max(0,(Number(jugadores2[jIdx].mensualidad)||0)-Number(p.monto));
        // Recalcular saldo
        const base=Number(jugadores2[jIdx].mensualidad_objetivo)||50000;
        const desc=Number(jugadores2[jIdx].descuento_beca)||0;
        const objetivo=Math.round(base*(1-desc/100));
        const pagado=Number(jugadores2[jIdx].mensualidad)||0;
        jugadores2[jIdx].saldo_pendiente=Math.max(0, objetivo-pagado);
        // Buscar ultimo pago para vencimiento
        const ultimoPago=pagos.filter(pg=>pg.jugador_id===p.jugador_id).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))[0];
        jugadores2[jIdx].proximo_vencimiento=ultimoPago? vencimiento30(ultimoPago.fecha) : vencimiento30(new Date().toISOString().split('T')[0]);
        save('jugadores', jugadores2);
      }
      return res.status(200).json({ mensaje:'Eliminado'});
    }
    return res.status(405).json({ error:'Método no permitido'});
  }

  // MODO NEON
  try{
    if(req.method==='GET'){
      const jid=req.query.jugador_id;
      let sql=`SELECT p.id, p.jugador_id, j.nombre AS jugador, j.apellidos, j.telefono AS jugador_telefono, j.acudiente_telefono, j.categoria AS jugador_categoria, p.monto, p.fecha, p.tipo, p.observacion, p.mes_pago, p.cantidad_meses, p.periodo_inicio, p.periodo_fin, p.recibo_numero, p.vencimiento, p.estado_pago, p.created_at FROM pagos p JOIN jugadores j ON j.id=p.jugador_id`;
      const params=[];
      if(jid){ sql+=` WHERE p.jugador_id=$1`; params.push(jid); }
      sql+=` ORDER BY p.created_at DESC`;
      const {rows}=await query(sql, params);
      return res.status(200).json(rows);
    }
    if(req.method==='POST'){
      const { jugador_id, monto, fecha, tipo, observacion, mes_pago, cantidad_meses, periodo_inicio, periodo_fin, mes_abonado }=req.body;
      if(!jugador_id||!monto||!fecha) return res.status(400).json({ error:'Jugador, monto y fecha requeridos'});
      let cant=Number(cantidad_meses)||1;
      const jug=await query('SELECT mensualidad, mensualidad_objetivo, descuento_beca FROM jugadores WHERE id=$1',[jugador_id]);
      if(jug.rows.length===0) return res.status(404).json({ error:'Jugador no existe'});
      const base=Number(jug.rows[0].mensualidad_objetivo)||50000;
      const desc=Number(jug.rows[0].descuento_beca)||0;
      const objetivo=Math.round(base*(1-desc/100));
      let estado='completo', saldo=0;
      let venc=new Date(fecha); venc.setDate(venc.getDate()+30); const vencStr=venc.toISOString().split('T')[0];
      if(objetivo===0) estado='completo'; else if(Number(monto)>=objetivo) estado='completo'; else if(Number(monto)>0){ estado='abono'; saldo=objetivo-Number(monto); }
      const recibo='REC-'+Date.now().toString().slice(-6);
      const {rows}=await query(`INSERT INTO pagos (jugador_id, monto, fecha, tipo, observacion, mes_pago, cantidad_meses, periodo_inicio, periodo_fin, recibo_numero, vencimiento, estado_pago, saldo_pendiente, mes_abonado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,[jugador_id, monto, fecha, tipo||'abono', observacion||null, mes_pago||mes_abonado||null, cant, periodo_inicio||null, periodo_fin||null, recibo, vencStr, estado, saldo, mes_abonado||mes_pago||null]);
      await query(`UPDATE jugadores SET mensualidad=mensualidad+$1, proximo_vencimiento=$2, saldo_pendiente=$3 WHERE id=$4`,[monto, vencStr, saldo, jugador_id]);
      return res.status(201).json(rows[0]);
    }
    if(req.method==='PUT'){
      const id=req.body.id||req.query.id;
      const { jugador_id, monto, fecha, tipo, observacion, mes_pago, cantidad_meses, periodo_inicio, periodo_fin }=req.body;
      if(!id||!jugador_id||!monto||!fecha) return res.status(400).json({ error:'Datos incompletos'});
      const {rows:oldRows}=await query('SELECT * FROM pagos WHERE id=$1',[id]);
      if(oldRows.length===0) return res.status(404).json({ error:'Pago no encontrado'});
      const old=oldRows[0];
      const {rows}=await query(`UPDATE pagos SET jugador_id=$1, monto=$2, fecha=$3, tipo=$4, observacion=$5, mes_pago=$6, cantidad_meses=$7, periodo_inicio=$8, periodo_fin=$9 WHERE id=$10 RETURNING *`,[jugador_id, monto, fecha, tipo, observacion, mes_pago, cantidad_meses||1, periodo_inicio, periodo_fin, id]);
      if(Number(old.jugador_id)!==Number(jugador_id)){
        await query(`UPDATE jugadores SET mensualidad=mensualidad-$1 WHERE id=$2`,[old.monto, old.jugador_id]);
        await query(`UPDATE jugadores SET mensualidad=mensualidad+$1 WHERE id=$2`,[monto, jugador_id]);
      } else {
        const dif=Number(monto)-Number(old.monto);
        await query(`UPDATE jugadores SET mensualidad=mensualidad+$1 WHERE id=$2`,[dif, jugador_id]);
      }
      return res.status(200).json(rows[0]);
    }
    if(req.method==='DELETE'){
      const {id}=req.query; if(!id) return res.status(400).json({ error:'Falta ID'});
      const {rows:pd}=await query('SELECT * FROM pagos WHERE id=$1',[id]);
      if(pd.length===0) return res.status(404).json({ error:'No encontrado'});
      const p=pd[0]; await query('DELETE FROM pagos WHERE id=$1',[id]); await query(`UPDATE jugadores SET mensualidad=GREATEST(0,mensualidad-$1) WHERE id=$2`,[p.monto, p.jugador_id]); return res.status(200).json({ mensaje:'Eliminado'});
    }
    return res.status(405).json({ error:'Método no permitido'});
  }catch(e){ return res.status(500).json({ error:e.message}); }
}

export default authMiddleware(handler);
