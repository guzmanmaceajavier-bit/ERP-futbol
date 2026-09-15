import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if (isDemoMode()) {
    let items = load('partidos');

    if (req.method === 'GET') {
      const { categoria, estado, desde, hasta } = req.query;
      let out = items;
      if (categoria) out = out.filter(x => x.categoria === categoria);
      if (estado) out = out.filter(x => x.estado === estado);
      if (desde) out = out.filter(x => x.fecha >= desde);
      if (hasta) out = out.filter(x => x.fecha <= hasta);
      out = out.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { rival, fecha, hora, lugar, categoria, resultado, goles_favor, goles_contra, observaciones, estado } = req.body;
      if (!rival || !fecha || !categoria) return res.status(400).json({ error: 'Rival, fecha y categoria requeridos' });
      const item = {
        id: nextId(items), rival, fecha, hora: hora || '', lugar: lugar || '', categoria,
        resultado: resultado || null, goles_favor: Number(goles_favor) || null,
        goles_contra: Number(goles_contra) || null, observaciones: observaciones || '',
        estado: estado || 'programado', created_at: new Date().toISOString()
      };
      items.push(item);
      save('partidos', items);
      return res.status(201).json(item);
    }

    if (req.method === 'PUT') {
      const id = Number(req.body.id || req.query.id);
      const idx = items.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
      const b = req.body;
      items[idx] = { ...items[idx], rival: b.rival || items[idx].rival, fecha: b.fecha || items[idx].fecha, hora: b.hora ?? items[idx].hora, lugar: b.lugar ?? items[idx].lugar, categoria: b.categoria || items[idx].categoria, resultado: b.resultado ?? items[idx].resultado, goles_favor: b.goles_favor ?? items[idx].goles_favor, goles_contra: b.goles_contra ?? items[idx].goles_contra, observaciones: b.observaciones ?? items[idx].observaciones, estado: b.estado || items[idx].estado };
      save('partidos', items);
      return res.status(200).json(items[idx]);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      items = items.filter(x => x.id !== id);
      save('partidos', items);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // MODO NEON
  try {
    if (req.method === 'GET') {
      const { categoria, estado, desde, hasta } = req.query;
      let sql = 'SELECT * FROM partidos WHERE 1=1';
      const params = [];
      if (categoria) { params.push(categoria); sql += ` AND categoria=$${params.length}`; }
      if (estado) { params.push(estado); sql += ` AND estado=$${params.length}`; }
      if (desde) { params.push(desde); sql += ` AND fecha>=$${params.length}`; }
      if (hasta) { params.push(hasta); sql += ` AND fecha<=$${params.length}`; }
      sql += ' ORDER BY fecha DESC';
      const { rows } = await query(sql, params);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { rival, fecha, hora, lugar, categoria, resultado, goles_favor, goles_contra, observaciones, estado } = req.body;
      if (!rival || !fecha || !categoria) return res.status(400).json({ error: 'Rival, fecha y categoria requeridos' });
      const { rows } = await query(
        `INSERT INTO partidos (rival, fecha, hora, lugar, categoria, resultado, goles_favor, goles_contra, observaciones, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [rival, fecha, hora || '', lugar || '', categoria, resultado || null, goles_favor || null, goles_contra || null, observaciones || '', estado || 'programado']
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const id = req.body.id || req.query.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const { rival, fecha, hora, lugar, categoria, resultado, goles_favor, goles_contra, observaciones, estado } = req.body;
      const { rows } = await query(
        `UPDATE partidos SET rival=$1, fecha=$2, hora=$3, lugar=$4, categoria=$5, resultado=$6, goles_favor=$7, goles_contra=$8, observaciones=$9, estado=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
        [rival, fecha, hora, lugar, categoria, resultado, goles_favor, goles_contra, observaciones, estado, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      await query('DELETE FROM partidos WHERE id=$1', [id]);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
