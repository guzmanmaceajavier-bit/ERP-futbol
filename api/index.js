import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

// Cargar .env si existe
try {
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    env.split('\n').forEach(line => {
      const [k, ...rest] = line.split('=');
      if (k && rest.length) process.env[k.trim()] = rest.join('=').trim().replace(/^"|"$/g,'');
    });
  }
} catch {}

const PORT = process.env.PORT || 3000;

// Mapeo API dinámico
const apiFiles = {
  '/api/jugadores': './jugadores.js',
  '/api/pagos': './pagos.js',
  '/api/alertas': './alertas.js',
  '/api/auth': './auth.js',
  '/api/reportes': './reportes.js',
  '/api/asistencias': './asistencias.js',
  '/api/torneos': './torneos.js',
  '/api/notas': './notas.js',
  '/api/caja': './caja.js',
  '/api/gastos': './gastos.js',
  '/api/inventario': './inventario.js',
  '/api/profesores': './profesores.js',
  '/api/whatsapp': './whatsapp.js',
  '/api/config': './config.js',
  '/api/bitacora': './bitacora.js',
  '/api/categorias': './categorias.js',
  '/api/periodos': './periodos.js',
  '/api/entrenamientos': './entrenamientos.js',
  '/api/partidos': './partidos.js',
  '/api/convocatorias': './convocatorias.js',
};


async function handleApi(req, res) {
  const parsed = url.parse(req.url, true);
  // normalizar /api/auth/login -> /api/auth con query accion=login
  let pathname = parsed.pathname;
  // soportar /api/auth/login
  if (pathname.startsWith('/api/auth/')) {
    const accion = pathname.split('/').pop();
    parsed.query.accion = accion;
    pathname = '/api/auth';
    req.query = parsed.query;
  } else {
    req.query = parsed.query;
  }
  // body parse
  let body = '';
  await new Promise(r => { req.on('data', c => body += c); req.on('end', r); });
  if (body) {
    try { req.body = JSON.parse(body); } catch { req.body = {}; }
  } else req.body = {};

  const file = apiFiles[pathname];
  if (!file) {
    // intentar prefijo
    const key = Object.keys(apiFiles).find(k => pathname.startsWith(k));
    if (key) {
      const mod = await import(key.replace('/api/', './') + '.js');
      req.query = parsed.query;
      return mod.default(req, res);
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'API no encontrada: ' + pathname }));
  }
  const mod = await import(file);
  return mod.default(req, res);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (pathname.startsWith('/api/')) {
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader('Content-Type','application/json'); return res.end(JSON.stringify(obj)); };
    try { await handleApi(req, res); } catch(e){ console.error(e); res.statusCode=500; res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // No servir archivos estaticos - el frontend React corre por separado
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'No encontrado' }));
});

server.listen(PORT, () => {
  console.log(`✅ EFUSA V7 local en http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/jugadores`);
  if (!process.env.DATABASE_URL) console.log('⚠️  Define DATABASE_URL en .env o Entorno (ej: postgres://...)');
});
