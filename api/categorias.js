import { query, isDemoMode } from './_db.js';
import { authMiddleware } from './_auth.js';
import { load, save, nextId } from './_store.js';

async function handler(req, res) {
  if (isDemoMode()) {
    let cats = load('categorias', []);
    if (!cats.length) {
      cats = [
        { id: 1, nombre: 'Sub 17-18', tipo_genero: 'Mixto', mensualidad_base: 50000, profesor_id: null, activo: true, created_at: new Date().toISOString() },
        { id: 2, nombre: 'Sub 16-15', tipo_genero: 'Mixto', mensualidad_base: 50000, profesor_id: null, activo: true, created_at: new Date().toISOString() },
        { id: 3, nombre: 'Sub 14-13', tipo_genero: 'Mixto', mensualidad_base: 40000, profesor_id: null, activo: true, created_at: new Date().toISOString() },
        { id: 4, nombre: 'Sub 12-11', tipo_genero: 'Mixto', mensualidad_base: 40000, profesor_id: null, activo: true, created_at: new Date().toISOString() },
        { id: 5, nombre: 'Sub 10-9', tipo_genero: 'Mixto', mensualidad_base: 30000, profesor_id: null, activo: true, created_at: new Date().toISOString() },
        { id: 6, nombre: 'Sub 8-7', tipo_genero: 'Mixto', mensualidad_base: 30000, profesor_id: null, activo: true, created_at: new Date().toISOString() },
      ];
      save('categorias', cats);
    }
    let migrated = false;
    cats.forEach(c => { if (c.profesor_id === undefined) { c.profesor_id = null; migrated = true; } });
    if (migrated) save('categorias', cats);

    if (req.method === 'GET') {
      const jugadores = load('jugadores');
      const profesores = load('profesores');
      const out = cats.map(c => ({
        ...c,
        profesor_nombre: c.profesor_id ? (profesores.find(p => p.id === c.profesor_id)?.nombre || null) : null,
        total_jugadores: jugadores.filter(j => j.categoria === c.nombre && j.activo !== false).length
      }));
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { nombre, tipo_genero, mensualidad_base, profesor_id } = req.body;
      if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'Nombre requerido' });
      if (cats.find(c => c.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
        return res.status(409).json({ error: 'Ya existe una categoria con ese nombre' });
      }
      const cat = {
        id: nextId(cats),
        nombre: nombre.trim(),
        tipo_genero: tipo_genero || 'Mixto',
        mensualidad_base: Number(mensualidad_base) || 50000,
        profesor_id: profesor_id != null ? Number(profesor_id) : null,
        activo: true,
        created_at: new Date().toISOString()
      };
      cats.push(cat);
      save('categorias', cats);
      return res.status(201).json(cat);
    }

    if (req.method === 'PUT') {
      const id = Number(req.body.id || req.query.id);
      const idx = cats.findIndex(c => c.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Categoria no encontrada' });
      const b = req.body;
      if (b.nombre && b.nombre.trim().toLowerCase() !== cats[idx].nombre.toLowerCase()) {
        if (cats.find(c => c.nombre.toLowerCase() === b.nombre.trim().toLowerCase() && c.id !== id)) {
          return res.status(409).json({ error: 'Ya existe otra categoria con ese nombre' });
        }
      }
      const oldName = cats[idx].nombre;
      cats[idx] = {
        ...cats[idx],
        nombre: b.nombre?.trim() || cats[idx].nombre,
        tipo_genero: b.tipo_genero || cats[idx].tipo_genero,
        mensualidad_base: Number(b.mensualidad_base) ?? cats[idx].mensualidad_base,
        profesor_id: b.profesor_id !== undefined ? (b.profesor_id != null && b.profesor_id !== '' ? Number(b.profesor_id) : null) : cats[idx].profesor_id,
        activo: b.activo !== undefined ? b.activo : cats[idx].activo,
      };
      if (b.nombre && b.nombre.trim() !== oldName) {
        let jugadores = load('jugadores');
        jugadores.forEach(j => { if (j.categoria === oldName) j.categoria = cats[idx].nombre; });
        save('jugadores', jugadores);
      }
      save('categorias', cats);
      return res.status(200).json(cats[idx]);
    }

    if (req.method === 'PATCH') {
      const id = Number(req.body.id || req.query.id);
      const idx = cats.findIndex(c => c.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Categoria no encontrada' });
      cats[idx].activo = !cats[idx].activo;
      save('categorias', cats);
      return res.status(200).json(cats[idx]);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      const cat = cats.find(c => c.id === id);
      if (!cat) return res.status(404).json({ error: 'Categoria no encontrada' });
      const jugadores = load('jugadores');
      const enUso = jugadores.some(j => j.categoria === cat.nombre && j.activo !== false);
      if (enUso) return res.status(400).json({ error: 'No se puede eliminar: hay jugadores activos en esta categoria. Pausala primero.' });
      cats = cats.filter(c => c.id !== id);
      save('categorias', cats);
      return res.status(200).json({ mensaje: 'Categoria eliminada' });
    }

    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // MODO NEON
  try {
    if (req.method === 'GET') {
      const { rows } = await query('SELECT c.*, COALESCE(p.nombre, NULL) AS profesor_nombre FROM categorias c LEFT JOIN profesores p ON p.id = c.profesor_id ORDER BY c.nombre');
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      if (req.usuario.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin' });
      const { nombre, tipo_genero, mensualidad_base, profesor_id } = req.body;
      if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
      const { rows } = await query(`INSERT INTO categorias (nombre, tipo_genero, mensualidad_base, profesor_id) VALUES ($1,$2,$3,$4) ON CONFLICT (nombre) DO UPDATE SET tipo_genero=$2, mensualidad_base=$3, profesor_id=$4 RETURNING *`, [nombre, tipo_genero || 'Mixto', mensualidad_base || 50000, profesor_id || null]);
      return res.status(201).json(rows[0]);
    }
    if (req.method === 'PUT') {
      if (req.usuario.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin' });
      const id = Number(req.body.id);
      const { nombre, tipo_genero, mensualidad_base, activo, profesor_id } = req.body;
      const { rows } = await query(`UPDATE categorias SET nombre=COALESCE($1,nombre), tipo_genero=COALESCE($2,tipo_genero), mensualidad_base=COALESCE($3,mensualidad_base), activo=COALESCE($4,activo), profesor_id=$5 WHERE id=$6 RETURNING *`, [nombre, tipo_genero, mensualidad_base, activo, profesor_id || null, id]);
      if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'PATCH') {
      if (req.usuario.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin' });
      const id = Number(req.body.id);
      const { rows } = await query(`UPDATE categorias SET activo = NOT activo WHERE id=$1 RETURNING *`, [id]);
      if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      if (req.usuario.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin' });
      const id = Number(req.query.id);
      const { rows: cat } = await query('SELECT nombre FROM categorias WHERE id=$1', [id]);
      if (!cat.length) return res.status(404).json({ error: 'No encontrada' });
      const { rows: enUso } = await query('SELECT COUNT(*) AS total FROM jugadores WHERE categoria=$1 AND activo=true', [cat[0].nombre]);
      if (Number(enUso[0].total) > 0) return res.status(400).json({ error: 'No se puede eliminar: hay jugadores activos en esta categoria. Pausala primero.' });
      await query('DELETE FROM categorias WHERE id=$1', [id]);
      return res.status(200).json({ mensaje: 'Categoria eliminada' });
    }
    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
