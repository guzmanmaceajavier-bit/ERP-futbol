import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if(isDemoMode()){
    let torneos=load('torneos',[]);
    if(req.method==='GET') return res.status(200).json(torneos);
    if(req.method==='POST'){ const {nombre,fecha_inicio,fecha_fin,lugar,costo,observacion,tipo_genero,categoria_requerida}=req.body; if(!nombre) return res.status(400).json({error:'Nombre requerido'}); const t={id:nextId(torneos), nombre, tipo_genero:tipo_genero||'Mixto', categoria_requerida:categoria_requerida||null, fecha_inicio:fecha_inicio||null, fecha_fin:fecha_fin||null, lugar:lugar||null, costo:Number(costo)||0, observacion:observacion||null, convocados:0, created_at:new Date().toISOString()}; torneos.push(t); save('torneos',torneos); return res.status(201).json(t); }
    if(req.method==='PUT'){ const {id,nombre,fecha_inicio,fecha_fin,lugar,costo,observacion,tipo_genero,categoria_requerida}=req.body; const idx=torneos.findIndex(x=>x.id===Number(id)); if(idx===-1) return res.status(404).json({error:'No encontrado'}); torneos[idx]={...torneos[idx], nombre, tipo_genero, categoria_requerida, fecha_inicio, fecha_fin, lugar, costo, observacion}; save('torneos',torneos); return res.status(200).json(torneos[idx]); }
    if(req.method==='DELETE'){ const id=Number(req.query.id); torneos=torneos.filter(x=>x.id!==id); save('torneos',torneos); return res.status(200).json({mensaje:'Eliminado'}); }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  try {
    if (req.method === 'GET') {
      const { rows } = await query(`
        SELECT t.*, COALESCE(tj.convocados, 0) AS convocados
        FROM torneos t
        LEFT JOIN (SELECT torneo_id, COUNT(*) AS convocados FROM torneo_jugadores WHERE convocado = true GROUP BY torneo_id) tj ON tj.torneo_id = t.id
        ORDER BY t.created_at DESC
      `);
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const { nombre, fecha_inicio, fecha_fin, lugar, costo, observacion } = req.body;
      if (!nombre) return res.status(400).json({ error: 'Nombre del torneo requerido' });
      const { rows } = await query(
        `INSERT INTO torneos (nombre, fecha_inicio, fecha_fin, lugar, costo, observacion) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [nombre, fecha_inicio || null, fecha_fin || null, lugar || null, costo || 0, observacion || null]
      );
      return res.status(201).json(rows[0]);
    }
    if (req.method === 'PUT') {
      const { id, nombre, fecha_inicio, fecha_fin, lugar, costo, observacion } = req.body;
      if (!id || !nombre) return res.status(400).json({ error: 'ID y nombre requeridos' });
      const { rows } = await query(
        `UPDATE torneos SET nombre=$1, fecha_inicio=$2, fecha_fin=$3, lugar=$4, costo=$5, observacion=$6 WHERE id=$7 RETURNING *`,
        [nombre, fecha_inicio, fecha_fin, lugar, costo, observacion, id]
      );
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      await query('DELETE FROM torneos WHERE id = $1', [id]);
      return res.status(200).json({ mensaje: 'Torneo eliminado' });
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Torneos API:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default authMiddleware(handler);
