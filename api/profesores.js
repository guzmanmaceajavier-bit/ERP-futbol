import { query, isDemoMode } from './_db.js';
import { load, save, nextId } from './_store.js';
import { authMiddleware } from './_auth.js';
import { registrarBitacora } from './_bitacora.js';

async function handler(req, res) {
  if(isDemoMode()){
    let profs=load('profesores');
    let gastos=load('gastos');
    if(req.method==='GET') return res.status(200).json(profs);
    if(req.method==='POST'){ const {nombre,telefono,especialidad,salario,fecha_ingreso}=req.body; if(!nombre) return res.status(400).json({error:'Nombre requerido'}); const p={id:nextId(profs), nombre, telefono:telefono||null, especialidad:especialidad||null, salario:Number(salario)||0, fecha_ingreso:fecha_ingreso||null, activo:true}; profs.push(p); save('profesores',profs); return res.status(201).json(p); }
    if(req.method==='PUT'){ const {id,nombre,telefono,especialidad,salario,activo}=req.body; const idx=profs.findIndex(x=>x.id===Number(id)); if(idx===-1) return res.status(404).json({error:'No encontrado'}); profs[idx]={...profs[idx], nombre, telefono, especialidad, salario:Number(salario), activo:activo!==false}; save('profesores',profs); return res.status(200).json(profs[idx]); }
    if(req.method==='DELETE'){ const id=Number(req.query.id); profs=profs.filter(x=>x.id!==id); save('profesores',profs); return res.status(200).json({mensaje:'Eliminado'}); }
    if(req.method==='PATCH'){ const {profesor_id,monto,fecha,observacion}=req.body; const g={id:nextId(gastos), concepto:'Nomina '+profesor_id, descripcion:observacion||'Pago nomina', monto:Number(monto), categoria:'Nomina', fecha:fecha||new Date().toISOString().split('T')[0], creado_por:req.usuario.id}; gastos.push(g); save('gastos',gastos); return res.status(201).json({profesor_id,monto,gastos_id:g.id}); }
    return res.status(405).json({error:'Metodo no permitido'});
  }
  try {
    if (req.method === 'GET') {
      const { rows } = await query('SELECT * FROM profesores ORDER BY activo DESC, nombre');
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const { nombre, telefono, especialidad, salario, fecha_ingreso } = req.body;
      if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
      const { rows } = await query(
        `INSERT INTO profesores (nombre, telefono, especialidad, salario, fecha_ingreso) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [nombre, telefono || null, especialidad || null, salario || 0, fecha_ingreso || null]
      );
      await registrarBitacora({ usuario: req.usuario, accion: 'CREAR', modulo: 'profesores', detalle: `Profesor ${nombre}`, req });
      return res.status(201).json(rows[0]);
    }
    if (req.method === 'PUT') {
      const { id, nombre, telefono, especialidad, salario, activo } = req.body;
      if (!id || !nombre) return res.status(400).json({ error: 'Datos incompletos' });
      const { rows } = await query(
        `UPDATE profesores SET nombre=$1, telefono=$2, especialidad=$3, salario=$4, activo=$5 WHERE id=$6 RETURNING *`,
        [nombre, telefono, especialidad, salario, activo, id]
      );
      await registrarBitacora({ usuario: req.usuario, accion: 'EDITAR', modulo: 'profesores', detalle: `Editó profesor #${id}`, req });
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await query('DELETE FROM profesores WHERE id=$1', [id]);
      await registrarBitacora({ usuario: req.usuario, accion: 'ELIMINAR', modulo: 'profesores', detalle: `Eliminó profe #${id}`, req });
      return res.status(200).json({ mensaje: 'Eliminado' });
    }
    // Pago nómina
    if (req.method === 'PATCH') {
      const { profesor_id, monto, fecha, observacion } = req.body;
      if (!profesor_id || !monto) return res.status(400).json({ error: 'profesor_id y monto requeridos' });
      const f = fecha || new Date().toISOString().split('T')[0];
      // Crear gasto automático
      const gasto = await query(
        `INSERT INTO gastos (concepto, descripcion, monto, categoria, fecha, creado_por) VALUES ($1,$2,$3,'Nómina',$4,$5) RETURNING id`,
        [`Nómina ${profesor_id}`, observacion || 'Pago nómina', monto, f, req.usuario.id]
      );
      const { rows } = await query(
        `INSERT INTO pagos_profesores (profesor_id, monto, fecha, observacion, gasto_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [profesor_id, monto, f, observacion || null, gasto.rows[0].id]
      );
      await registrarBitacora({ usuario: req.usuario, accion: 'NOMINA', modulo: 'profesores', detalle: `Nómina $${monto} profe #${profesor_id} -> gasto #${gasto.rows[0].id}`, req });
      return res.status(201).json(rows[0]);
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('Profesores API:', e);
    return res.status(500).json({ error: e.message });
  }
}

export default authMiddleware(handler);
