import { query, isDemoMode } from './_db.js';
import { authMiddleware } from './_auth.js';
import { load, save, nextId } from './_store.js';

async function handler(req, res) {
  // MODO LOCAL
  if (isDemoMode()) {
    let jugadores = load('jugadores');
    if (req.method === 'GET') {
      const { genero, categoria } = req.query;
      let out = jugadores;
      if (genero) out = out.filter(j=>j.genero===genero);
      if (categoria) out = out.filter(j=>j.categoria===categoria);
      // calcular objetivo_real
      out = out.map(r=>{
        const base = Number(r.mensualidad_objetivo)||50000;
        const desc = Number(r.descuento_beca)||0;
        return {...r, objetivo_real: Math.round(base*(1-desc/100)) };
      });
      return res.status(200).json(out);
    }
    if (req.method === 'POST') {
      const { nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad, genero, tipo_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco } = req.body;
      if (!nombre || !categoria || !telefono) return res.status(400).json({ error: 'Nombre, categoría y teléfono requeridos' });
      let base = categoria.includes('17')||categoria.includes('16')?50000:categoria.includes('14')||categoria.includes('12')?40000:30000;
      let desc=0; if(tipo_beca==='Becado 50%') desc=50; else if(tipo_beca==='Becado 100%'||tipo_beca==='Patrocinado') desc=100;
      const j = { id: nextId(jugadores), nombre, apellidos:apellidos||'', fecha_nacimiento:fecha_nacimiento||null, tipo_identificacion:tipo_identificacion||null, numero_identificacion:numero_identificacion||null, categoria, telefono, mensualidad:Number(mensualidad)||0, mensualidad_objetivo:base, genero:genero||'Masculino', tipo_beca:tipo_beca||'Normal', descuento_beca:desc, acudiente_nombre:acudiente_nombre||null, acudiente_telefono:acudiente_telefono||null, acudiente_parentesco:acudiente_parentesco||null, proximo_vencimiento:new Date(Date.now()+30*24*3600000).toISOString().split('T')[0], saldo_pendiente:0, whatsapp_opt_out:false, activo:true, created_at:new Date().toISOString() };
      jugadores.push(j); save('jugadores', jugadores);
      return res.status(201).json(j);
    }
    if (req.method === 'PUT') {
      const id = Number(req.body.id || req.query.id);
      const idx = jugadores.findIndex(x=>x.id===id);
      if(idx===-1) return res.status(404).json({ error:'No encontrado'});
      const b=req.body;
      let desc=0; if(b.tipo_beca==='Becado 50%') desc=50; else if(b.tipo_beca==='Becado 100%'||b.tipo_beca==='Patrocinado') desc=100;
      jugadores[idx] = { ...jugadores[idx], nombre:b.nombre||jugadores[idx].nombre, apellidos:b.apellidos||'', categoria:b.categoria||jugadores[idx].categoria, telefono:b.telefono||jugadores[idx].telefono, mensualidad:Number(b.mensualidad ?? jugadores[idx].mensualidad), genero:b.genero||jugadores[idx].genero, tipo_beca:b.tipo_beca||jugadores[idx].tipo_beca, descuento_beca:desc, acudiente_nombre:b.acudiente_nombre||null, acudiente_telefono:b.acudiente_telefono||null, activo:b.activo!==false };
      save('jugadores', jugadores);
      return res.status(200).json(jugadores[idx]);
    }
    if (req.method === 'DELETE') {
      const id=Number(req.query.id); jugadores=jugadores.filter(x=>x.id!==id); save('jugadores', jugadores); return res.status(200).json({ mensaje:'Eliminado'});
    }
    return res.status(405).json({ error:'Método no permitido'});
  }

  // MODO NEON
  if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'Falta conexión a BD' });
  try {
    if (req.method === 'GET') {
      const { genero, categoria } = req.query;
      let sql = `SELECT id, nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad, mensualidad_objetivo, activo, genero, tipo_beca, descuento_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco, proximo_vencimiento, saldo_pendiente, whatsapp_opt_out, foto_url, created_at FROM jugadores WHERE 1=1`;
      const params=[];
      if(genero){params.push(genero); sql+=` AND genero = $${params.length}`;}
      if(categoria){params.push(categoria); sql+=` AND categoria = $${params.length}`;}
      sql+=` ORDER BY created_at DESC`;
      const result=await query(sql, params);
      const rows=result.rows.map(r=>{ const base=Number(r.mensualidad_objetivo)||50000; const desc=Number(r.descuento_beca)||0; return {...r, objetivo_real:Math.round(base*(1-desc/100))}; });
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const { nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad, genero, tipo_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco } = req.body;
      if (!nombre || !categoria || !telefono) return res.status(400).json({ error: 'Nombre, categoría y teléfono son obligatorios' });
      const catCheck=await query('SELECT mensualidad_base FROM categorias WHERE nombre=$1',[categoria]);
      let base=50000; if(catCheck.rows[0]) base=Number(catCheck.rows[0].mensualidad_base); else base=categoria.includes('17')||categoria.includes('16')?50000:categoria.includes('14')||categoria.includes('12')?40000:30000;
      let descuento=0; if(tipo_beca==='Becado 50%') descuento=50; else if(tipo_beca==='Becado 100%'||tipo_beca==='Patrocinado') descuento=100;
      const result=await query(`INSERT INTO jugadores (nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad, activo, mensualidad_objetivo, genero, tipo_beca, descuento_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco, saldo_pendiente, proximo_vencimiento) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,[nombre, apellidos||'', fecha_nacimiento||null, tipo_identificacion||null, numero_identificacion||null, categoria, telefono, Number(mensualidad)||0, base, genero||'Masculino', tipo_beca||'Normal', descuento, acudiente_nombre||null, acudiente_telefono||null, acudiente_parentesco||null, 0, new Date(Date.now()+30*24*3600000).toISOString().split('T')[0]]);
      return res.status(201).json(result.rows[0]);
    }
    if (req.method === 'PUT') {
      const id=req.body.id||req.query.id;
      const { nombre, apellidos, fecha_nacimiento, tipo_identificacion, numero_identificacion, categoria, telefono, mensualidad, activo, genero, tipo_beca, acudiente_nombre, acudiente_telefono, acudiente_parentesco, whatsapp_opt_out } = req.body;
      if (!id||!nombre||!categoria||!telefono) return res.status(400).json({ error: 'Datos incompletos'});
      let descuento=0; if(tipo_beca==='Becado 50%') descuento=50; else if(tipo_beca==='Becado 100%'||tipo_beca==='Patrocinado') descuento=100;
      const catCheck=await query('SELECT mensualidad_base FROM categorias WHERE nombre=$1',[categoria]);
      let base=Number(catCheck.rows[0]?.mensualidad_base)||50000;
      const result=await query(`UPDATE jugadores SET nombre=$1, apellidos=$2, fecha_nacimiento=$3, tipo_identificacion=$4, numero_identificacion=$5, categoria=$6, telefono=$7, mensualidad=$8, activo=$9, genero=$10, tipo_beca=$11, descuento_beca=$12, acudiente_nombre=$13, acudiente_telefono=$14, acudiente_parentesco=$15, whatsapp_opt_out=$16, mensualidad_objetivo=$17 WHERE id=$18 RETURNING *`,[nombre, apellidos||'', fecha_nacimiento||null, tipo_identificacion||null, numero_identificacion||null, categoria, telefono, Number(mensualidad)||0, activo!==false, genero||'Masculino', tipo_beca||'Normal', descuento, acudiente_nombre||null, acudiente_telefono||null, acudiente_parentesco||null, !!whatsapp_opt_out, base, id]);
      if(result.rows.length===0) return res.status(404).json({ error:'No encontrado'});
      return res.status(200).json(result.rows[0]);
    }
    if (req.method === 'DELETE') { const {id}=req.query; if(!id) return res.status(400).json({ error:'Falta ID'}); await query('DELETE FROM jugadores WHERE id=$1',[id]); return res.status(200).json({ mensaje:'Eliminado'}); }
    return res.status(405).json({ error:'Método no permitido'});
  } catch(e){ return res.status(500).json({ error:e.message}); }
}

export default authMiddleware(handler);
