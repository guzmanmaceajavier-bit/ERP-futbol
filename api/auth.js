import bcrypt from 'bcryptjs';
import { query, isDemoMode } from './_db.js';
import { generarToken, verificarToken } from './_auth.js';
import { load, save, nextId } from './_store.js';

// Hashes fijos para modo local (admin123 / profe123) - se generan al vuelo si hace falta
async function hashDemo(pwd) { return await bcrypt.hash(pwd, 10); }

export default async function handler(req, res) {
  try {
    const accion = req.query.accion || req.body?.accion || 'login';

    // === MODO LOCAL SIN BD ===
    if (isDemoMode()) {
      if (req.method === 'POST' && accion === 'login') {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        // Usuarios demo fijos
        const demoUsers = [
          { id: 1, username: 'admin', nombre: 'Administrador', role: 'super_admin', pwd: 'admin123' },
          { id: 2, username: 'profe', nombre: 'Profesor', role: 'profe', pwd: 'profe123' },
        ];
        const u = demoUsers.find(x => x.username === username && x.pwd === password);
        // También permitir usuarios creados en data/usuarios.json
        let extra = load('usuarios', []);
        let found = u || extra.find(x => x.username === username);
        if (!found) return res.status(401).json({ error: 'Credenciales inválidas (modo local: admin/admin123 o profe/profe123)' });
        // Si es extra, validar bcrypt
        if (!u && found.password) {
          const ok = await bcrypt.compare(password, found.password);
          if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = generarToken(found);
        return res.status(200).json({ token, usuario: { id: found.id, username: found.username, nombre: found.nombre, role: found.role } });
      }
      if (req.method === 'POST' && accion === 'register') {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Solo Super Admin' });
        const dec = verificarToken(header.split(' ')[1]);
        if (!dec || dec.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin' });
        const { username, password, nombre, role } = req.body;
        let usuarios = load('usuarios');
        if (usuarios.find(x => x.username === username)) return res.status(409).json({ error: 'Ya existe' });
        const hashed = await bcrypt.hash(password, 10);
        const nu = { id: nextId(usuarios), username, password: hashed, nombre: nombre||username, role: ['super_admin','admin','profe'].includes(role)?role:'admin', activo:true };
        usuarios.push(nu);
        save('usuarios', usuarios);
        return res.status(201).json({ id: nu.id, username: nu.username, nombre: nu.nombre, role: nu.role });
      }
      if (req.method === 'GET') {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
        const dec = verificarToken(header.split(' ')[1]);
        if (!dec) return res.status(401).json({ error: 'Token inválido' });
        return res.status(200).json({ valido: true, usuario: dec });
      }
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // === MODO NEON (BD REAL) ===
    if (req.method === 'POST' && accion === 'login') {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      const { rows } = await query('SELECT * FROM usuarios WHERE username = $1 AND activo = true', [username]);
      if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
      const usuario = rows[0];
      const valida = await bcrypt.compare(password, usuario.password);
      if (!valida) return res.status(401).json({ error: 'Credenciales inválidas' });
      await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [usuario.id]);
      const token = generarToken(usuario);
      return res.status(200).json({ token, usuario: { id: usuario.id, username: usuario.username, nombre: usuario.nombre, role: usuario.role } });
    }
    if (req.method === 'POST' && accion === 'register') {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Solo Super Admin puede crear usuarios' });
      const decoded = verificarToken(header.split(' ')[1]);
      if (!decoded || decoded.role !== 'super_admin') return res.status(403).json({ error: 'Solo Super Admin' });
      const { username, password, nombre, role } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      const { rows: existentes } = await query('SELECT id FROM usuarios WHERE username = $1', [username]);
      if (existentes.length > 0) return res.status(409).json({ error: 'El usuario ya existe' });
      const hashed = await bcrypt.hash(password, 10);
      const roleVal = ['super_admin','admin','profe'].includes(role) ? role : 'admin';
      const { rows } = await query('INSERT INTO usuarios (username, password, nombre, role) VALUES ($1,$2,$3,$4) RETURNING id, username, nombre, role', [username, hashed, nombre||username, roleVal]);
      return res.status(201).json(rows[0]);
    }
    if (req.method === 'GET') {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
      const decoded = verificarToken(header.split(' ')[1]);
      if (!decoded) return res.status(401).json({ error: 'Token inválido' });
      return res.status(200).json({ valido: true, usuario: decoded });
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
}
