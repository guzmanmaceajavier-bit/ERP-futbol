import { query } from './_db.js';

export async function registrarBitacora({ usuario, accion, modulo, detalle, req }) {
  try {
    const ip = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'local';
    await query(
      `INSERT INTO bitacora (usuario_id, usuario_nombre, accion, modulo, detalle, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [usuario?.id || null, usuario?.username || 'anon', accion, modulo, detalle?.substring(0, 2000), ip]
    );
  } catch (e) {
    console.error('Bitácora error:', e.message);
  }
}
