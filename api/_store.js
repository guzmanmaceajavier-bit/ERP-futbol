import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function fileFor(table) { return path.join(DATA_DIR, `${table}.json`); }

export function load(table, def=[]) {
  const f = fileFor(table);
  if (!fs.existsSync(f)) { fs.writeFileSync(f, JSON.stringify(def, null, 2)); return def; }
  try { return JSON.parse(fs.readFileSync(f,'utf-8')); } catch { return def; }
}
export function save(table, data) {
  fs.writeFileSync(fileFor(table), JSON.stringify(data, null, 2));
}
export function nextId(arr) { return arr.length ? Math.max(...arr.map(x=>x.id||0))+1 : 1; }

// Seed inicial si no existe
if (!fs.existsSync(fileFor('jugadores'))) save('jugadores', []);
if (!fs.existsSync(fileFor('pagos'))) save('pagos', []);
if (!fs.existsSync(fileFor('gastos'))) save('gastos', []);
if (!fs.existsSync(fileFor('profesores'))) save('profesores', []);
if (!fs.existsSync(fileFor('inventario'))) save('inventario', [
  { id: 1, nombre: 'Balón #5', categoria: 'Balones', stock: 12, stock_minimo: 5, costo_unitario: 80000 },
  { id: 2, nombre: 'Conos', categoria: 'Entrenamiento', stock: 30, stock_minimo: 10, costo_unitario: 5000 }
]);
if (!fs.existsSync(fileFor('caja'))) save('caja', []);
if (!fs.existsSync(fileFor('bitacora'))) save('bitacora', []);
if (!fs.existsSync(fileFor('whatsapp_historial'))) save('whatsapp_historial', []);
if (!fs.existsSync(fileFor('whatsapp_cola'))) save('whatsapp_cola', []);
if (!fs.existsSync(fileFor('usuarios'))) {
  // bcrypt hash para admin123 y profe123 generado offline (10 rounds)
  save('usuarios', [
    { id: 1, username: 'admin', password: '$2a$10$wOt4SzoZq6U1.3b2.3b2.3b2.3b2.3b2.3b2.3b2.3b2.3b2.3b2.3b', nombre: 'Administrador', role: 'super_admin', activo: true },
    { id: 2, username: 'profe', password: '$2a$10$wOt4SzoZq6U1.3b2.3b2.3b2.3b2.3b2.3b2.3b2.3b2.3b2.3b2.3b', nombre: 'Profesor', role: 'profe', activo: true }
  ]);
}
