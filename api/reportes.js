import { query, isDemoMode } from './_db.js';
import { load } from './_store.js';
import { authMiddleware } from './_auth.js';

async function handler(req, res) {
  if (isDemoMode()) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo no permitido' });
    const { tipo } = req.query;
    const jugadores = load('jugadores');
    const pagos = load('pagos');
    if (tipo === 'recaudado-por-mes') {
      const map={}; pagos.forEach(p=>{ const m=(p.fecha||'').slice(0,7); if(!m) return; map[m]=(map[m]||0)+Number(p.monto); });
      const rows=Object.entries(map).map(([mes,total])=>({mes,total,cantidad:1})).sort((a,b)=>b.mes.localeCompare(a.mes)).slice(0,12);
      return res.status(200).json(rows);
    }
    if (tipo === 'estado-cuenta' || tipo === 'recaudado-por-categoria') {
      const grupos={}; jugadores.forEach(j=>{ const c=j.categoria||'Sin'; if(!grupos[c]) grupos[c]={categoria:c,total:0,al_dia:0}; grupos[c].total++; const base=Number(j.mensualidad_objetivo)||50000; const desc=Number(j.descuento_beca)||0; const obj=Math.round(base*(1-desc/100)); if(Number(j.mensualidad)>=obj) grupos[c].al_dia++; });
      return res.status(200).json(Object.values(grupos));
    }
    if (tipo === 'exportar-completo') return res.status(200).json({ jugadores: jugadores, pagos: pagos, exportado: new Date().toISOString() });
    return res.status(200).json([]);
  }
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
    const { tipo, fecha_inicio, fecha_fin } = req.query;

    if (tipo === 'recaudado-por-mes') {
      const { rows } = await query(`
        SELECT TO_CHAR(fecha, 'YYYY-MM') AS mes, SUM(monto) AS total, COUNT(*) AS cantidad
        FROM pagos
        WHERE ($1 = '' OR fecha >= $1) AND ($2 = '' OR fecha <= $2)
        GROUP BY mes ORDER BY mes DESC LIMIT 12
      `, [fecha_inicio || '', fecha_fin || '']);
      return res.status(200).json(rows);
    }

    if (tipo === 'recaudado-por-categoria') {
      const { rows } = await query(`
        SELECT j.categoria, SUM(p.monto) AS total, COUNT(p.id) AS cantidad
        FROM pagos p JOIN jugadores j ON j.id = p.jugador_id
        WHERE ($1 = '' OR p.fecha >= $1) AND ($2 = '' OR p.fecha <= $2)
        GROUP BY j.categoria ORDER BY total DESC
      `, [fecha_inicio || '', fecha_fin || '']);
      return res.status(200).json(rows);
    }

    if (tipo === 'estado-cuenta') {
      const { rows } = await query(`
        SELECT categoria, COUNT(*) AS total,
               SUM(CASE WHEN mensualidad >= mensualidad_objetivo THEN 1 ELSE 0 END) AS al_dia,
               ROUND(AVG(mensualidad)) AS promedio_pagado
        FROM jugadores WHERE activo = true GROUP BY categoria ORDER BY categoria
      `);
      return res.status(200).json(rows);
    }

    if (tipo === 'exportar-completo') {
      const jugadores = await query('SELECT * FROM jugadores ORDER BY id');
      const pagos = await query('SELECT p.*, j.nombre AS jugador_nombre FROM pagos p JOIN jugadores j ON j.id = p.jugador_id ORDER BY p.id');
      return res.status(200).json({ jugadores: jugadores.rows, pagos: pagos.rows, exportado: new Date().toISOString() });
    }

    return res.status(400).json({ error: 'Tipo de reporte no válido' });
  } catch (error) {
    console.error('Reportes API:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default authMiddleware(handler);
