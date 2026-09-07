import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if(isDemoMode()){
    let notas=load('notas',[]);
    if(req.method==='GET'){ const {jugador_id}=req.query; if(!jugador_id) return res.status(400).json({error:'Falta jugador_id'}); return res.status(200).json(notas.filter(n=> String(n.jugador_id)===String(jugador_id)).sort((a,b)=> new Date(b.created_at)-new Date(a.created_at))); }
    if(req.method==='POST'){ const {jugador_id, nota}=req.body; if(!jugador_id||!nota) return res.status(400).json({error:'Requeridos'}); const n={id:nextId(notas), jugador_id:Number(jugador_id), nota, creado_por:req.usuario.id, creador_nombre:req.usuario.username, created_at:new Date().toISOString()}; notas.push(n); save('notas',notas); return res.status(201).json(n); }
    if(req.method==='DELETE'){ const id=Number(req.query.id); notas=notas.filter(x=>x.id!==id); save('notas',notas); return res.status(200).json({mensaje:'Eliminada'}); }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  try {
    if (req.method === 'GET') {
      const { jugador_id } = req.query;
      if (!jugador_id) return res.status(400).json({ error: 'Falta jugador_id' });
      const { rows } = await query(
        `SELECT n.*, u.nombre AS creador_nombre FROM notas_jugador n LEFT JOIN usuarios u ON u.id = n.creado_por WHERE n.jugador_id = $1 ORDER BY n.created_at DESC`,
        [jugador_id]
      );
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const { jugador_id, nota } = req.body;
      if (!jugador_id || !nota) return res.status(400).json({ error: 'jugador_id y nota requeridos' });
      const { rows } = await query(
        `INSERT INTO notas_jugador (jugador_id, nota, creado_por) VALUES ($1, $2, $3) RETURNING *`,
        [jugador_id, nota, req.usuario?.id || null]
      );
      return res.status(201).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      await query('DELETE FROM notas_jugador WHERE id = $1', [id]);
      return res.status(200).json({ mensaje: 'Nota eliminada' });
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Notas API:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default authMiddleware(handler);
