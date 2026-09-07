import { query, isDemoMode } from './_db.js';
import { load, save } from './_store.js';
import { authMiddleware } from './_auth.js';
import { registrarBitacora } from './_bitacora.js';

async function handler(req, res) {
  if (isDemoMode()) {
    let cajas=load('caja'); let pagos=load('pagos'); let gastos=load('gastos');
    if(req.method==='GET'){
      const { resumen, fecha }=req.query;
      if(resumen==='hoy'){ const hoy=new Date().toISOString().split('T')[0]; const caja=cajas.find(c=>c.fecha===hoy)||null; const ing=pagos.filter(p=>(p.fecha||'').slice(0,10)===hoy); const gas=gastos.filter(g=>(g.fecha||'').slice(0,10)===hoy); const totIng=ing.reduce((a,b)=>a+Number(b.monto),0); const totGas=gas.reduce((a,b)=>a+Number(b.monto),0); return res.status(200).json({ fecha:hoy, caja, ingresos:{total:totIng,cnt:ing.length}, gastos:{total:totGas,cnt:gas.length}, saldo:totIng-totGas, estado:caja?.estado||'abierta'}); }
      if(fecha){ return res.status(200).json(cajas.find(c=>c.fecha===fecha)||null); }
      return res.status(200).json(cajas.slice(-30).reverse());
    }
    if(req.method==='POST'){
      const { accion, fecha, saldo_inicial, motivo }=req.body; const hoy=fecha||new Date().toISOString().split('T')[0];
      if(accion==='abrir'){ let c=cajas.find(x=>x.fecha===hoy); if(c) c.estado='abierta'; else cajas.push({fecha:hoy, saldo_inicial:saldo_inicial||0, estado:'abierta', abierta_por:req.usuario.id}); save('caja',cajas); return res.status(201).json(cajas.find(x=>x.fecha===hoy)); }
      if(accion==='cerrar'){ const ing=pagos.filter(p=>(p.fecha||'').slice(0,10)===hoy).reduce((a,b)=>a+Number(b.monto),0); const gas=gastos.filter(g=> (g.fecha||'').slice(0,10)===hoy).reduce((a,b)=>a+Number(b.monto),0); const saldo=(saldo_inicial||0)+ing-gas; let c=cajas.find(x=>x.fecha===hoy); if(c){ c.estado='cerrada'; c.saldo_final=saldo; c.total_ingresos=ing; c.total_gastos=gas; } else cajas.push({fecha:hoy, saldo_inicial:saldo_inicial||0, total_ingresos:ing, total_gastos:gas, saldo_final:saldo, estado:'cerrada'}); save('caja',cajas); return res.status(200).json(cajas.find(x=>x.fecha===hoy)); }
      if(accion==='desbloquear'){ if(req.usuario.role!=='super_admin') return res.status(403).json({error:'Solo Super Admin'}); let c=cajas.find(x=>x.fecha===hoy); if(c){ c.estado='abierta'; c.motivo_desbloqueo=motivo; } save('caja',cajas); return res.status(200).json(c); }
      return res.status(400).json({error:'Accion invalida'});
    }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  try {
    if (req.method === 'GET') {
      const { fecha, resumen } = req.query;
      if (resumen === 'hoy') {
        const hoy = new Date().toISOString().split('T')[0];
        const caja = await query('SELECT * FROM caja_diaria WHERE fecha = $1', [hoy]);
        const ingresos = await query('SELECT COALESCE(SUM(monto),0) as total, COUNT(*) as cnt FROM pagos WHERE fecha = $1', [hoy]);
        const gastos = await query('SELECT COALESCE(SUM(monto),0) as total, COUNT(*) as cnt FROM gastos WHERE fecha = $1', [hoy]);
        const saldo = Number(ingresos.rows[0].total) - Number(gastos.rows[0].total);
        return res.status(200).json({
          fecha: hoy,
          caja: caja.rows[0] || null,
          ingresos: ingresos.rows[0],
          gastos: gastos.rows[0],
          saldo,
          estado: caja.rows[0]?.estado || 'abierta'
        });
      }
      if (fecha) {
        const { rows } = await query('SELECT * FROM caja_diaria WHERE fecha = $1', [fecha]);
        return res.status(200).json(rows[0] || null);
      }
      const { rows } = await query('SELECT * FROM caja_diaria ORDER BY fecha DESC LIMIT 30');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { accion, fecha, saldo_inicial, motivo } = req.body;
      const hoy = fecha || new Date().toISOString().split('T')[0];

      if (accion === 'abrir') {
        const { rows } = await query(
          `INSERT INTO caja_diaria (fecha, saldo_inicial, estado, abierta_por)
           VALUES ($1,$2,'abierta',$3)
           ON CONFLICT (fecha) DO UPDATE SET estado='abierta', saldo_inicial=$2, updated_at=NOW()
           RETURNING *`,
          [hoy, saldo_inicial || 0, req.usuario.id]
        );
        await registrarBitacora({ usuario: req.usuario, accion: 'ABRIR_CAJA', modulo: 'caja', detalle: `Apertura caja ${hoy} saldo ${saldo_inicial}`, req });
        return res.status(201).json(rows[0]);
      }

      if (accion === 'cerrar') {
        const ingresos = await query('SELECT COALESCE(SUM(monto),0) as total FROM pagos WHERE fecha = $1', [hoy]);
        const gastos = await query('SELECT COALESCE(SUM(monto),0) as total FROM gastos WHERE fecha = $1', [hoy]);
        const saldo_final = Number(saldo_inicial || 0) + Number(ingresos.rows[0].total) - Number(gastos.rows[0].total);
        const { rows } = await query(
          `INSERT INTO caja_diaria (fecha, saldo_inicial, total_ingresos, total_gastos, saldo_final, estado, cerrada_por)
           VALUES ($1,$2,$3,$4,$5,'cerrada',$6)
           ON CONFLICT (fecha) DO UPDATE SET total_ingresos=$3, total_gastos=$4, saldo_final=$5, estado='cerrada', cerrada_por=$6, updated_at=NOW()
           RETURNING *`,
          [hoy, saldo_inicial || 0, ingresos.rows[0].total, gastos.rows[0].total, saldo_final, req.usuario.id]
        );
        await registrarBitacora({ usuario: req.usuario, accion: 'CERRAR_CAJA', modulo: 'caja', detalle: `Cierre caja ${hoy} saldo_final ${saldo_final}`, req });
        return res.status(200).json(rows[0]);
      }

      if (accion === 'desbloquear') {
        if (req.usuario.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin puede desbloquear' });
        const { rows } = await query(
          `UPDATE caja_diaria SET estado='abierta', desbloqueada_por=$1, motivo_desbloqueo=$2, updated_at=NOW() WHERE fecha=$3 RETURNING *`,
          [req.usuario.id, motivo || 'Desbloqueo manual', hoy]
        );
        await registrarBitacora({ usuario: req.usuario, accion: 'DESBLOQUEO_CAJA', modulo: 'caja', detalle: `Desbloqueo caja ${hoy} motivo: ${motivo}`, req });
        return res.status(200).json(rows[0]);
      }

      return res.status(400).json({ error: 'Acción no válida: abrir | cerrar | desbloquear' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('Caja API:', e);
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
