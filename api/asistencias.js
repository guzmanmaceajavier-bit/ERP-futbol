import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if(isDemoMode()){
    let asis=load('asistencias',[]);
    let jugadores=load('jugadores');
    if(req.method==='GET'){
      const {fecha, jugador_id}=req.query;
      let out=asis;
      if(fecha) out=out.filter(a=>a.fecha===fecha);
      if(jugador_id) out=out.filter(a=> String(a.jugador_id)===String(jugador_id));
      out=out.map(a=>{ const j=jugadores.find(x=>x.id===Number(a.jugador_id))||{}; return {...a, nombre:j.nombre, apellidos:j.apellidos, categoria:j.categoria}; });
      return res.status(200).json(out);
    }
    if(req.method==='POST'){
      const {registros}=req.body; if(!registros||!registros.length) return res.status(400).json({error:'Debe enviar al menos un registro'});
      const resu=[];
      registros.forEach(r=>{
        let idx=asis.findIndex(a=> Number(a.jugador_id)===Number(r.jugador_id) && a.fecha===r.fecha);
        const rec={id: idx!==-1?asis[idx].id: nextId(asis), jugador_id:Number(r.jugador_id), fecha:r.fecha, presente:r.presente!==false, observacion:r.observacion||null, created_at:new Date().toISOString()};
        if(idx!==-1) asis[idx]=rec; else asis.push(rec);
        resu.push(rec);
      });
      save('asistencias', asis); return res.status(201).json(resu);
    }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  try {
    if (req.method === 'GET') {
      const { fecha, jugador_id } = req.query;
      let sql = `SELECT a.*, j.nombre, j.apellidos, j.categoria FROM asistencias a JOIN jugadores j ON j.id = a.jugador_id`;
      const params = [];
      const condiciones = [];
      if (fecha) { condiciones.push(`a.fecha = $${params.length + 1}`); params.push(fecha); }
      if (jugador_id) { condiciones.push(`a.jugador_id = $${params.length + 1}`); params.push(jugador_id); }
      if (condiciones.length) sql += ` WHERE ${condiciones.join(' AND ')}`;
      sql += ` ORDER BY a.fecha DESC, j.nombre`;
      const { rows } = await query(sql, params);
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const { registros } = req.body;
      if (!registros || !Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({ error: 'Debe enviar al menos un registro' });
      }
      const resultados = [];
      for (const r of registros) {
        const { rows } = await query(
          `INSERT INTO asistencias (jugador_id, fecha, presente, observacion)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (jugador_id, fecha) DO UPDATE SET presente = $3, observacion = $4
           RETURNING *`,
          [r.jugador_id, r.fecha, r.presente !== false, r.observacion || null]
        );
        resultados.push(rows[0]);
      }
      return res.status(201).json(resultados);
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Asistencias API:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default authMiddleware(handler);
