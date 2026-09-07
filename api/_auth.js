import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'efusa-secret-dev-2024';

export function generarToken(usuario) {
  return jwt.sign({ id: usuario.id, username: usuario.username, role: usuario.role || 'admin' }, SECRET, { expiresIn: '24h' });
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function authMiddleware(handler, { roles } = {}) {
  return async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(204).end();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verificarToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    if (roles && roles.length > 0 && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    req.usuario = decoded;
    return handler(req, res);
  };
}

export function requireRole(...roles) {
  return (handler) => authMiddleware(handler, { roles });
}
