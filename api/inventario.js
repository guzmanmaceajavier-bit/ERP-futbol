import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';
import { registrarBitacora } from './_bitacora.js';

async function handler(req, res) {
  if(isDemoMode()){
    let inv=load('inventario');
    if(req.method==='GET') return res.status(200).json(inv.map(x=>({...x, alerta_bajo: Number(x.stock)<=Number(x.stock_minimo)})));
    if(req.method==='POST'){ const {nombre,categoria,stock,stock_minimo,costo_unitario,proveedor}=req.body; if(!nombre) return res.status(400).json({error:'Nombre requerido'}); const it={id:nextId(inv), nombre,categoria:categoria||'General', stock:Number(stock)||0, stock_minimo:Number(stock_minimo)||5, costo_unitario:Number(costo_unitario)||0, proveedor:proveedor||null}; inv.push(it); save('inventario',inv); return res.status(201).json(it); }
    if(req.method==='PUT'){ const {id,nombre,categoria,stock,stock_minimo,costo_unitario,proveedor}=req.body; const idx=inv.findIndex(x=>x.id===Number(id)); if(idx===-1) return res.status(404).json({error:'No encontrado'}); inv[idx]={...inv[idx], nombre,categoria, stock:Number(stock), stock_minimo:Number(stock_minimo), costo_unitario:Number(costo_unitario), proveedor}; save('inventario',inv); return res.status(200).json(inv[idx]); }
    if(req.method==='DELETE'){ const id=Number(req.query.id); inv=inv.filter(x=>x.id!==id); save('inventario',inv); return res.status(200).json({mensaje:'Eliminado'}); }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  try {
    if (req.method === 'GET') {
      const { rows } = await query('SELECT *, (stock <= stock_minimo) as alerta_bajo FROM inventario ORDER BY alerta_bajo DESC, nombre');
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const { nombre, categoria, stock, stock_minimo, costo_unitario, proveedor } = req.body;
      if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
      const { rows } = await query(
        `INSERT INTO inventario (nombre, categoria, stock, stock_minimo, costo_unitario, proveedor) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [nombre, categoria || 'General', stock || 0, stock_minimo || 5, costo_unitario || 0, proveedor || null]
      );
      await registrarBitacora({ usuario: req.usuario, accion: 'CREAR', modulo: 'inventario', detalle: `Item ${nombre} stock ${stock}`, req });
      return res.status(201).json(rows[0]);
    }
    if (req.method === 'PUT') {
      const { id, nombre, categoria, stock, stock_minimo, costo_unitario, proveedor } = req.body;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      const { rows } = await query(
        `UPDATE inventario SET nombre=$1, categoria=$2, stock=$3, stock_minimo=$4, costo_unitario=$5, proveedor=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
        [nombre, categoria, stock, stock_minimo, costo_unitario, proveedor, id]
      );
      await registrarBitacora({ usuario: req.usuario, accion: 'EDITAR', modulo: 'inventario', detalle: `Editó inventario #${id}`, req });
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await query('DELETE FROM inventario WHERE id=$1', [id]);
      await registrarBitacora({ usuario: req.usuario, accion: 'ELIMINAR', modulo: 'inventario', detalle: `Eliminó inventario #${id}`, req });
      return res.status(200).json({ mensaje: 'Eliminado' });
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('Inventario API:', e);
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
