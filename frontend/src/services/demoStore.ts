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

function parseIdFromUrl(url: string, body?: any): number {
  if (body?.id) return Number(body.id);
  const match = url.match(/[?&]id=(\d+)/);
  if (match) return Number(match[1]);
  return NaN;
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
    { id: 4, nombre: 'Conos', categoria: 'Entrenamiento', stock: 25, stock_minimo: 10, costo_unitario: 5000, proveedor: 'SportsTech' },
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

  const periodos = [
    { id: 1, jugador_id: 1, jugador_nombre: 'Santiago Garcia', categoria: 'Sub 17-18', anio: 2025, mes: 9, objetivo: 50000, pagado: 50000, estado: 'pagado', notas: '', created_at: now() },
    { id: 2, jugador_id: 3, jugador_nombre: 'Mateo Lopez', categoria: 'Sub 14-13', anio: 2025, mes: 9, objetivo: 40000, pagado: 20000, estado: 'abono', notas: '', created_at: now() },
    { id: 3, jugador_id: 7, jugador_nombre: 'Daniel Gutierrez', categoria: 'Sub 14-13', anio: 2025, mes: 9, objetivo: 40000, pagado: 0, estado: 'pendiente', notas: '', created_at: now() },
    { id: 4, jugador_id: 9, jugador_nombre: 'Nicolas Morales', categoria: 'Sub 8-7', anio: 2025, mes: 9, objetivo: 30000, pagado: 0, estado: 'pendiente', notas: '', created_at: now() },
  ];

  const whatsapp_plantillas = [
    { codigo: 'pago_pendiente', nombre: 'Pago pendiente', mensaje: 'Hola {nombre}, tu mensualidad de {mes} esta pendiente. Debes {deuda}.', aprobada_meta: true },
    { codigo: 'recordatorio', nombre: 'Recordatorio de pago', mensaje: 'Hola {nombre}, te recordamos que tu pago vence el dia {vencimiento}.', aprobada_meta: true },
    { codigo: 'bienvenida', nombre: 'Bienvenida', mensaje: 'Bienvenido a {escuela} {nombre}! Tu categoria es {categoria}.', aprobada_meta: false },
    { codigo: 'descuento', nombre: 'Promocion', mensaje: 'Hola {nombre}, tenemos una promocion especial para ti!', aprobada_meta: false },
  ];

  const whatsapp_historial = [
    { id: 1, jugador_id: 1, jugador_nombre: 'Santiago Garcia', telefono: '3105551111', tipo: 'pago_pendiente', mensaje: 'Hola Santiago, tu mensualidad de Septiembre esta pendiente. Debes $50.000.', estado: 'enviado', fecha: '2025-09-05T10:00:00Z' },
    { id: 2, jugador_id: 7, jugador_nombre: 'Daniel Gutierrez', telefono: '3165557777', tipo: 'pago_pendiente', mensaje: 'Hola Daniel, tu mensualidad de Septiembre esta pendiente. Debes $40.000.', estado: 'enviado', fecha: '2025-09-08T14:00:00Z' },
    { id: 3, jugador_id: 9, jugador_nombre: 'Nicolas Morales', telefono: '3185559999', tipo: 'recordatorio', mensaje: 'Hola Nicolas, te recordamos que tu pago vence el dia 10.', estado: 'error', fecha: '2025-09-09T09:00:00Z' },
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
  setCollection('periodos', periodos);
  setCollection('entrenamientos', []);
  setCollection('partidos', []);
  setCollection('convocatorias', []);
  setCollection('asistencias', []);
  setCollection('torneos', []);
  setCollection('saldos_favor', []);
  setCollection('pago_periodos', []);
  setCollection('config', Object.entries(config).map(([k, v]) => ({ key: k, value: v })));
  setCollection('caja', [
    { fecha: new Date().toISOString().slice(0, 10), saldo_inicial: 200000, total_ingresos: 170000, total_gastos: 2050000, saldo_final: 120000, estado: 'cerrada', abierta_por: 1, cerrada_por: 1 }
  ]);
}

export function demoHandle(method: string, url: string, body?: any): any {
  initDemoData();

  if (method === 'POST' && url === '/auth/login') {
    if (body?.username === 'admin' && body?.password === 'admin123') {
      const user = { id: 1, username: 'admin', nombre: 'Administrador', role: 'super_admin' as const };
      return { token: 'demo-token-123', usuario: user };
    }
    throw new Error('Credenciales incorrectas');
  }

  if (method === 'GET' && url === '/auth/verify') {
    const user = { id: 1, username: 'admin', nombre: 'Administrador', role: 'super_admin' as const };
    return { valido: true, usuario: user };
  }

  const urlPath = url.split('?')[0].split('/').filter(Boolean);
  const qs = url.includes('?') ? url.split('?')[1] : '';

  const seg0 = urlPath[0];

  if (seg0 === 'config' && method === 'GET') {
    const items = getCollection<{key: string; value: string}>('config');
    const map: Record<string, string> = {};
    items.forEach(i => { map[i.key] = i.value; });
    return map;
  }
  if (seg0 === 'config' && method === 'PUT') {
    const items = getCollection<{key: string; value: string}>('config');
    Object.entries(body || {}).forEach(([k, v]) => {
      const idx = items.findIndex(i => i.key === k);
      if (idx >= 0) items[idx].value = String(v);
      else items.push({ key: k, value: String(v) });
    });
    setCollection('config', items);
    const map: Record<string, string> = {};
    items.forEach(i => { map[i.key] = i.value; });
    return map;
  }

  if (seg0 === 'bitacora' && method === 'GET') return getCollection('bitacora');

  if (seg0 === 'alertas' && method === 'GET') return getCollection('alertas');
  if (seg0 === 'alertas' && method === 'POST') {
    const items = getCollection<any>('alertas');
    const newItem = { ...body, id: nextId('alertas'), created_at: now() };
    items.push(newItem);
    setCollection('alertas', items);
    return newItem;
  }
  if (seg0 === 'alertas' && method === 'PUT') {
    const items = getCollection<any>('alertas');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('alertas', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'alertas' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('alertas');
    items = items.filter((i: any) => i.id !== id);
    setCollection('alertas', items);
    return { ok: true };
  }

  if (seg0 === 'jugadores' && method === 'GET') return getCollection('jugadores');
  if (seg0 === 'jugadores' && method === 'POST') {
    const items = getCollection<any>('jugadores');
    const newItem = { ...body, id: nextId('jugadores'), activo: true, created_at: now(), saldo_pendiente: body.saldo_pendiente || 0, mensualidad: body.mensualidad || 0, mensualidad_objetivo: body.mensualidad_objetivo || 0, descuento_beca: body.descuento_beca || 0 };
    items.push(newItem);
    setCollection('jugadores', items);
    return newItem;
  }
  if (seg0 === 'jugadores' && method === 'PUT') {
    const items = getCollection<any>('jugadores');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('jugadores', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'jugadores' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('jugadores');
    items = items.filter((i: any) => i.id !== id);
    setCollection('jugadores', items);
    return { ok: true };
  }

  if (seg0 === 'pagos' && method === 'GET') return getCollection('pagos');
  if (seg0 === 'pagos' && method === 'POST') {
    const items = getCollection<any>('pagos');
    const newItem = { ...body, id: nextId('pagos'), created_at: now(), recibo_numero: body.recibo_numero || 'REC-' + String(nextId('pagos')).padStart(3, '0') };
    items.push(newItem);
    setCollection('pagos', items);
    return newItem;
  }
  if (seg0 === 'pagos' && method === 'PUT') {
    const items = getCollection<any>('pagos');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('pagos', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'pagos' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('pagos');
    items = items.filter((i: any) => i.id !== id);
    setCollection('pagos', items);
    return { ok: true };
  }

  if (seg0 === 'categorias' && method === 'GET') {
    const cats = getCollection<any>('categorias');
    const profs = getCollection<any>('profesores');
    const profMap: Record<number, string> = {};
    profs.forEach((p: any) => { profMap[p.id] = p.nombre; });
    return cats.map((c: any) => ({
      ...c,
      profesor_nombre: c.profesor_id ? (profMap[c.profesor_id] || null) : null,
    }));
  }
  if (seg0 === 'categorias' && method === 'POST') {
    const items = getCollection<any>('categorias');
    const newItem = { ...body, id: nextId('categorias'), activo: true, created_at: now(), total_jugadores: 0 };
    items.push(newItem);
    setCollection('categorias', items);
    return newItem;
  }
  if (seg0 === 'categorias' && method === 'PUT') {
    const items = getCollection<any>('categorias');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('categorias', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'categorias' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('categorias');
    items = items.filter((i: any) => i.id !== id);
    setCollection('categorias', items);
    return { ok: true };
  }

  if (seg0 === 'profesores' && method === 'GET') return getCollection('profesores');
  if (seg0 === 'profesores' && method === 'POST') {
    const items = getCollection<any>('profesores');
    const newItem = { ...body, id: nextId('profesores'), activo: true };
    items.push(newItem);
    setCollection('profesores', items);
    return newItem;
  }
  if (seg0 === 'profesores' && method === 'PUT') {
    const items = getCollection<any>('profesores');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('profesores', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'profesores' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('profesores');
    items = items.filter((i: any) => i.id !== id);
    setCollection('profesores', items);
    return { ok: true };
  }

  if (seg0 === 'gastos' && method === 'GET') return getCollection('gastos');
  if (seg0 === 'gastos' && method === 'POST') {
    const items = getCollection<any>('gastos');
    const newItem = { ...body, id: nextId('gastos'), created_at: now(), creado_por: 1, creado_por_nombre: 'Admin' };
    items.push(newItem);
    setCollection('gastos', items);
    return newItem;
  }
  if (seg0 === 'gastos' && method === 'PUT') {
    const items = getCollection<any>('gastos');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('gastos', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'gastos' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('gastos');
    items = items.filter((i: any) => i.id !== id);
    setCollection('gastos', items);
    return { ok: true };
  }

  if (seg0 === 'inventario' && method === 'GET') return getCollection('inventario');
  if (seg0 === 'inventario' && method === 'POST') {
    const items = getCollection<any>('inventario');
    const newItem = { ...body, id: nextId('inventario') };
    items.push(newItem);
    setCollection('inventario', items);
    return newItem;
  }
  if (seg0 === 'inventario' && method === 'PUT') {
    const items = getCollection<any>('inventario');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('inventario', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'inventario' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('inventario');
    items = items.filter((i: any) => i.id !== id);
    setCollection('inventario', items);
    return { ok: true };
  }

  if (seg0 === 'notas' && method === 'GET') return getCollection('notas');
  if (seg0 === 'notas' && method === 'POST') {
    const items = getCollection<any>('notas');
    const newItem = { ...body, id: nextId('notas'), created_at: now(), creado_por: 1, creador_nombre: 'Admin' };
    items.push(newItem);
    setCollection('notas', items);
    return newItem;
  }
  if (seg0 === 'notas' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('notas');
    items = items.filter((i: any) => i.id !== id);
    setCollection('notas', items);
    return { ok: true };
  }

  if (seg0 === 'caja' && method === 'GET') {
    const cajas = getCollection<any>('caja');
    const today = new Date().toISOString().slice(0, 10);
    const cajaHoy = cajas.find((c: any) => c.fecha === today);
    const allPagos = getCollection<any>('pagos');
    const allGastos = getCollection<any>('gastos');
    const todayPagos = allPagos.filter((p: any) => p.fecha === today);
    const todayGastos = allGastos.filter((g: any) => g.fecha === today);
    const totalIngresos = todayPagos.reduce((s: number, p: any) => s + (p.monto || 0), 0);
    const totalGastos = todayGastos.reduce((s: number, g: any) => s + (g.monto || 0), 0);
    return {
      fecha: today,
      caja: cajaHoy || null,
      ingresos: { total: totalIngresos || cajaHoy?.total_ingresos || 0, cnt: todayPagos.length },
      gastos: { total: totalGastos || cajaHoy?.total_gastos || 0, cnt: todayGastos.length },
      saldo: cajaHoy?.saldo_final || (cajaHoy?.saldo_inicial || 0) + totalIngresos - totalGastos,
      estado: cajaHoy?.estado || 'cerrada'
    };
  }
  if (seg0 === 'caja' && method === 'POST') {
    const items = getCollection<any>('caja');
    const today = new Date().toISOString().slice(0, 10);
    const idx = items.findIndex((c: any) => c.fecha === today);
    const accion = body?.accion;

    if (accion === 'abrir') {
      const entry = {
        fecha: today,
        saldo_inicial: body.saldo_inicial || 0,
        total_ingresos: 0,
        total_gastos: 0,
        saldo_final: body.saldo_inicial || 0,
        estado: 'abierta',
        abierta_por: 1,
      };
      if (idx >= 0) items[idx] = { ...items[idx], ...entry };
      else items.push(entry);
      setCollection('caja', items);
      return entry;
    }

    if (accion === 'cerrar') {
      if (idx >= 0) {
        const caja = items[idx];
        caja.estado = 'cerrada';
        caja.cerrada_por = 1;
        caja.saldo_final = (caja.saldo_inicial || 0) + (caja.total_ingresos || 0) - (caja.total_gastos || 0);
        setCollection('caja', items);
        return caja;
      }
      setCollection('caja', items);
      return { fecha: today, estado: 'cerrada', saldo_final: 0 };
    }

    if (accion === 'desbloquear') {
      if (idx >= 0) {
        items[idx].estado = 'abierta';
        setCollection('caja', items);
        return items[idx];
      }
      setCollection('caja', items);
      return { fecha: today, estado: 'abierta' };
    }

    if (idx >= 0) {
      items[idx] = { ...items[idx], ...body };
    } else {
      items.push({ fecha: today, saldo_inicial: body?.saldo_inicial || 0, estado: 'abierta', ...body });
    }
    setCollection('caja', items);
    return items[idx >= 0 ? idx : items.length - 1];
  }

  if (seg0 === 'reportes' && method === 'GET') {
    const params = new URLSearchParams(qs);
    const tipo = params.get('tipo');
    const allPagos = getCollection<any>('pagos');
    const allGastos = getCollection<any>('gastos');
    const allJugadores = getCollection<any>('jugadores');

    if (tipo === 'recaudado-por-mes') {
      const meses: Record<string, { total: number; cantidad: number }> = {};
      allPagos.forEach((p: any) => {
        const key = p.mes_pago || 'Sin mes';
        if (!meses[key]) meses[key] = { total: 0, cantidad: 0 };
        meses[key].total += p.monto || 0;
        meses[key].cantidad += 1;
      });
      return Object.entries(meses).map(([mes, data]) => ({ mes, ...data }));
    }

    if (tipo === 'recaudado-por-categoria') {
      const cats: Record<string, { total: number; al_dia: number }> = {};
      allPagos.forEach((p: any) => {
        const cat = p.jugador_categoria || 'Sin categoria';
        if (!cats[cat]) cats[cat] = { total: 0, al_dia: 0 };
        cats[cat].total += p.monto || 0;
      });
      allJugadores.forEach((j: any) => {
        const cat = j.categoria || 'Sin categoria';
        if (!cats[cat]) cats[cat] = { total: 0, al_dia: 0 };
        if (!j.saldo_pendiente || j.saldo_pendiente === 0) cats[cat].al_dia += 1;
      });
      return Object.entries(cats).map(([categoria, data]) => ({ categoria, ...data }));
    }

    if (tipo === 'estado-cuenta') {
      const cats: Record<string, { total: number; al_dia: number }> = {};
      allJugadores.forEach((j: any) => {
        const cat = j.categoria || 'Sin categoria';
        if (!cats[cat]) cats[cat] = { total: 0, al_dia: 0 };
        cats[cat].total += j.saldo_pendiente || 0;
        if (!j.saldo_pendiente || j.saldo_pendiente === 0) cats[cat].al_dia += 1;
      });
      return Object.entries(cats).map(([categoria, data]) => ({ categoria, ...data }));
    }

    return { pagos: allPagos, gastos: allGastos, total_ingresos: allPagos.reduce((s: number, p: any) => s + (p.monto || 0), 0), total_gastos: allGastos.reduce((s: number, g: any) => s + (g.monto || 0), 0) };
  }

  if (seg0 === 'entrenamientos' && method === 'GET') return getCollection('entrenamientos');
  if (seg0 === 'entrenamientos' && method === 'POST') {
    const items = getCollection<any>('entrenamientos');
    const newItem = { ...body, id: nextId('entrenamientos'), created_at: now() };
    items.push(newItem);
    setCollection('entrenamientos', items);
    return newItem;
  }
  if (seg0 === 'entrenamientos' && method === 'PUT') {
    const items = getCollection<any>('entrenamientos');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('entrenamientos', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'entrenamientos' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('entrenamientos');
    items = items.filter((i: any) => i.id !== id);
    setCollection('entrenamientos', items);
    return { ok: true };
  }

  if (seg0 === 'partidos' && method === 'GET') return getCollection('partidos');
  if (seg0 === 'partidos' && method === 'POST') {
    const items = getCollection<any>('partidos');
    const newItem = { ...body, id: nextId('partidos'), created_at: now() };
    items.push(newItem);
    setCollection('partidos', items);
    return newItem;
  }
  if (seg0 === 'partidos' && method === 'PUT') {
    const items = getCollection<any>('partidos');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('partidos', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'partidos' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('partidos');
    items = items.filter((i: any) => i.id !== id);
    setCollection('partidos', items);
    return { ok: true };
  }

  if (seg0 === 'convocatorias' && method === 'GET') return getCollection('convocatorias');
  if (seg0 === 'convocatorias' && method === 'POST') {
    const items = getCollection<any>('convocatorias');
    const newItem = { ...body, id: nextId('convocatorias'), created_at: now() };
    items.push(newItem);
    setCollection('convocatorias', items);
    return newItem;
  }
  if (seg0 === 'convocatorias' && method === 'PUT') {
    const items = getCollection<any>('convocatorias');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('convocatorias', items);
    return items[idx] || { ok: true };
  }
  if (seg0 === 'convocatorias' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('convocatorias');
    items = items.filter((i: any) => i.id !== id);
    setCollection('convocatorias', items);
    return { ok: true };
  }

  if (seg0 === 'asistencias' && method === 'GET') return getCollection('asistencias');
  if (seg0 === 'asistencias' && method === 'POST') {
    const items = getCollection<any>('asistencias');
    const newItem = { ...body, id: nextId('asistencias'), created_at: now() };
    items.push(newItem);
    setCollection('asistencias', items);
    return newItem;
  }

  if (seg0 === 'torneos' && method === 'GET') return getCollection('torneos');
  if (seg0 === 'torneos' && method === 'POST') {
    const items = getCollection<any>('torneos');
    const newItem = { ...body, id: nextId('torneos'), created_at: now() };
    items.push(newItem);
    setCollection('torneos', items);
    return newItem;
  }

  if (seg0 === 'periodos' && method === 'GET') {
    const params = new URLSearchParams(qs);
    if (params.get('resumen') === 'true') {
      const periodos = getCollection<any>('periodos');
      const jugadores = getCollection<any>('jugadores');
      const anio = params.get('anio') ? Number(params.get('anio')) : undefined;
      const jugadoresMap: Record<number, any> = {};
      jugadores.forEach((j: any) => { jugadoresMap[j.id] = j; });
      const resumen: Record<number, any> = {};
      periodos.forEach((p: any) => {
        if (anio && p.anio !== anio) return;
        if (!resumen[p.jugador_id]) {
          const j = jugadoresMap[p.jugador_id];
          resumen[p.jugador_id] = {
            jugador_id: p.jugador_id,
            jugador_nombre: p.jugador_nombre || (j ? `${j.nombre} ${j.apellidos}` : `Jugador #${p.jugador_id}`),
            categoria: p.categoria || j?.categoria || '',
            periodos: []
          };
        }
        resumen[p.jugador_id].periodos.push(p);
      });
      return Object.values(resumen);
    }
    return getCollection('periodos');
  }
  if (seg0 === 'periodos' && method === 'POST') {
    const items = getCollection<any>('periodos');
    if (body?.accion === 'generar') {
      const jugadores = getCollection<any>('jugadores');
      const j = jugadores.find((j: any) => j.id === body.jugador_id);
      if (!j) throw new Error('Jugador no encontrado');
      const nuevo = {
        id: nextId('periodos'),
        jugador_id: body.jugador_id,
        jugador_nombre: `${j.nombre} ${j.apellidos}`,
        categoria: j.categoria,
        anio: body.anio,
        mes: body.mes || new Date().getMonth() + 1,
        objetivo: j.mensualidad_objetivo || j.mensualidad || 0,
        pagado: 0,
        estado: 'pendiente',
        notas: '',
        created_at: now()
      };
      items.push(nuevo);
      setCollection('periodos', items);
      return nuevo;
    }
    if (body?.accion === 'upsert') {
      const idx = items.findIndex((p: any) => p.jugador_id === body.jugador_id && p.anio === body.anio && p.mes === body.mes);
      const jugadores = getCollection<any>('jugadores');
      const j = jugadores.find((j: any) => j.id === body.jugador_id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...body };
      } else {
        items.push({
          id: nextId('periodos'),
          jugador_id: body.jugador_id,
          jugador_nombre: j ? `${j.nombre} ${j.apellidos}` : `Jugador #${body.jugador_id}`,
          categoria: j?.categoria || '',
          anio: body.anio,
          mes: body.mes,
          objetivo: body.objetivo || j?.mensualidad_objetivo || j?.mensualidad || 0,
          pagado: body.pagado || 0,
          estado: body.estado || 'pendiente',
          notas: body.notas || '',
          created_at: now()
        });
      }
      setCollection('periodos', items);
      return items[idx >= 0 ? idx : items.length - 1];
    }
    const newItem = { ...body, id: nextId('periodos'), created_at: now() };
    items.push(newItem);
    setCollection('periodos', items);
    return newItem;
  }
  if (seg0 === 'periodos' && (method === 'PUT' || method === 'PATCH')) {
    const items = getCollection<any>('periodos');
    const id = body?.id;
    const idx = items.findIndex((p: any) => p.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...body };
    setCollection('periodos', items);
    return items[idx] || { ok: true };
  }

  if (seg0 === 'whatsapp' && method === 'GET') {
    const params = new URLSearchParams(qs);
    const tipo = params.get('tipo');
    if (tipo === 'plantillas') return getCollection('whatsapp_plantillas');
    if (tipo === 'historial') return getCollection('whatsapp_historial');
    return { plantillas: getCollection('whatsapp_plantillas'), historial: getCollection('whatsapp_historial') };
  }
  if (seg0 === 'whatsapp' && method === 'POST') {
    if (body?.accion === 'enviar') {
      const hist = getCollection<any>('whatsapp_historial');
      const newEntry = {
        id: nextId('whatsapp_historial'),
        jugador_id: body.jugador_id,
        jugador_nombre: body.jugador_nombre || `Jugador #${body.jugador_id}`,
        telefono: body.telefono || '',
        tipo: body.plantilla_codigo || 'custom',
        mensaje: body.mensaje_custom || '',
        estado: 'enviado',
        fecha: now()
      };
      hist.push(newEntry);
      setCollection('whatsapp_historial', hist);
      return { ok: true, mensaje: 'Mensaje enviado (demo)' };
    }
    return { ok: true, mensaje: 'Mensaje enviado (demo)' };
  }

  return { error: 'Endpoint no encontrado en modo demo' };
}
