import { query, isDemoMode } from './_db.js';
import { load, save } from './_store.js';
import { authMiddleware, requireRole } from './_auth.js';

async function handler(req, res) {
  if(isDemoMode()){
    let cfg=load('config', {});
    // convertir array a objeto si hace falta
    if(Array.isArray(cfg)) cfg={};
    if(Object.keys(cfg).length===0) cfg={escuela_nombre:'EFUSA',escuela_telefono:'3000000000',regla_dias_recordatorio:'3',regla_dia_mora:'6',whatsapp_delay_segundos:'15'};
    if(req.method==='GET') return res.status(200).json(cfg);
    if(req.method==='PUT'){ if(req.usuario.role!=='super_admin') return res.status(403).json({error:'Solo Super Admin'}); Object.assign(cfg, req.body); save('config', cfg); return res.status(200).json({ok:true}); }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  try {
    if (req.method === 'GET') {
      const { rows } = await query('SELECT clave, valor, descripcion FROM configuracion ORDER BY clave');
      const obj = {};
      rows.forEach(r => obj[r.clave] = r.valor);
      return res.status(200).json(obj);
    }
    if (req.method === 'PUT') {
      // Solo super_admin
      if (req.usuario.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin' });
      const updates = req.body; // {clave: valor}
      for (const [k, v] of Object.entries(updates)) {
        await query(`INSERT INTO configuracion (clave, valor) VALUES ($1,$2) ON CONFLICT (clave) DO UPDATE SET valor=$2, updated_at=NOW()`, [k, String(v)]);
      }
      // bitácora
      await query(`INSERT INTO bitacora (usuario_id, usuario_nombre, accion, modulo, detalle) VALUES ($1,$2,'CONFIG','config',$3)`, [req.usuario.id, req.usuario.username, `Actualizó config ${Object.keys(updates).join(',')}`]);
      return res.status(200).json({ ok: true });
    }
    // Categorías
    if (req.method === 'POST' && req.query.tipo === 'categoria') {
      if (req.usuario.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin' });
      const { nombre, tipo_genero, mensualidad_base } = req.body;
      if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
      const { rows } = await query(`INSERT INTO categorias (nombre, tipo_genero, mensualidad_base) VALUES ($1,$2,$3) ON CONFLICT (nombre) DO UPDATE SET tipo_genero=$2, mensualidad_base=$3 RETURNING *`, [nombre, tipo_genero || 'Mixto', mensualidad_base || 50000]);
      return res.status(201).json(rows[0]);
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
