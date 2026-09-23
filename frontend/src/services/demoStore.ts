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
    { id: 1, nombre: 'Sub 17-18', tipo_genero: 'Mixta', mensualidad_base: 50000, profesor_id: null, profesor_nombre: null, total_jugadores: 4, activo: true, edad_min: 17, edad_max: 18, horario: '16:00', dias_entrenamiento: 'Lun/Mie/Vie', cancha: 'Principal', cupo_maximo: 25, created_at: now() },
    { id: 2, nombre: 'Sub 16-15', tipo_genero: 'Masculino', mensualidad_base: 50000, profesor_id: null, profesor_nombre: null, total_jugadores: 5, activo: true, edad_min: 15, edad_max: 16, horario: '15:00', dias_entrenamiento: 'Mar/Jue/Sab', cancha: 'Principal', cupo_maximo: 25, created_at: now() },
    { id: 3, nombre: 'Sub 14-13', tipo_genero: 'Masculino', mensualidad_base: 40000, profesor_id: null, profesor_nombre: null, total_jugadores: 3, activo: true, edad_min: 13, edad_max: 14, horario: '16:00', dias_entrenamiento: 'Lun/Mie/Vie', cancha: 'Secundaria', cupo_maximo: 22, created_at: now() },
    { id: 4, nombre: 'Sub 12-11', tipo_genero: 'Femenino', mensualidad_base: 40000, profesor_id: null, profesor_nombre: null, total_jugadores: 4, activo: true, edad_min: 11, edad_max: 12, horario: '15:30', dias_entrenamiento: 'Mar/Jue', cancha: 'Secundaria', cupo_maximo: 20, created_at: now() },
    { id: 5, nombre: 'Sub 10-9', tipo_genero: 'Mixta', mensualidad_base: 30000, profesor_id: null, profesor_nombre: null, total_jugadores: 3, activo: true, edad_min: 9, edad_max: 10, horario: '14:00', dias_entrenamiento: 'Lun/Mie', cancha: 'Auxiliar', cupo_maximo: 20, created_at: now() },
    { id: 6, nombre: 'Sub 8-7', tipo_genero: 'Mixta', mensualidad_base: 30000, profesor_id: null, profesor_nombre: null, total_jugadores: 2, activo: true, edad_min: 7, edad_max: 8, horario: '14:30', dias_entrenamiento: 'Sab/Dom', cancha: 'Auxiliar', cupo_maximo: 18, created_at: now() },
  ];

  const profesores = [
    { id: 1, nombre: 'Carlos Rodriguez', telefono: '3101234567', especialidad: 'Futbol 11', salario: 2000000, fecha_ingreso: '2024-01-15', tipo_contrato: 'indefinido', categorias_asignadas: ['Sub 17-18'], activo: true },
    { id: 2, nombre: 'Maria Lopez', telefono: '3119876543', especialidad: 'Futbol femenino', salario: 1800000, fecha_ingreso: '2024-03-01', tipo_contrato: 'fijo', categorias_asignadas: ['Sub 12-11'], activo: true },
    { id: 3, nombre: 'Andres Martinez', telefono: '3125554444', especialidad: 'Formativas', salario: 1500000, fecha_ingreso: '2024-06-10', tipo_contrato: 'prestacion_servicios', categorias_asignadas: ['Sub 14-13', 'Sub 10-9'], activo: true },
  ];

  // Centralized linkage: source of truth is categorias.profesor_id — derive from profesores categorias_asignadas for initial seed
  const profIdByCatName: Record<string, number> = {};
  profesores.forEach((p: any) => {
    (p.categorias_asignadas || []).forEach((catName: string) => {
      profIdByCatName[catName] = p.id;
    });
  });
  cats.forEach((c: any) => {
    if (profIdByCatName[c.nombre] != null) {
      c.profesor_id = profIdByCatName[c.nombre];
      const prof = profesores.find((p: any) => p.id === profIdByCatName[c.nombre]);
      c.profesor_nombre = prof ? prof.nombre : null;
    }
  });

  const jugadores = [
    { id: 1, nombre: 'Santiago', apellidos: 'Garcia Perez', fecha_nacimiento: '2008-03-15', tipo_identificacion: 'Cedula', numero_identificacion: '1234567890', categoria: 'Sub 17-18', telefono: '3105551111', mensualidad: 50000, mensualidad_objetivo: 50000, genero: 'Masculino', acudiente_nombre: 'Pedro Garcia', acudiente_telefono: '3105551112', whatsapp_opt_out: false, activo: true, estado: 'activo', fecha_ingreso: '2024-02-01', created_at: now(), saldo_pendiente: 50000 },
    { id: 2, nombre: 'Valentina', apellidos: 'Rodriguez Diaz', fecha_nacimiento: '2009-07-22', tipo_identificacion: 'Cedula', numero_identificacion: '2345678901', categoria: 'Sub 16-15', telefono: '3115552222', mensualidad: 50000, mensualidad_objetivo: 50000, genero: 'Femenino', acudiente_nombre: 'Ana Rodriguez', acudiente_telefono: '3115552223', whatsapp_opt_out: false, activo: true, estado: 'activo', fecha_ingreso: '2024-02-15', created_at: now(), saldo_pendiente: 0 },
    { id: 3, nombre: 'Mateo', apellidos: 'Lopez Suarez', fecha_nacimiento: '2010-01-10', tipo_identificacion: 'Cedula', numero_identificacion: '3456789012', categoria: 'Sub 14-13', telefono: '3125553333', mensualidad: 40000, mensualidad_objetivo: 40000, genero: 'Masculino', acudiente_nombre: 'Jorge Lopez', acudiente_telefono: '3125553334', whatsapp_opt_out: false, activo: true, estado: 'activo', fecha_ingreso: '2024-03-01', created_at: now(), saldo_pendiente: 20000 },
    { id: 4, nombre: 'Camila', apellidos: 'Hernandez Ruiz', fecha_nacimiento: '2011-05-18', tipo_identificacion: 'Tarjeta', numero_identificacion: '4567890123', categoria: 'Sub 12-11', telefono: '3135554444', mensualidad: 40000, mensualidad_objetivo: 40000, genero: 'Femenino', acudiente_nombre: 'Laura Hernandez', acudiente_telefono: '3135554445', whatsapp_opt_out: false, activo: true, estado: 'activo', fecha_ingreso: '2024-03-10', created_at: now(), saldo_pendiente: 0 },
    { id: 5, nombre: 'Sebastian', apellidos: 'Torres Vargas', fecha_nacimiento: '2012-09-03', tipo_identificacion: 'Cedula', numero_identificacion: '5678901234', categoria: 'Sub 10-9', telefono: '3145555555', mensualidad: 30000, mensualidad_objetivo: 30000, genero: 'Masculino', acudiente_nombre: 'Carlos Torres', acudiente_telefono: '3145555556', whatsapp_opt_out: true, activo: true, estado: 'activo', fecha_ingreso: '2024-04-01', created_at: now(), saldo_pendiente: 0 },
    { id: 6, nombre: 'Isabella', apellidos: 'Martinez Cruz', fecha_nacimiento: '2008-11-25', tipo_identificacion: 'Cedula', numero_identificacion: '6789012345', categoria: 'Sub 17-18', telefono: '3155556666', mensualidad: 50000, mensualidad_objetivo: 50000, genero: 'Femenino', acudiente_nombre: 'Roberto Martinez', acudiente_telefono: '3155556667', whatsapp_opt_out: false, activo: true, estado: 'activo', fecha_ingreso: '2024-04-15', created_at: now(), saldo_pendiente: 0 },
    { id: 7, nombre: 'Daniel', apellidos: 'Gutierrez Palacios', fecha_nacimiento: '2010-04-12', tipo_identificacion: 'Cedula', numero_identificacion: '7890123456', categoria: 'Sub 14-13', telefono: '3165557777', mensualidad: 40000, mensualidad_objetivo: 40000, genero: 'Masculino', acudiente_nombre: 'Patricia Gutierrez', acudiente_telefono: '3165557778', whatsapp_opt_out: false, activo: true, estado: 'activo', fecha_ingreso: '2024-05-01', created_at: now(), saldo_pendiente: 40000 },
    { id: 8, nombre: 'Sofia', apellidos: 'Ramirez Ospina', fecha_nacimiento: '2011-08-30', tipo_identificacion: 'Cedula', numero_identificacion: '8901234567', categoria: 'Sub 12-11', telefono: '3175558888', mensualidad: 40000, mensualidad_objetivo: 40000, genero: 'Femenino', acudiente_nombre: 'Fernando Ramirez', acudiente_telefono: '3175558889', whatsapp_opt_out: false, activo: true, estado: 'activo', fecha_ingreso: '2024-05-15', created_at: now(), saldo_pendiente: 0 },
    { id: 9, nombre: 'Nicolas', apellidos: 'Morales Castano', fecha_nacimiento: '2013-02-14', tipo_identificacion: 'Cedula', numero_identificacion: '9012345678', categoria: 'Sub 8-7', telefono: '3185559999', mensualidad: 30000, mensualidad_objetivo: 30000, genero: 'Masculino', acudiente_nombre: 'Diana Morales', acudiente_telefono: '3185559990', whatsapp_opt_out: false, activo: true, estado: 'activo', fecha_ingreso: '2024-06-01', created_at: now(), saldo_pendiente: 30000 },
    { id: 10, nombre: 'Luciana', apellidos: 'Vargas Mejia', fecha_nacimiento: '2012-06-07', tipo_identificacion: 'Tarjeta', numero_identificacion: '0123456789', categoria: 'Sub 10-9', telefono: '3195550000', mensualidad: 30000, mensualidad_objetivo: 30000, genero: 'Femenino', acudiente_nombre: 'Gloria Vargas', acudiente_telefono: '3195550001', whatsapp_opt_out: false, activo: true, estado: 'retirado', fecha_ingreso: '2024-06-15', created_at: now(), saldo_pendiente: 0 },
  ];

  const pagos = [
    { id: 1, jugador_id: 1, jugador: 'Santiago Garcia', jugador_telefono: '3105551111', jugador_categoria: 'Sub 17-18', monto: 50000, fecha: '2025-09-05', tipo: 'completo', observacion: 'Pago mensual septiembre', mes_pago: 'Septiembre 2025', cantidad_meses: 1, recibo_numero: 'REC-001', vencimiento: '2025-09-10', estado_pago: 'completo', saldo_pendiente: 0, metodo_pago: 'Efectivo', registrado_por: 1, registrado_por_nombre: 'Admin', anulado: false, anulado_motivo: null, anulado_por: null, anulado_at: null, created_at: now() },
    { id: 2, jugador_id: 3, jugador: 'Mateo Lopez', jugador_telefono: '3125553333', jugador_categoria: 'Sub 14-13', monto: 20000, fecha: '2025-09-08', tipo: 'abono', observacion: 'Abono mitad', mes_pago: 'Septiembre 2025', cantidad_meses: 1, recibo_numero: 'REC-002', vencimiento: '2025-09-10', estado_pago: 'abono', saldo_pendiente: 20000, metodo_pago: 'Efectivo', registrado_por: 1, registrado_por_nombre: 'Admin', anulado: false, anulado_motivo: null, anulado_por: null, anulado_at: null, created_at: now() },
    { id: 3, jugador_id: 6, jugador: 'Isabella Martinez', jugador_telefono: '3155556666', jugador_categoria: 'Sub 17-18', monto: 100000, fecha: '2025-09-01', tipo: 'adelantado', observacion: 'Pago adelantado 2 meses', mes_pago: 'Septiembre 2025', cantidad_meses: 2, recibo_numero: 'REC-003', vencimiento: '2025-11-10', estado_pago: 'completo', saldo_pendiente: 0, metodo_pago: 'Efectivo', registrado_por: 1, registrado_por_nombre: 'Admin', anulado: false, anulado_motivo: null, anulado_por: null, anulado_at: null, created_at: now() },
  ];

  const gastos = [
    { id: 1, concepto: 'Arriendo cancha', descripcion: 'Pago mensual cancha sintetica', monto: 800000, categoria: 'Arriendo', fecha: '2025-09-01', creado_por: 1, creado_por_nombre: 'Admin', metodo_pago: 'Efectivo', comprobante: null, anulado: false, anulado_motivo: null, created_at: now() },
    { id: 2, concepto: 'Nomina Carlos R.', descripcion: 'Pago quincenal septiembre', monto: 1000000, categoria: 'Nomina', fecha: '2025-09-15', creado_por: 1, creado_por_nombre: 'Admin', metodo_pago: 'Efectivo', comprobante: null, anulado: false, anulado_motivo: null, created_at: now() },
    { id: 3, concepto: 'Balones', descripcion: 'Compra 10 balones size 5', monto: 250000, categoria: 'Equipamiento', fecha: '2025-09-03', creado_por: 1, creado_por_nombre: 'Admin', metodo_pago: 'Efectivo', comprobante: null, anulado: false, anulado_motivo: null, created_at: now() },
  ];

  const inventario = [
    { id: 1, nombre: 'Balon size 5', categoria: 'Balones', stock: 15, stock_minimo: 8, costo_unitario: 25000, proveedor: 'Deportes SA', movimientos: [] },
    { id: 2, nombre: 'Canesita deportiva', categoria: 'Uniformes', stock: 40, stock_minimo: 20, costo_unitario: 35000, proveedor: 'TextilFutbol', movimientos: [] },
    { id: 3, nombre: 'Canilleras', categoria: 'Proteccion', stock: 30, stock_minimo: 15, costo_unitario: 15000, proveedor: 'Deportes SA', movimientos: [] },
    { id: 4, nombre: 'Conos', categoria: 'Entrenamiento', stock: 25, stock_minimo: 10, costo_unitario: 5000, proveedor: 'SportsTech', movimientos: [] },
  ];

  const alertas = [
    { id: 1, jugador_id: 3, jugador_nombre: 'Mateo Lopez', nombre: 'Deuda pendiente', categoria: 'Sub 14-13', telefono: '3125553333', pagado: 20000, deuda: 20000, mensualidad_objetivo: 40000, mes_abono: 'Septiembre 2025', tipo_alerta: 'ABONO', tipo: 'automatica', titulo: 'Abono pendiente', periodo: 'Septiembre 2025', vencimiento: '2025-09-10', estado_cobranza: 'deuda', ultimo_contacto: null, descartada: false, created_at: now() },
    { id: 2, jugador_id: 7, jugador_nombre: 'Daniel Gutierrez', nombre: 'Deuda total', categoria: 'Sub 14-13', telefono: '3165557777', deuda: 40000, mensualidad_objetivo: 40000, tipo_alerta: 'DEUDA', tipo: 'automatica', titulo: 'Pago vencido', periodo: 'Septiembre 2025', vencimiento: '2025-09-10', estado_cobranza: 'deuda', ultimo_contacto: null, descartada: false, created_at: now() },
    { id: 3, jugador_id: 9, jugador_nombre: 'Nicolas Morales', nombre: 'Sin pago', categoria: 'Sub 8-7', telefono: '3185559999', deuda: 30000, mensualidad_objetivo: 30000, tipo_alerta: 'DEUDA', tipo: 'automatica', titulo: 'Sin pago registrado', periodo: 'Septiembre 2025', vencimiento: '2025-09-10', estado_cobranza: 'deuda', ultimo_contacto: null, descartada: false, created_at: now() },
  ];

  const notas = [
    { id: 1, jugador_id: 1, nota: 'Muy buen desempeno en el partido de hoy', creado_por: 1, creador_nombre: 'Admin', tipo: 'administrativa', visibilidad: 'publica', created_at: now() },
    { id: 2, jugador_id: 4, nota: 'Falta asistencia esta semana', creado_por: 1, creador_nombre: 'Admin', tipo: 'administrativa', visibilidad: 'publica', created_at: now() },
  ];

  const bitacora = [
    { id: 1, fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'login', modulo: 'auth', detalle: 'Sesion iniciada' },
    { id: 2, fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'crear', modulo: 'jugadores', detalle: 'Jugador Santiago Garcia creado' },
  ];

  const periodos = [
    { id: 1, jugador_id: 1, jugador_nombre: 'Santiago Garcia', categoria: 'Sub 17-18', anio: 2025, mes: 9, objetivo: 50000, pagado: 50000, saldo: 0, vencimiento: '2025-09-10', estado: 'pagado', notas: '', created_at: now() },
    { id: 2, jugador_id: 3, jugador_nombre: 'Mateo Lopez', categoria: 'Sub 14-13', anio: 2025, mes: 9, objetivo: 40000, pagado: 20000, saldo: 20000, vencimiento: '2025-09-10', estado: 'abono', notas: '', created_at: now() },
    { id: 3, jugador_id: 7, jugador_nombre: 'Daniel Gutierrez', categoria: 'Sub 14-13', anio: 2025, mes: 9, objetivo: 40000, pagado: 0, saldo: 40000, vencimiento: '2025-09-10', estado: 'pendiente', notas: '', created_at: now() },
    { id: 4, jugador_id: 9, jugador_nombre: 'Nicolas Morales', categoria: 'Sub 8-7', anio: 2025, mes: 9, objetivo: 30000, pagado: 0, saldo: 30000, vencimiento: '2025-09-10', estado: 'pendiente', notas: '', created_at: now() },
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
    // Gestion de cobranza via accion: contactado, prometio_pagar, descartar, restaurar, crear
    if (body?.accion && body?.alerta_id != null) {
      const idx = items.findIndex((a: any) => String(a.id) === String(body.alerta_id));
      if (idx >= 0) {
        const acc = body.accion;
        if (acc === 'descartar') { items[idx].descartada = true; items[idx].estado_cobranza = 'descartada'; }
        else if (acc === 'restaurar') { items[idx].descartada = false; items[idx].estado_cobranza = 'deuda'; }
        else if (acc === 'contactado') { items[idx].estado_cobranza = 'contactado'; items[idx].ultimo_contacto = now(); }
        else if (acc === 'prometio_pagar') { items[idx].estado_cobranza = 'prometio_pagar'; items[idx].ultimo_contacto = now(); }
        else if (acc === 'archivar') { items[idx].descartada = true; items[idx].estado_cobranza = 'descartada'; }
        else if (acc === 'reactivar') { items[idx].descartada = false; items[idx].estado_cobranza = 'deuda'; }
        setCollection('alertas', items);
        // bitacora
        const bit = getCollection<any>('bitacora');
        bit.push({ id: nextId('bitacora'), fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'gestion_cobranza', modulo: 'cobranzas', detalle: `Cobranza #${body.alerta_id}: ${acc}` });
        setCollection('bitacora', bit);
        return items[idx];
      }
      return { ok: true };
    }
    if (body?.accion === 'crear' || !body?.accion) {
      const newItem = { ...body, id: nextId('alertas'), tipo_alerta: body.tipo_alerta || 'MANUAL', tipo: body.tipo || 'manual', estado_cobranza: body.estado_cobranza || 'deuda', descartada: false, ultimo_contacto: null, created_at: now() };
      delete newItem.accion;
      items.push(newItem);
      setCollection('alertas', items);
      return newItem;
    }
    const newItem = { ...body, id: nextId('alertas'), created_at: now() };
    items.push(newItem);
    setCollection('alertas', items);
    return newItem;
  }
  if (seg0 === 'alertas' && method === 'PUT') {
    const items = getCollection<any>('alertas');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx >= 0) {
      if (body?.estado_cobranza) items[idx].estado_cobranza = body.estado_cobranza;
      if (body?.estado_cobranza) items[idx].ultimo_contacto = now();
      items[idx] = { ...items[idx], ...body };
    }
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
    const newItem = { ...body, id: nextId('jugadores'), activo: body.estado !== 'retirado', estado: body.estado || 'activo', fecha_ingreso: body.fecha_ingreso || now().slice(0, 10), created_at: now(), saldo_pendiente: body.saldo_pendiente || 0, mensualidad: body.mensualidad || 0, mensualidad_objetivo: body.mensualidad_objetivo || 0 };
    items.push(newItem);
    setCollection('jugadores', items);
    // bitacora
    const bit = getCollection<any>('bitacora');
    bit.push({ id: nextId('bitacora'), fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'crear_jugador', modulo: 'jugadores', detalle: `Jugador ${body.nombre} ${body.apellidos} creado` });
    setCollection('bitacora', bit);
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

  if (seg0 === 'pagos' && method === 'GET') {
    const items = getCollection<any>('pagos');
    // filter out anulados by default if query has no incluir_anulados
    const params = new URLSearchParams(qs);
    if (!params.get('incluir_anulados')) return items.filter((p: any) => !p.anulado);
    return items;
  }
  if (seg0 === 'pagos' && method === 'POST') {
    const items = getCollection<any>('pagos');
    if (body?.accion === 'anular') {
      const idx = items.findIndex((p: any) => p.id === body.pago_id);
      if (idx >= 0) {
        items[idx].anulado = true;
        items[idx].anulado_motivo = body.motivo;
        items[idx].anulado_por = 1;
        items[idx].anulado_at = now();
        // recalcular periodo: restar monto del pagado
        const periodos = getCollection<any>('periodos');
        const pagoPeriodos = getCollection<any>('pago_periodos');
        const pps = pagoPeriodos.filter((pp: any) => pp.pago_id === body.pago_id);
        pps.forEach((pp: any) => {
          const peri = periodos.find((pe: any) => pe.id === pp.periodo_id);
          if (peri) { peri.pagado = Math.max(0, (peri.pagado || 0) - pp.monto_aplicado); peri.saldo = (peri.objetivo || 0) - peri.pagado; peri.estado = peri.pagado === 0 ? 'pendiente' : peri.pagado < peri.objetivo ? 'abono' : 'completo'; }
        });
        setCollection('periodos', periodos);
        // bitacora
        const bit = getCollection<any>('bitacora');
        bit.push({ id: nextId('bitacora'), fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'anular_pago', modulo: 'pagos', detalle: `Pago #${body.pago_id} anulado: ${body.motivo}`, antes: String(items[idx].monto), despues: '0', motivo: body.motivo });
        setCollection('bitacora', bit);
      }
      setCollection('pagos', items);
      return items[idx >= 0 ? idx : 0] || { ok: true };
    }
    const newItem = { ...body, id: nextId('pagos'), metodo_pago: body.metodo_pago || 'Efectivo', registrado_por: 1, registrado_por_nombre: 'Admin', anulado: false, anulado_motivo: null, anulado_por: null, anulado_at: null, created_at: now(), recibo_numero: body.recibo_numero || 'REC-' + String(nextId('pagos')).padStart(3, '0') };
    items.push(newItem);
    setCollection('pagos', items);
    // --- Crear periodos reales usando expandirPagoMeses (monto/mensualidad) ---
    try {
      const jugadores = getCollection<any>('jugadores');
      const j = jugadores.find((x: any) => x.id === body.jugador_id);
      const MENSUALIDAD_FALLBACK: Record<string, number> = { 'Sub 17-18': 50000, 'Sub 16-15': 50000, 'Sub 14-13': 40000, 'Sub 12-11': 40000, 'Sub 10-9': 30000, 'Sub 8-7': 30000 };
      let mensualidad = 0;
      if (j) {
        const tipoBeca = (j as any).tipo_beca;
        if (tipoBeca === 'Becado 100%') mensualidad = 0;
        else if (tipoBeca === 'Becado 50%') {
          const base = (j as any).mensualidad_objetivo || j.mensualidad || MENSUALIDAD_FALLBACK[j.categoria] || 0;
          mensualidad = base / 2;
        } else {
          mensualidad = j.mensualidad || (j as any).mensualidad_objetivo || MENSUALIDAD_FALLBACK[j.categoria] || 0;
        }
      }
      if (body.mensualidad && Number(body.mensualidad) > 0) mensualidad = Number(body.mensualidad);
      const monto = Number(body.monto) || 0;
      if (mensualidad > 0 && monto > 0) {
        const mesesCompletos = Math.floor(monto / mensualidad);
        const resto = monto % mensualidad;
        const detalle: { pagado: number; estado: string }[] = [];
        for (let i = 0; i < mesesCompletos; i++) detalle.push({ pagado: mensualidad, estado: 'completo' });
        if (resto > 0) detalle.push({ pagado: resto, estado: 'abono' });
        // $150000 ÷ $50000 = 3 periodos completos, $125000 -> 2 completos + 1 abono $25000 handled by above
        if (detalle.length > 0) {
          const periodos = getCollection<any>('periodos');
          const pagoPeriodos = getCollection<any>('pago_periodos');
          let startAnio: number | null = null;
          let startMes: number | null = null;
          if (Array.isArray(body.meses_cubiertos) && body.meses_cubiertos.length > 0) {
            startAnio = Number(body.meses_cubiertos[0].anio);
            startMes = Number(body.meses_cubiertos[0].mes);
          }
          if (!startAnio || !startMes || isNaN(startAnio) || isNaN(startMes)) {
            const fecha = body.fecha ? new Date(body.fecha) : new Date();
            startAnio = fecha.getFullYear();
            startMes = fecha.getMonth() + 1;
          }
          if (isNaN(startAnio)) startAnio = new Date().getFullYear();
          if (isNaN(startMes) || startMes < 1 || startMes > 12) startMes = new Date().getMonth() + 1;
          detalle.forEach((d, idx) => {
            const totalOffset = (startMes! - 1) + idx;
            const anio = startAnio! + Math.floor(totalOffset / 12);
            const mes = (totalOffset % 12) + 1;
            let periodo = periodos.find((p: any) => p.jugador_id === body.jugador_id && p.anio === anio && p.mes === mes);
            if (!periodo) {
              periodo = {
                id: nextId('periodos'),
                jugador_id: body.jugador_id,
                jugador_nombre: j ? `${j.nombre} ${j.apellidos}` : `Jugador #${body.jugador_id}`,
                categoria: j?.categoria || body.jugador_categoria || '',
                anio,
                mes,
                objetivo: mensualidad,
                pagado: d.pagado,
                saldo: Math.max(0, mensualidad - d.pagado),
                vencimiento: `${anio}-${String(mes).padStart(2, '0')}-10`,
                estado: d.estado,
                notas: '',
                created_at: now()
              };
              periodos.push(periodo);
            } else {
              const prevPagado = Number(periodo.pagado) || 0;
              const objetivo = Number(periodo.objetivo) || mensualidad;
              if (d.estado === 'completo') {
                periodo.pagado = objetivo;
              } else {
                if (prevPagado === 0) periodo.pagado = d.pagado;
                else periodo.pagado = Math.min(objetivo, prevPagado + d.pagado);
                if (periodo.pagado > objetivo) periodo.pagado = objetivo;
              }
              periodo.objetivo = objetivo;
              periodo.saldo = Math.max(0, objetivo - periodo.pagado);
              periodo.estado = periodo.pagado === 0 ? 'pendiente' : periodo.pagado < objetivo ? 'abono' : 'completo';
            }
            pagoPeriodos.push({ id: nextId('pago_periodos'), pago_id: newItem.id, periodo_id: periodo.id, monto_aplicado: d.pagado, created_at: now() });
          });
          setCollection('periodos', periodos);
          setCollection('pago_periodos', pagoPeriodos);
        }
      }
    } catch (e) {
      console.warn('periodos expansion failed', e);
    }
    // bitacora
    const bit2 = getCollection<any>('bitacora');
    bit2.push({ id: nextId('bitacora'), fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'registrar_pago', modulo: 'pagos', detalle: `Pago $${body.monto} registrado para jugador #${body.jugador_id}` });
    setCollection('bitacora', bit2);
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

  if (seg0 === 'profesores' && method === 'GET') {
    const profesores = getCollection<any>('profesores');
    const categorias = getCollection<any>('categorias');
    const map = new Map<number, string[]>();
    categorias.forEach((c: any) => {
      if (c.profesor_id != null) {
        const arr = map.get(c.profesor_id) || [];
        arr.push(c.nombre);
        map.set(c.profesor_id, arr);
      }
    });
    return profesores.map((p: any) => ({ ...p, categorias_asignadas: map.get(p.id) || [] }));
  }
  if (seg0 === 'profesores' && method === 'POST') {
    const items = getCollection<any>('profesores');
    const { categorias_asignadas, ...rest } = body || {};
    const newItem = { ...rest, id: nextId('profesores'), activo: true };
    items.push(newItem);
    setCollection('profesores', items);
    // Sync categorias: assign categorias listed in categorias_asignadas to this new profesor
    if (Array.isArray(categorias_asignadas) && categorias_asignadas.length > 0) {
      const cats = getCollection<any>('categorias');
      let changed = false;
      categorias_asignadas.forEach((catName: string) => {
        const cat = cats.find((c: any) => c.nombre === catName);
        if (cat) {
          cat.profesor_id = newItem.id;
          cat.profesor_nombre = newItem.nombre || null;
          changed = true;
        }
      });
      if (changed) setCollection('categorias', cats);
    }
    return { ...newItem, categorias_asignadas: categorias_asignadas || [] };
  }
  if (seg0 === 'profesores' && method === 'PUT') {
    const items = getCollection<any>('profesores');
    const id = parseIdFromUrl(url, body);
    const idx = items.findIndex((i: any) => i.id === id);
    const { categorias_asignadas, ...rest } = body || {};
    if (idx >= 0) items[idx] = { ...items[idx], ...rest };
    setCollection('profesores', items);
    // Sync categorias: centralize relation in categorias.profesor_id
    if (Array.isArray(categorias_asignadas)) {
      const cats = getCollection<any>('categorias');
      let changed = false;
      // Unassign categorias previously assigned to this profesor but not in new list
      cats.forEach((c: any) => {
        if (c.profesor_id === id && !categorias_asignadas.includes(c.nombre)) {
          c.profesor_id = null;
          c.profesor_nombre = null;
          changed = true;
        }
      });
      // Assign each name in new list to this profesor
      categorias_asignadas.forEach((catName: string) => {
        const cat = cats.find((c: any) => c.nombre === catName);
        if (cat && cat.profesor_id !== id) {
          cat.profesor_id = id;
          const profNombre = idx >= 0 ? items[idx].nombre : null;
          cat.profesor_nombre = profNombre;
          changed = true;
        }
      });
      if (changed) setCollection('categorias', cats);
    }
    const result = idx >= 0 ? { ...items[idx], categorias_asignadas: categorias_asignadas || [] } : { ok: true };
    return result;
  }
  if (seg0 === 'profesores' && method === 'DELETE') {
    const id = parseIdFromUrl(url, body);
    let items = getCollection<any>('profesores');
    items = items.filter((i: any) => i.id !== id);
    setCollection('profesores', items);
    return { ok: true };
  }

  if (seg0 === 'gastos' && method === 'GET') {
    const items = getCollection<any>('gastos');
    const params = new URLSearchParams(qs);
    if (!params.get('incluir_anulados')) return items.filter((g: any) => !g.anulado);
    return items;
  }
  if (seg0 === 'gastos' && method === 'POST') {
    const items = getCollection<any>('gastos');
    if (body?.accion === 'anular') {
      const idx = items.findIndex((g: any) => g.id === body.gasto_id);
      if (idx >= 0) { items[idx].anulado = true; items[idx].anulado_motivo = body.motivo; items[idx].anulado_por = 1; items[idx].anulado_at = now(); }
      const bit = getCollection<any>('bitacora');
      bit.push({ id: nextId('bitacora'), fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'anular_gasto', modulo: 'gastos', detalle: `Gasto #${body.gasto_id} anulado: ${body.motivo}`, motivo: body.motivo });
      setCollection('bitacora', bit);
      setCollection('gastos', items);
      return items[idx >= 0 ? idx : 0] || { ok: true };
    }
    const newItem = { ...body, id: nextId('gastos'), metodo_pago: body.metodo_pago || 'Efectivo', comprobante: body.comprobante || null, anulado: false, anulado_motivo: null, anulado_por: null, anulado_at: null, created_at: now(), creado_por: 1, creado_por_nombre: 'Admin' };
    items.push(newItem);
    setCollection('gastos', items);
    const bit2 = getCollection<any>('bitacora');
    bit2.push({ id: nextId('bitacora'), fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'registrar_gasto', modulo: 'gastos', detalle: `Gasto "${body.concepto}" $${body.monto} registrado` });
    setCollection('bitacora', bit2);
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
    if (body?.accion === 'movimiento') {
      const idx = items.findIndex((i: any) => i.id === body.item_id);
      if (idx >= 0) {
        const stockAnterior = items[idx].stock;
        const cantidad = Number(body.cantidad) || 0;
        let stockActual = stockAnterior;
        if (body.tipo === 'entrada') stockActual = stockAnterior + cantidad;
        else if (body.tipo === 'salida') stockActual = Math.max(0, stockAnterior - cantidad);
        else if (body.tipo === 'ajuste') stockActual = cantidad;
        items[idx].stock = stockActual;
        const mov = { id: nextId('movimientos_inventario'), item_id: body.item_id, tipo: body.tipo, cantidad, stock_anterior: stockAnterior, stock_actual: stockActual, motivo: body.motivo || '', usuario_id: 1, usuario_nombre: 'Admin', created_at: now() };
        if (!items[idx].movimientos) items[idx].movimientos = [];
        items[idx].movimientos.push(mov);
        const bit = getCollection<any>('bitacora');
        bit.push({ id: nextId('bitacora'), fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'movimiento_inventario', modulo: 'inventario', detalle: `${body.tipo} ${cantidad} en "${items[idx].nombre}": ${stockAnterior} -> ${stockActual}` });
        setCollection('bitacora', bit);
      }
      setCollection('inventario', items);
      return items[idx >= 0 ? idx : 0] || { ok: true };
    }
    const newItem = { ...body, id: nextId('inventario'), movimientos: [] };
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
    const newItem = { ...body, id: nextId('notas'), tipo: body.tipo || 'administrativa', visibilidad: body.visibilidad || 'publica', created_at: now(), creado_por: 1, creador_nombre: 'Admin' };
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

  if (seg0 === 'asistencias' && method === 'GET') {
    const items = getCollection<any>('asistencias');
    const params = new URLSearchParams(qs);
    const fecha = params.get('fecha');
    const jugadorId = params.get('jugador_id');
    let filtered = items;
    if (fecha) filtered = filtered.filter((a: any) => a.fecha === fecha);
    if (jugadorId) filtered = filtered.filter((a: any) => String(a.jugador_id) === String(jugadorId));
    // enrich with jugador info
    const jugadores = getCollection<any>('jugadores');
    const map: Record<number, any> = {};
    jugadores.forEach((j: any) => { map[j.id] = j; });
    return filtered.map((a: any) => ({ ...a, nombre: map[a.jugador_id]?.nombre || a.nombre || '', apellidos: map[a.jugador_id]?.apellidos || a.apellidos || '', categoria: map[a.jugador_id]?.categoria || a.categoria || '' }));
  }
  if (seg0 === 'asistencias' && method === 'POST') {
    const items = getCollection<any>('asistencias');
    const registros = body?.registros as any[] | undefined;
    if (Array.isArray(registros)) {
      // batch: registros = [{ jugador_id, fecha, estado, presente, motivo, medio, observacion, ... }]
      registros.forEach((r: any) => {
        const existing = items.findIndex((a: any) => a.jugador_id === r.jugador_id && a.fecha === r.fecha);
        const record = {
          id: existing >= 0 ? items[existing].id : nextId('asistencias'),
          jugador_id: r.jugador_id,
          fecha: r.fecha,
          presente: r.presente ?? r.estado === 'presente',
          estado: r.estado || (r.presente ? 'presente' : 'ausente'),
          motivo: r.motivo || null,
          medio: r.medio || null,
          observacion: r.observacion || null,
          fecha_excusa: r.fecha_excusa || null,
          observacion_entrenador: r.observacion_entrenador || null,
          entrenamiento_id: r.entrenamiento_id || null,
          tipo_actividad: r.tipo_actividad || 'entrenamiento',
          actividad_id: r.actividad_id || r.entrenamiento_id || null,
          created_at: existing >= 0 ? items[existing].created_at : now(),
        };
        if (existing >= 0) items[existing] = record;
        else items.push(record);
      });
      setCollection('asistencias', items);
      // bitacora
      const bit = getCollection<any>('bitacora');
      bit.push({ id: nextId('bitacora'), fecha: now(), usuario_id: 1, usuario_nombre: 'Admin', accion: 'registrar_asistencia', modulo: 'asistencias', detalle: `Asistencia registrada: ${registros.length} jugadores, fecha ${registros[0]?.fecha || ''}` });
      setCollection('bitacora', bit);
      return { ok: true, count: registros.length };
    }
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
