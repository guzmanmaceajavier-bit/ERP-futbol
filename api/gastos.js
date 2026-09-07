import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';
import { registrarBitacora } from './_bitacora.js';

async function handler(req, res) {
  if (isDemoMode()) {
    let gastos = load('gastos');
    if (req.method === 'GET') {
      const { fecha, categoria } = req.query;
      let out=gastos;
      if(fecha) out=out.filter(g=> (g.fecha||'').slice(0,10)===fecha);
      if(categoria) out=out.filter(g=>g.categoria===categoria);
      out=out.sort((a,b)=> new Date(b.fecha)-new Date(a.fecha));
      return res.status(200).json(out);
    }
    if (req.method === 'POST') {
      const { concepto, descripcion, monto, categoria, fecha } = req.body;
      if(!concepto||!monto) return res.status(400).json({error:'Concepto y monto requeridos'});
      const g={ id:nextId(gastos), concepto, descripcion:descripcion||null, monto:Number(monto), categoria:categoria||'General', fecha:fecha||new Date().toISOString().split('T')[0], creado_por:req.usuario.id, created_at:new Date().toISOString() };
      gastos.push(g); save('gastos', gastos); return res.status(201).json(g);
    }
    if (req.method === 'PUT') { const { id, concepto, descripcion, monto, categoria, fecha }=req.body; const idx=gastos.findIndex(x=>x.id===Number(id)); if(idx===-1) return res.status(404).json({error:'No encontrado'}); gastos[idx]={...gastos[idx], concepto, descripcion, monto:Number(monto), categoria, fecha}; save('gastos', gastos); return res.status(200).json(gastos[idx]); }
    if (req.method === 'DELETE') { const id=Number(req.query.id); gastos=gastos.filter(x=>x.id!==id); save('gastos', gastos); return res.status(200).json({mensaje:'Eliminado'}); }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  // Verificar caja no cerrada
  async function cajaBloqueada(fecha) {
    const d = fecha || new Date().toISOString().split('T')[0];
    const { rows } = await query('SELECT estado FROM caja_diaria WHERE fecha=$1', [d]);
    return rows[0]?.estado === 'cerrada';
  }

  try {
    if (req.method === 'GET') {
      const { fecha, categoria } = req.query;
      let sql = 'SELECT g.*, u.nombre as creado_por_nombre FROM gastos g LEFT JOIN usuarios u ON u.id=g.creado_por WHERE 1=1';
      const params = [];
      if (fecha) { params.push(fecha); sql += ` AND g.fecha = $${params.length}`; }
      if (categoria) { params.push(categoria); sql += ` AND g.categoria = $${params.length}`; }
      sql += ' ORDER BY g.fecha DESC, g.created_at DESC';
      const { rows } = await query(sql, params);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { concepto, descripcion, monto, categoria, fecha } = req.body;
      if (!concepto || !monto) return res.status(400).json({ error: 'Concepto y monto requeridos' });
      const f = fecha || new Date().toISOString().split('T')[0];
      if (await cajaBloqueada(f)) return res.status(423).json({ error: `Caja del ${f} está cerrada. Desbloquee con Super Admin.` });
      const { rows } = await query(
        `INSERT INTO gastos (concepto, descripcion, monto, categoria, fecha, creado_por) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [concepto, descripcion || null, monto, categoria || 'General', f, req.usuario.id]
      );
      await registrarBitacora({ usuario: req.usuario, accion: 'CREAR', modulo: 'gastos', detalle: `Gasto ${concepto} $${monto} cat:${categoria}`, req });
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, concepto, descripcion, monto, categoria, fecha } = req.body;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      const old = await query('SELECT fecha FROM gastos WHERE id=$1', [id]);
      if (old.rows[0] && await cajaBloqueada(old.rows[0].fecha)) return res.status(423).json({ error: 'Caja cerrada, no editable' });
      const { rows } = await query(
        `UPDATE gastos SET concepto=$1, descripcion=$2, monto=$3, categoria=$4, fecha=$5 WHERE id=$6 RETURNING *`,
        [concepto, descripcion, monto, categoria, fecha, id]
      );
      await registrarBitacora({ usuario: req.usuario, accion: 'EDITAR', modulo: 'gastos', detalle: `Editó gasto #${id}`, req });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      const old = await query('SELECT fecha FROM gastos WHERE id=$1', [id]);
      if (old.rows[0] && await cajaBloqueada(old.rows[0].fecha)) return res.status(423).json({ error: 'Caja cerrada, no eliminable' });
      await query('DELETE FROM gastos WHERE id=$1', [id]);
      await registrarBitacora({ usuario: req.usuario, accion: 'ELIMINAR', modulo: 'gastos', detalle: `Eliminó gasto #${id}`, req });
      return res.status(200).json({ mensaje: 'Gasto eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('Gastos API:', e);
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
