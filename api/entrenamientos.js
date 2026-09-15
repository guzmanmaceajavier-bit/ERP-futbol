import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if (isDemoMode()) {
    let items = load('entrenamientos');

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
      const { fecha, hora, categoria, entrenador, lugar, tema, observaciones, estado } = req.body;
      if (!fecha || !categoria) return res.status(400).json({ error: 'Fecha y categoria requeridos' });
      const item = {
        id: nextId(items), fecha, hora: hora || '', categoria,
        entrenador: entrenador || '', lugar: lugar || '', tema: tema || '',
        observaciones: observaciones || '', estado: estado || 'programado',
        created_at: new Date().toISOString()
      };
      items.push(item);
      save('entrenamientos', items);
      return res.status(201).json(item);
    }

    if (req.method === 'PUT') {
      const id = Number(req.body.id || req.query.id);
      const idx = items.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
      const b = req.body;
      items[idx] = { ...items[idx], fecha: b.fecha || items[idx].fecha, hora: b.hora ?? items[idx].hora, categoria: b.categoria || items[idx].categoria, entrenador: b.entrenador ?? items[idx].entrenador, lugar: b.lugar ?? items[idx].lugar, tema: b.tema ?? items[idx].tema, observaciones: b.observaciones ?? items[idx].observaciones, estado: b.estado || items[idx].estado };
      save('entrenamientos', items);
      return res.status(200).json(items[idx]);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      items = items.filter(x => x.id !== id);
      save('entrenamientos', items);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // MODO NEON
  try {
    if (req.method === 'GET') {
      const { categoria, estado, desde, hasta } = req.query;
      let sql = 'SELECT * FROM entrenamientos WHERE 1=1';
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
      const { fecha, hora, categoria, entrenador, lugar, tema, observaciones, estado } = req.body;
      if (!fecha || !categoria) return res.status(400).json({ error: 'Fecha y categoria requeridos' });
      const { rows } = await query(
        `INSERT INTO entrenamientos (fecha, hora, categoria, entrenador, lugar, tema, observaciones, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [fecha, hora || '', categoria, entrenador || '', lugar || '', tema || '', observaciones || '', estado || 'programado']
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const id = req.body.id || req.query.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const { fecha, hora, categoria, entrenador, lugar, tema, observaciones, estado } = req.body;
      const { rows } = await query(
        `UPDATE entrenamientos SET fecha=$1, hora=$2, categoria=$3, entrenador=$4, lugar=$5, tema=$6, observaciones=$7, estado=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
        [fecha, hora, categoria, entrenador, lugar, tema, observaciones, estado, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      await query('DELETE FROM entrenamientos WHERE id=$1', [id]);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
