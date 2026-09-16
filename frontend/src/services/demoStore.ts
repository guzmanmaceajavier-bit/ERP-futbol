const DEMO_KEY = 'erp_demo_mode';
const DATA_KEY = 'erp_demo_data';

let _idCounters: Record<string, number> = {};

function getCollection<T>(name: string): T[] {
  const data = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
  return data[name] || [];
}

function setCollection<T>(name: string, items: T[]) {
  const data = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
  data[name] = items;
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function nextId(collection: string): number {
  if (!_idCounters[collection]) {
    const items = getCollection(collection);
    _idCounters[collection] = items.length > 0 ? Math.max(...items.map((i: any) => i.id || 0)) + 1 : 1;
  }
  return _idCounters[collection]++;
}

function now() {
  return new Date().toISOString();
}

export function isDemoMode(): boolean {
  return localStorage.getItem(DEMO_KEY) === 'true';
}

export function setDemoMode(v: boolean) {
  localStorage.setItem(DEMO_KEY, v ? 'true' : 'false');
}

export function initDemoData() {
  if (getCollection('jugadores').length > 0) return;

  const cats = [
    { id: 1, nombre: 'Sub 17-18', tipo_genero: 'Mixta', mensualidad_base: 50000, profesor_id: null, profesor_nombre: null, total_jugadores: 4, activo: true, created_at: now() },
    { id: 2, nombre: 'Sub 16-15', tipo_genero: 'Masculino', mensualidad_base: 50000, profesor_id: null, profesor_nombre: null, total_jugadores: 5, activo: true, created_at: now() },
    { id: 3, nombre: 'Sub 14-13', tipo_genero: 'Masculino', mensualidad_base: 40000, profesor_id: null, profesor_nombre: null, total_jugadores: 3, activo: true, created_at: now() },
    { id: 4, nombre: 'Sub 12-11', tipo_genero: 'Femenino', mensualidad_base: 40000, profesor_id: null, profesor_nombre: null, total_jugadores: 4, activo: true, created_at: now() },
    { id: 5, nombre: 'Sub 10-9', tipo_genero: 'Mixta', mensualidad_base: 30000, profesor_id: null, profesor_nombre: null, total_jugadores: 3, activo: true, created_at: now() },
    { id: 6, nombre: 'Sub 8-7', tipo_genero: 'Mixta', mensualidad_base: 30000, profesor_id: null, profesor_nombre: null, total_jugadores: 2, activo: true, created_at: now() },
  ];

  const profesores = [
    { id: 1, nombre: 'Carlos Rodriguez', telefono: '3101234567', especialidad: 'Futbol 11', salario: 2000000, fecha_ingreso: '2024-01-15', activo: true },
    { id: 2, nombre: 'Maria Lopez', telefono: '3119876543', especialidad: 'Futbol femenino', salario: 1800000, fecha_ingreso: '2024-03-01', activo: true },
    { id: 3, nombre: 'Andres Martinez', telefono: '3125554444', especialidad: 'Formativas', salario: 1500000, fecha_ingreso: '2024-06-10', activo: true },
  ];

  const jugadores = [
    { id: 1, nombre: 'Santiago', apellidos: 'Garcia Perez', fecha_nacimiento: '2008-03-15', tipo_identificacion: 'Cedula', numero_identificacion: '1234567890', categoria: 'Sub 17-18', telefono: '3105551111', mensualidad: 50000, mensualidad_objetivo: 50000, genero: 'Masculino', tipo_beca: 'Normal', descuento_beca: 0, acudiente_nombre: 'Pedro Garcia', acudiente_telefono: '3105551112', whatsapp_opt_out: false, activo: true, created_at: now(), saldo_pendiente: 50000 },
    { id: 2, nombre: 'Valentina', apellidos: 'Rodriguez Diaz', fecha_nacimiento: '2009-07-22', tipo_identificacion: 'Cedula', numero_identificacion: '2345678901', categoria: 'Sub 16-15', telefono: '3115552222', mensualidad: 50000, mensualidad_objetivo: 50000, genero: 'Femenino', tipo_beca: 'Normal', descuento_beca: 0, acudiente_nombre: 'Ana Rodriguez', acudiente_telefono: '3115552223', whatsapp_opt_out: false, activo: true, created_at: now(), saldo_pendiente: 0 },
    { id: 3, nombre: 'Mateo', apellidos: 'Lopez Suarez', fecha_nacimiento: '2010-01-10', tipo_identificacion: 'Cedula', numero_identificacion: '3456789012', categoria: 'Sub 14-13', telefono: '3125553333', mensualidad: 40000, mensualidad_objetivo: 40000, genero: 'Masculino', tipo_beca: 'Becado 50%', descuento_beca: 20000, acudiente_nombre: 'Jorge Lopez', acudiente_telefono: '3125553334', whatsapp_opt_out: false, activo: true, created_at: now(), saldo_pendiente: 20000 },
    { id: 4, nombre: 'Camila', apellidos: 'Hernandez Ruiz', fecha_nacimiento: '2011-05-18', tipo_identificacion: 'Tarjeta', numero_identificacion: '4567890123', categoria: 'Sub 12-11', telefono: '3135554444', mensualidad: 40000, mensualidad_objetivo: 40000, genero: 'Femenino', tipo_beca: 'Normal', descuento_beca: 0, acudiente_nombre: 'Laura Hernandez', acudiente_telefono: '3135554445', whatsapp_opt_out: false, activo: true, created_at: now(), saldo_pendiente: 0 },
    { id: 5, nombre: 'Sebastian', apellidos: 'Torres Vargas', fecha_nacimiento: '2012-09-03', tipo_identificacion: 'Cedula', numero_identificacion: '5678901234', categoria: 'Sub 10-9', telefono: '3145555555', mensualidad: 30000, mensualidad_objetivo: 30000, genero: 'Masculino', tipo_beca: 'Becado 100%', descuento_beca: 30000, acudiente_nombre: 'Carlos Torres', acudiente_telefono: '3145555556', whatsapp_opt_out: true, activo: true, created_at: now(), saldo_pendiente: 0 },
    { id: 6, nombre: 'Isabella', apellidos: 'Martinez Cruz', fecha_nacimiento: '2008-11-25', tipo_identificacion: 'Cedula', numero_identificacion: '6789012345', categoria: 'Sub 17-18', telefono: '3155556666', mensualidad: 50000, mensualidad_objetivo: 50000, genero: 'Femenino', tipo_beca: 'Normal', descuento_beca: 0, acudiente_nombre: 'Roberto Martinez', acudiente_telefono: '3155556667', whatsapp_opt_out: false, activo: true, created_at: now(), saldo_pendiente: 0 },
    { id: 7, nombre: 'Daniel', apellidos: 'Gutierrez Palacios', fecha_nacimiento: '2010-04-12', tipo_identificacion: 'Cedula', numero_identificacion: '7890123456', categoria: 'Sub 14-13', telefono: '3165557777', mensualidad: 40000, mensualidad_objetivo: 40000, genero: 'Masculino', tipo_beca: 'Normal', descuento_beca: 0, acudiente_nombre: 'Patricia Gutierrez', acudiente_telefono: '3165557778', whatsapp_opt_out: false, activo: true, created_at: now(), saldo_pendiente: 40000 },
    { id: 8, nombre: 'Sofia', apellidos: 'Ramirez Ospina', fecha_nacimiento: '2011-08-30', tipo_identificacion: 'Cedula', numero_identificacion: '8901234567', categoria: 'Sub 12-11', telefono: '3175558888', mensualidad: 40000, mensualidad_objetivo: 40000, genero: 'Femenino', tipo_beca: 'Patrocinado', descuento_beca: 40000, acudiente_nombre: 'Fernando Ramirez', acudiente_telefono: '3175558889', whatsapp_opt_out: false, activo: true, created_at: now(), saldo_pendiente: 0 },
    { id: 9, nombre: 'Nicolas', apellidos: 'Morales Castano', fecha_nacimiento: '2013-02-14', tipo_identificacion: 'Cedula', numero_identificacion: '9012345678', categoria: 'Sub 8-7', telefono: '3185559999', mensualidad: 30000, mensualidad_objetivo: 30000, genero: 'Masculino', tipo_beca: 'Normal', descuento_beca: 0, acudiente_nombre: 'Diana Morales', acudiente_telefono: '3185559990', whatsapp_opt_out: false, activo: true, created_at: now(), saldo_pendiente: 30000 },
    { id: 10, nombre: 'Luciana', apellidos: 'Vargas Mejia', fecha_nacimiento: '2012-06-07', tipo_identificacion: 'Tarjeta', numero_identificacion: '0123456789', categoria: 'Sub 10-9', telefono: '3195550000', mensualidad: 30000, mensualidad_objetivo: 30000, genero: 'Femenino', tipo_beca: 'Normal', descuento_beca: 0, acudiente_nombre: 'Gloria Vargas', acudiente_telefono: '3195550001', whatsapp_opt_out: false, activo: false, created_at: now(), saldo_pendiente: 0 },
  ];

  const pagos = [
    { id: 1, jugador_id: 1, jugador: 'Santiago Garcia', jugador_telefono: '3105551111', jugador_categoria: 'Sub 17-18', monto: 50000, fecha: '2025-09-05', tipo: 'completo', observacion: 'Pago mensual septiembre', mes_pago: 'Septiembre 2025', cantidad_meses: 1, recibo_numero: 'REC-001', vencimiento: '2025-09-10', estado_pago: 'completo', saldo_pendiente: 0, created_at: now() },
    { id: 2, jugador_id: 3, jugador: 'Mateo Lopez', jugador_telefono: '3125553333', jugador_categoria: 'Sub 14-13', monto: 20000, fecha: '2025-09-08', tipo: 'abono', observacion: 'Abono mitad', mes_pago: 'Septiembre 2025', cantidad_meses: 1, recibo_numero: 'REC-002', vencimiento: '2025-09-10', estado_pago: 'abono', saldo_pendiente: 20000, created_at: now() },
    { id: 3, jugador_id: 6, jugador: 'Isabella Martinez', jugador_telefono: '3155556666', jugador_categoria: 'Sub 17-18', monto: 100000, fecha: '2025-09-01', tipo: 'adelantado', observacion: 'Pago adelantado 2 meses', mes_pago: 'Septiembre 2025', cantidad_meses: 2, recibo_numero: 'REC-003', vencimiento: '2025-11-10', estado_pago: 'completo', saldo_pendiente: 0, created_at: now() },
  ];

  const gastos = [
    { id: 1, concepto: 'Arriendo cancha', descripcion: 'Pago mensual cancha sintetica', monto: 800000, categoria: 'Arriendo', fecha: '2025-09-01', creado_por: 1, creado_por_nombre: 'Admin', created_at: now() },
    { id: 2, concepto: 'Nomina Carlos R.', descripcion: 'Pago quincenal septiembre', monto: 1000000, categoria: 'Nomina', fecha: '2025-09-15', creado_por: 1, creado_por_nombre: 'Admin', created_at: now() },
    { id: 3, concepto: 'Balones', descripcion: 'Compra 10 balones size 5', monto: 250000, categoria: 'Equipamiento', fecha: '2025-09-03', creado_por: 1, creado_por_nombre: 'Admin', created_at: now() },
  ];

  const inventario = [
    { id: 1, nombre: 'Balon size 5', categoria: 'Balones', stock: 15, stock_minimo: 8, costo_unitario: 25000, proveedor: 'Deportes SA' },
    { id: 2, nombre: 'Canesita deportiva', categoria: 'Uniformes', stock: 40, stock_minimo: 20, costo_unitario: 35000, proveedor: 'TextilFutbol' },
    { id: 3, nombre: 'Canilleras', categoria: 'Proteccion', stock: 30, stock_minimo: 15, costo_unitario: 15000, proveedor: 'Deportes SA' },
    { id: 4, nombre: 'Conos训练', categoria: 'Entrenamiento', stock: 25, stock_minimo: 10, costo_unitario: 5000, proveedor: 'SportsTech' },
  ];

  const alertas = [
    { id: 1, jugador_id: 3, jugador_nombre: 'Mateo Lopez', nombre: 'Deuda pendiente', categoria: 'Sub 14-13', telefono: '3125553333', pagado: 20000, deuda: 20000, mensualidad_objetivo: 40000, mes_abono: 'Septiembre 2025', tipo_alerta: 'ABONO', tipo: 'automatica', titulo: 'Abono pendiente', descartada: false, created_at: now() },
    { id: 2, jugador_id: 7, jugador_nombre: 'Daniel Gutierrez', nombre: 'Deuda total', categoria: 'Sub 14-13', telefono: '3165557777', deuda: 40000, mensualidad_objetivo: 40000, tipo_alerta: 'DEUDA', tipo: 'automatica', titulo: 'Pago vencido', descartada: false, created_at: now() },
    { id: 3, jugador_id: 9, jugador_nombre: 'Nicolas Morales', nombre: 'Sin pago', categoria: 'Sub 8-7', telefono: '3185559999', deuda: 30000, mensualidad_objetivo: 30000, tipo_alerta: 'DEUDA', tipo: 'automatica', titulo: 'Sin pago registrado', descartada: false, created_at: now() },
  ];

  const notas = [
    { id: 1, jugador_id: 1, nota: 'Muy buen desempeno en el partido de hoy', creado_por: 1, creador_nombre: 'Admin', created_at: now() },
    { id: 2, jugador_id: 4, nota: 'Falta asistencia esta semana', creado_por: 1, creador_nombre: 'Admin', created_at: now() },
  ];

  const bitacora = [
    { id: 1, fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'login', modulo: 'auth', detalle: 'Sesion iniciada' },
    { id: 2, fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'crear', modulo: 'jugadores', detalle: 'Jugador Santiago Garcia creado' },
  ];

  const config: Record<string, string> = {
    'escuela_nombre': 'Mi Escuela de Futbol',
    'escuela_direccion': 'Calle 123 #45-67',
    'escuela_telefono': '3001234567',
    'escuela_email': 'info@miescuela.com',
    'escuela_logo': '',
    'dia_pago': '5',
    'dia_mora': '10',
    'mes_actual': String(new Date().getMonth() + 1),
    'anio_actual': String(new Date().getFullYear()),
    'whatsapp_token': '',
    'whatsapp_number_id': '',
    'whatsapp_template_pago': 'Hola {nombre}, tu mensualidad de {mes} esta pendiente. Debes {deuda}.',
    'whatsapp_template_recordatorio': 'Hola {nombre}, te recordamos que tu pago vence el dia {vencimiento}.',
    'whatsapp_template_bienvenida': 'Bienvenido a {escuela} {nombre}! Tu categoria es {categoria}.',
    'backup_ultima_fecha': '',
    'sistema_modo': 'demo',
  };

  setCollection('categorias', cats);
  setCollection('profesores', profesores);
  setCollection('jugadores', jugadores);
  setCollection('pagos', pagos);
  setCollection('gastos', gastos);
  setCollection('inventario', inventario);
  setCollection('alertas', alertas);
  setCollection('notas', notas);
  setCollection('bitacora', bitacora);
  setCollection('config', Object.entries(config).map(([k, v]) => ({ key: k, value: v })));
  setCollection('caja', [
    { fecha: new Date().toISOString().slice(0, 10), saldo_inicial: 200000, total_ingresos: 170000, total_gastos: 2050000, saldo_final: 120000, estado: 'cerrada', abierta_por: 1, cerrada_por: 1 }
  ]);
}

function matchRoute(method: string, url: string, method2: string, pattern: RegExp): RegExpMatchArray | null {
  if (method !== method2) return null;
  return url.match(pattern);
}

export function demoHandle(method: string, url: string, body?: any): any {
  initDemoData();

  if (method === 'POST' && url === '/auth/login') {
    if (body?.username === 'admin' && body?.password === 'admin123') {
      const user = { id: 1, username: 'admin', nombre: 'Administrador', role: 'super_admin' as const };
      return { token: 'demo-token-123', usuario: user };
    }
    return { error: 'Credenciales incorrectas' };
  }

  if (method === 'GET' && url === '/auth/verify') {
    const user = { id: 1, username: 'admin', nombre: 'Administrador', role: 'super_admin' as const };
    return { valido: true, usuario: user };
  }

  const segments = url.split('?')[0].split('/').filter(Boolean);

  if (segments[0] === 'config' && method === 'GET') {
    const items = getCollection<{key: string; value: string}>('config');
    const map: Record<string, string> = {};
    items.forEach(i => { map[i.key] = i.value; });
    return map;
  }
  if (segments[0] === 'config' && method === 'PUT') {
    const items = getCollection<{key: string; value: string}>('config');
    Object.entries(body || {}).forEach(([k, v]) => {
      const idx = items.findIndex(i => i.key === k);
      if (idx >= 0) items[idx].value = String(v);
      else items.push({ key: k, value: String(v) });
    });
    setCollection('config', items);
    return items;
  }

  if (segments[0] === 'bitacora' && method === 'GET') {
    return getCollection('bitacora');
  }

  if (segments[0] === 'alertas' && method === 'GET') {
    return getCollection('alertas');
  }
  if (segments[0] === 'alertas' && method === 'POST') {
    const items = getCollection('alertas');
    items.push({ ...body, id: nextId('alertas'), created_at: now() });
    setCollection('alertas', items);
    return items[items.length - 1];
  }
  if (segments[0] === 'alertas' && method === 'PUT') {
    const items = getCollection<any>('alertas');
    const idx = items.findIndex((i: any) => i.id === body.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('alertas', items);
    return items[idx];
  }
  if (segments[0] === 'alertas' && method === 'DELETE') {
    const id = Number(segments[1]);
    let items = getCollection<any>('alertas');
    items = items.filter((i: any) => i.id !== id);
    setCollection('alertas', items);
    return { ok: true };
  }

  if (segments[0] === 'jugadores' && method === 'GET') {
    const items = getCollection<any>('jugadores');
    return items;
  }
  if (segments[0] === 'jugadores' && method === 'POST') {
    const items = getCollection<any>('jugadores');
    const newItem = { ...body, id: nextId('jugadores'), activo: true, created_at: now(), saldo_pendiente: 0, mensualidad: body.mensualidad || 0, mensualidad_objetivo: body.mensualidad_objetivo || 0, descuento_beca: body.descuento_beca || 0 };
    items.push(newItem);
    setCollection('jugadores', items);
    return newItem;
  }
  if (segments[0] === 'jugadores' && method === 'PUT') {
    const items = getCollection<any>('jugadores');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('jugadores', items);
    return items[idx];
  }
  if (segments[0] === 'jugadores' && method === 'DELETE') {
    let items = getCollection<any>('jugadores');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('jugadores', items);
    return { ok: true };
  }

  if (segments[0] === 'pagos' && method === 'GET') {
    return getCollection('pagos');
  }
  if (segments[0] === 'pagos' && method === 'POST') {
    const items = getCollection<any>('pagos');
    const newItem = { ...body, id: nextId('pagos'), created_at: now(), recibo_numero: 'REC-' + String(nextId('pagos')).padStart(3, '0') };
    items.push(newItem);
    setCollection('pagos', items);
    return newItem;
  }
  if (segments[0] === 'pagos' && method === 'PUT') {
    const items = getCollection<any>('pagos');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('pagos', items);
    return items[idx];
  }
  if (segments[0] === 'pagos' && method === 'DELETE') {
    let items = getCollection<any>('pagos');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('pagos', items);
    return { ok: true };
  }

  if (segments[0] === 'categorias' && method === 'GET') return getCollection('categorias');
  if (segments[0] === 'categorias' && method === 'POST') {
    const items = getCollection<any>('categorias');
    const newItem = { ...body, id: nextId('categorias'), activo: true, created_at: now(), total_jugadores: 0 };
    items.push(newItem);
    setCollection('categorias', items);
    return newItem;
  }
  if (segments[0] === 'categorias' && method === 'PUT') {
    const items = getCollection<any>('categorias');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('categorias', items);
    return items[idx];
  }
  if (segments[0] === 'categorias' && method === 'DELETE') {
    let items = getCollection<any>('categorias');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('categorias', items);
    return { ok: true };
  }

  if (segments[0] === 'profesores' && method === 'GET') return getCollection('profesores');
  if (segments[0] === 'profesores' && method === 'POST') {
    const items = getCollection<any>('profesores');
    const newItem = { ...body, id: nextId('profesores'), activo: true };
    items.push(newItem);
    setCollection('profesores', items);
    return newItem;
  }
  if (segments[0] === 'profesores' && method === 'PUT') {
    const items = getCollection<any>('profesores');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('profesores', items);
    return items[idx];
  }
  if (segments[0] === 'profesores' && method === 'DELETE') {
    let items = getCollection<any>('profesores');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('profesores', items);
    return { ok: true };
  }

  if (segments[0] === 'gastos' && method === 'GET') return getCollection('gastos');
  if (segments[0] === 'gastos' && method === 'POST') {
    const items = getCollection<any>('gastos');
    const newItem = { ...body, id: nextId('gastos'), created_at: now(), creado_por: 1, creado_por_nombre: 'Admin' };
    items.push(newItem);
    setCollection('gastos', items);
    return newItem;
  }
  if (segments[0] === 'gastos' && method === 'PUT') {
    const items = getCollection<any>('gastos');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('gastos', items);
    return items[idx];
  }
  if (segments[0] === 'gastos' && method === 'DELETE') {
    let items = getCollection<any>('gastos');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('gastos', items);
    return { ok: true };
  }

  if (segments[0] === 'inventario' && method === 'GET') return getCollection('inventario');
  if (segments[0] === 'inventario' && method === 'POST') {
    const items = getCollection<any>('inventario');
    const newItem = { ...body, id: nextId('inventario') };
    items.push(newItem);
    setCollection('inventario', items);
    return newItem;
  }
  if (segments[0] === 'inventario' && method === 'PUT') {
    const items = getCollection<any>('inventario');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('inventario', items);
    return items[idx];
  }
  if (segments[0] === 'inventario' && method === 'DELETE') {
    let items = getCollection<any>('inventario');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('inventario', items);
    return { ok: true };
  }

  if (segments[0] === 'notas' && method === 'GET') return getCollection('notas');
  if (segments[0] === 'notas' && method === 'POST') {
    const items = getCollection<any>('notas');
    const newItem = { ...body, id: nextId('notas'), created_at: now(), creado_por: 1, creador_nombre: 'Admin' };
    items.push(newItem);
    setCollection('notas', items);
    return newItem;
  }
  if (segments[0] === 'notas' && method === 'DELETE') {
    let items = getCollection<any>('notas');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('notas', items);
    return { ok: true };
  }

  if (segments[0] === 'caja' && method === 'GET') {
    const cajas = getCollection<any>('caja');
    const today = new Date().toISOString().slice(0, 10);
    const cajaHoy = cajas.find((c: any) => c.fecha === today);
    return {
      fecha: today,
      caja: cajaHoy || null,
      ingresos: { total: cajaHoy?.total_ingresos || 0, cnt: 0 },
      gastos: { total: cajaHoy?.total_gastos || 0, cnt: 0 },
      saldo: cajaHoy?.saldo_final || 0,
      estado: cajaHoy?.estado || 'cerrada'
    };
  }
  if (segments[0] === 'caja' && method === 'POST') {
    const items = getCollection<any>('caja');
    const today = new Date().toISOString().slice(0, 10);
    const idx = items.findIndex((c: any) => c.fecha === today);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...body };
    } else {
      items.push({ fecha: today, saldo_inicial: body?.saldo_inicial || 0, estado: 'abierta', ...body });
    }
    setCollection('caja', items);
    return items[idx >= 0 ? idx : items.length - 1];
  }

  if (segments[0] === 'reportes' && method === 'GET') {
    const pagos = getCollection<any>('pagos');
    const gastos = getCollection<any>('gastos');
    return { pagos, gastos, total_ingresos: pagos.reduce((s: number, p: any) => s + (p.monto || 0), 0), total_gastos: gastos.reduce((s: number, g: any) => s + (g.monto || 0), 0) };
  }

  if (segments[0] === 'entrenamientos' && method === 'GET') return getCollection('entrenamientos');
  if (segments[0] === 'entrenamientos' && method === 'POST') {
    const items = getCollection<any>('entrenamientos');
    const newItem = { ...body, id: nextId('entrenamientos'), created_at: now() };
    items.push(newItem);
    setCollection('entrenamientos', items);
    return newItem;
  }
  if (segments[0] === 'entrenamientos' && method === 'PUT') {
    const items = getCollection<any>('entrenamientos');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('entrenamientos', items);
    return items[idx];
  }
  if (segments[0] === 'entrenamientos' && method === 'DELETE') {
    let items = getCollection<any>('entrenamientos');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('entrenamientos', items);
    return { ok: true };
  }

  if (segments[0] === 'partidos' && method === 'GET') return getCollection('partidos');
  if (segments[0] === 'partidos' && method === 'POST') {
    const items = getCollection<any>('partidos');
    const newItem = { ...body, id: nextId('partidos'), created_at: now() };
    items.push(newItem);
    setCollection('partidos', items);
    return newItem;
  }
  if (segments[0] === 'partidos' && method === 'PUT') {
    const items = getCollection<any>('partidos');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('partidos', items);
    return items[idx];
  }
  if (segments[0] === 'partidos' && method === 'DELETE') {
    let items = getCollection<any>('partidos');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('partidos', items);
    return { ok: true };
  }

  if (segments[0] === 'convocatorias' && method === 'GET') return getCollection('convocatorias');
  if (segments[0] === 'convocatorias' && method === 'POST') {
    const items = getCollection<any>('convocatorias');
    const newItem = { ...body, id: nextId('convocatorias'), created_at: now() };
    items.push(newItem);
    setCollection('convocatorias', items);
    return newItem;
  }
  if (segments[0] === 'convocatorias' && method === 'PUT') {
    const items = getCollection<any>('convocatorias');
    const idx = items.findIndex((i: any) => i.id === Number(segments[1]));
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('convocatorias', items);
    return items[idx];
  }
  if (segments[0] === 'convocatorias' && method === 'DELETE') {
    let items = getCollection<any>('convocatorias');
    items = items.filter((i: any) => i.id !== Number(segments[1]));
    setCollection('convocatorias', items);
    return { ok: true };
  }

  if (segments[0] === 'asistencias' && method === 'GET') return getCollection('asistencias');
  if (segments[0] === 'asistencias' && method === 'POST') {
    const items = getCollection<any>('asistencias');
    const newItem = { ...body, id: nextId('asistencias'), created_at: now() };
    items.push(newItem);
    setCollection('asistencias', items);
    return newItem;
  }

  if (segments[0] === 'torneos' && method === 'GET') return getCollection('torneos');
  if (segments[0] === 'torneos' && method === 'POST') {
    const items = getCollection<any>('torneos');
    const newItem = { ...body, id: nextId('torneos'), created_at: now() };
    items.push(newItem);
    setCollection('torneos', items);
    return newItem;
  }

  if (segments[0] === 'periodos' && method === 'GET') return getCollection('periodos');
  if (segments[0] === 'periodos' && method === 'POST') {
    const items = getCollection<any>('periodos');
    const newItem = { ...body, id: nextId('periodos'), created_at: now() };
    items.push(newItem);
    setCollection('periodos', items);
    return newItem;
  }

  if (segments[0] === 'whatsapp' && method === 'POST') {
    return { ok: true, mensaje: 'Mensaje enviado (demo)' };
  }

  return { error: 'Endpoint no encontrado en modo demo' };
}
