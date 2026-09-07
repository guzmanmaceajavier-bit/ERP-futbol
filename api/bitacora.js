import { query, isDemoMode } from './_db.js';
import { load } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if(isDemoMode()){
    if(req.method!=='GET') return res.status(405).json({error:'Metodo no permitido'});
    let logs=load('bitacora');
    const {modulo}=req.query;
    let out=logs; if(modulo) out=out.filter(l=>l.modulo===modulo);
    out=out.sort((a,b)=> new Date(b.fecha)-new Date(a.fecha)).slice(0,100);
    return res.status(200).json(out);
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  if (req.usuario.role !== 'super_admin' && req.usuario.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  const { modulo, desde, hasta, limit } = req.query;
  let sql = 'SELECT * FROM bitacora WHERE 1=1';
  const params = [];
  if (modulo) { params.push(modulo); sql += ` AND modulo = $${params.length}`; }
  if (desde) { params.push(desde); sql += ` AND fecha >= $${params.length}`; }
  if (hasta) { params.push(hasta); sql += ` AND fecha <= $${params.length}`; }
  sql += ` ORDER BY fecha DESC LIMIT ${Math.min(Number(limit) || 100, 500)}`;
  const { rows } = await query(sql, params);
  return res.status(200).json(rows);
}

export default authMiddleware(handler);
