import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if (isDemoMode()) {
    let items = load('convocatorias');
    let partidos = load('partidos');
    let jugadores = load('jugadores');

    if (req.method === 'GET') {
      const { partido_id, categoria } = req.query;
      let out = items;
      if (partido_id) out = out.filter(x => x.partido_id === Number(partido_id));
      if (categoria) out = out.filter(x => x.categoria === categoria);

      out = out.map(c => {
        const p = partidos.find(x => x.id === c.partido_id);
        return {
          ...c,
          rival: p?.rival || '',
          fecha: p?.fecha || '',
          convocados: (c.convocados || []).map(cv => {
            const j = jugadores.find(x => x.id === cv.jugador_id);
            return { ...cv, jugador_nombre: j ? j.nombre + ' ' + (j.apellidos || '') : cv.jugador_nombre || '', categoria: j?.categoria || cv.categoria || '' };
          })
        };
      });
      out = out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { partido_id, categoria, convocados } = req.body;
      if (!partido_id || !categoria) return res.status(400).json({ error: 'partido_id y categoria requeridos' });
      const item = {
        id: nextId(items), partido_id: Number(partido_id), categoria,
        convocados: convocados || [], created_at: new Date().toISOString()
      };
      items.push(item);
      save('convocatorias', items);
      return res.status(201).json(item);
    }

    if (req.method === 'PUT') {
      const id = Number(req.body.id || req.query.id);
      const idx = items.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
      const { convocados } = req.body;
      if (convocados !== undefined) items[idx].convocados = convocados;
      save('convocatorias', items);
      return res.status(200).json(items[idx]);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      items = items.filter(x => x.id !== id);
      save('convocatorias', items);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // MODO NEON
  try {
    if (req.method === 'GET') {
      const { partido_id, categoria } = req.query;
      let sql = `SELECT c.*, p.rival, p.fecha as partido_fecha
                 FROM convocatorias c
                 LEFT JOIN partidos p ON p.id = c.partido_id
                 WHERE 1=1`;
      const params = [];
      if (partido_id) { params.push(partido_id); sql += ` AND c.partido_id=$${params.length}`; }
      if (categoria) { params.push(categoria); sql += ` AND c.categoria=$${params.length}`; }
      sql += ' ORDER BY c.created_at DESC';
      const { rows } = await query(sql, params);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { partido_id, categoria, convocados } = req.body;
      if (!partido_id || !categoria) return res.status(400).json({ error: 'partido_id y categoria requeridos' });
      const { rows } = await query(
        `INSERT INTO convocatorias (partido_id, categoria, convocados) VALUES ($1,$2,$3) RETURNING *`,
        [partido_id, categoria, JSON.stringify(convocados || [])]
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const id = req.body.id || req.query.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const { convocados } = req.body;
      const { rows } = await query(
        `UPDATE convocatorias SET convocados=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [JSON.stringify(convocados || []), id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      await query('DELETE FROM convocatorias WHERE id=$1', [id]);
      return res.status(200).json({ mensaje: 'Eliminado' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
