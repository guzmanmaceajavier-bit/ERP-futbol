import { apiFetch, getMensualidadObjetivo } from './configuracion.js';

let deudores = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 8;

document.addEventListener('DOMContentLoaded', () => {
  cargarAlertas();
});

async function cargarAlertas() {
  try {
    deudores = await apiFetch('/alertas');
    renderizarAlertas();
  } catch (error) {
    console.error('Error cargando alertas:', error);
    const container = document.getElementById('con-alertas');
    if (container) container.innerHTML = `
      <div class="bg-white p-8 rounded-2xl text-center text-red-500 border border-red-200">
        <i class="ph ph-warning text-4xl mb-2"></i>
        <p>Error al cargar las alertas.</p>
      </div>`;
  }
}

function getFiltrados() {
  const q = (document.getElementById('buscador')?.value || '').toLowerCase();
  const cat = document.getElementById('f-categoria')?.value || '';
  const tipo = document.getElementById('f-tipo')?.value || '';
  return deudores.filter(d => {
    if (q && !(d.nombre || '').toLowerCase().includes(q)) return false;
    if (cat && d.categoria !== cat) return false;
    if (tipo === 'deuda' && d.tipo_alerta !== 'DEUDA') return false;
    if (tipo === 'vencido' && d.tipo_alerta !== 'VENCIMIENTO') return false;
    if (tipo === 'manual' && d.tipo !== 'manual') return false;
    return true;
  });
}

window.cambiarPaginaAlerta = function (delta) {
  paginaActual += delta;
  renderizarAlertas();
};

window.renderizarAlertas = function () {
  const tbody = document.getElementById('tabla-alertas');
  const containerMovil = document.getElementById('vista-movil-alertas');
  const infoPaginacion = document.getElementById('info-paginacion');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (!tbody || !containerMovil) return;
  tbody.innerHTML = '';
  containerMovil.innerHTML = '';

  const filtrados = getFiltrados();
  const totalItems = filtrados.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;

  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  if (totalItems === 0) {
    document.getElementById('sin-alertas')?.classList.remove('hidden');
    document.getElementById('con-alertas')?.classList.add('hidden');
    if (infoPaginacion) infoPaginacion.innerText = '0 registros';
    if (btnPrev) btnPrev.disabled = true;
    if (btnNext) btnNext.disabled = true;
    return;
  }

  document.getElementById('sin-alertas')?.classList.add('hidden');
  document.getElementById('con-alertas')?.classList.remove('hidden');

  // Actualizar KPIs
  const totalAlertas = filtrados.length;
  const totalDeudas = filtrados.filter(a => a.tipo_alerta === 'DEUDA').length;
  const totalVencidos = filtrados.filter(a => a.tipo_alerta === 'VENCIMIENTO').length;
  const totalCobrar = filtrados.reduce((s, a) => s + (a.deuda || 0), 0);
  const kpiDeudores = document.getElementById('kpi-deudores');
  const kpiVencidos = document.getElementById('kpi-vencidos');
  const kpiVencidos2 = document.getElementById('kpi-vencidos2');
  const kpiCobrar = document.getElementById('kpi-cobrar');
  if (kpiDeudores) kpiDeudores.textContent = totalAlertas;
  if (kpiVencidos) kpiVencidos.textContent = totalDeudas;
  if (kpiVencidos2) kpiVencidos2.textContent = totalVencidos;
  if (kpiCobrar) kpiCobrar.textContent = '$' + totalCobrar.toLocaleString();

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const datosPagina = filtrados.slice(inicio, inicio + FILAS_POR_PAGINA);

  const nombreMesActual = new Date().toLocaleDateString('es-ES', { month: 'long' });

  datosPagina.forEach(j => {
    const esVencimiento = j.tipo_alerta === 'VENCIMIENTO';
    const esManual = j.tipo === 'manual';

    let colorBadge = 'bg-rose-50 text-rose-700 border-rose-100';
    let iconoBadge = 'ph-warning';
    let textoBadge = 'Deuda';
    let colorBarra = 'from-rose-500 to-rose-600';

    if (esVencimiento) {
      colorBadge = 'bg-amber-50 text-amber-700 border-amber-100';
      iconoBadge = 'ph-clock-countdown';
      textoBadge = 'Vencido';
      colorBarra = 'from-amber-500 to-orange-600';
    }
    if (esManual) {
      colorBadge = 'bg-purple-50 text-purple-700 border-purple-100';
      iconoBadge = 'ph-note';
      textoBadge = 'Manual';
      colorBarra = 'from-purple-500 to-violet-600';
    }

    // --- TABLA ESCRITORIO ---
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-slate-100 last:border-0 transition duration-150";
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full ${esVencimiento ? 'bg-amber-100 text-amber-600' : esManual ? 'bg-purple-100 text-purple-600' : 'bg-rose-100 text-rose-600'} flex items-center justify-center">
            <i class="ph ${esManual ? 'ph-note' : esVencimiento ? 'ph-calendar-x' : 'ph-user'}"></i>
          </div>
          <div>
            <div class="font-bold text-slate-900 text-sm">${j.nombre}</div>
            <div class="text-[11px] text-slate-500">${j.categoria || 'Sin categoria'}</div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-center">
        ${esManual
      ? `<span class="text-xs text-slate-600">${j.titulo || j.mensaje?.slice(0, 30) || '-'}</span>`
      : j.mes_abono ? `<span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold border border-blue-100">${j.mes_abono}</span>` : `<span class="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-semibold">Sin historial</span>`
    }
      </td>
      <td class="px-4 py-3 text-center">
        <div class="flex flex-col items-center gap-1">
          <div class="w-full bg-slate-100 rounded-full h-2 max-w-[100px] mx-auto overflow-hidden">
            <div class="bg-gradient-to-r ${colorBarra} h-2 rounded-full transition-all duration-500" style="width: ${esVencimiento || esManual ? '50%' : '100%'}"></div>
          </div>
          <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colorBadge} border">
            <i class="ph ${iconoBadge} text-xs"></i> ${textoBadge}
          </span>
        </div>
      </td>
      <td class="px-4 py-3 text-center">
        <span class="font-black text-sm ${esVencimiento ? 'text-amber-600' : esManual ? 'text-purple-600' : 'text-rose-600'}">$${(j.deuda || 0).toLocaleString()}</span>
      </td>
      <td class="px-4 py-3 text-center">
        <div class="flex items-center justify-center gap-1">
          <button onclick="enviarWhatsAppAlerta(${JSON.stringify(j).replace(/"/g, '&quot;')})" class="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition" title="Enviar WhatsApp">
            <i class="ph ph-whatsapp-logo"></i>
          </button>
          ${esManual ? `<button onclick="editarAlertaManual(${JSON.stringify(j).replace(/"/g, '&quot;')})" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition" title="Editar"><i class="ph ph-pencil-simple"></i></button>` : ''}
          <button onclick="${esManual ? `eliminarAlertaManual(${j.id})` : `descartarAlerta('${j.id}')`}" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition" title="Eliminar"><i class="ph ph-trash"></i></button>
        </div>
      </td>`;
    tbody.appendChild(tr);

    // --- TARJETA MOVIL ---
    const card = document.createElement('div');
    card.className = "bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden";
    card.innerHTML = `
      <div class="absolute top-0 left-0 h-1 ${colorBarra.replace('from-', 'bg-').split(' ')[0]}" style="width:100%"></div>
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-bold text-slate-900">${j.nombre}</h3>
          <p class="text-xs text-slate-500">${j.categoria || ''}</p>
        </div>
        <div class="text-right">
          <div class="font-black text-lg ${esVencimiento ? 'text-amber-600' : esManual ? 'text-purple-600' : 'text-rose-600'}">$${(j.deuda || 0).toLocaleString()}</div>
          <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colorBadge} border"><i class="ph ${iconoBadge}"></i> ${textoBadge}</span>
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <button onclick="enviarWhatsAppAlerta(${JSON.stringify(j).replace(/"/g, '&quot;')})" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold"><i class="ph ph-whatsapp-logo"></i> WhatsApp</button>
        ${esManual ? `<button onclick="editarAlertaManual(${JSON.stringify(j).replace(/"/g, '&quot;')})" class="px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100"><i class="ph ph-pencil-simple"></i></button>` : ''}
        <button onclick="${esManual ? `eliminarAlertaManual(${j.id})` : `descartarAlerta('${j.id}')`}" class="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100" title="${esManual ? 'Eliminar' : 'Descartar'}"><i class="ph ph-trash"></i></button>
      </div>`;
    containerMovil.appendChild(card);
  });

  if (infoPaginacion) infoPaginacion.innerText = `Pagina ${paginaActual} de ${totalPages} (${totalItems} alertas)`;
  if (btnPrev) btnPrev.disabled = paginaActual <= 1;
  if (btnNext) btnNext.disabled = paginaActual >= totalPages;
}

// === CRUD ===

window.descartarAlerta = async function (alerta_id) {
  if (!confirm('Marcar esta alerta como vista?')) return;
  try {
    await apiFetch('/alertas', { method: 'POST', body: { accion: 'descartar', alerta_id } });
    cargarAlertas();
  } catch (e) { alert('Error: ' + e.message); }
};

window.eliminarAlertaManual = async function (id) {
  if (!confirm('Eliminar esta alerta manual?')) return;
  try {
    await apiFetch('/alertas?id=' + id, { method: 'DELETE' });
    cargarAlertas();
  } catch (e) { alert('Error: ' + e.message); }
};

window.editarAlertaManual = function (alerta) {
  document.getElementById('editar-alerta-id').value = alerta.id;
  document.getElementById('editar-alerta-titulo').value = alerta.titulo || '';
  document.getElementById('editar-alerta-mensaje').value = alerta.mensaje || '';
  document.getElementById('editar-alerta-vencimiento').value = alerta.fecha_vencimiento || '';
  document.getElementById('modal-editar-alerta')?.classList.remove('hidden');
  document.getElementById('modal-editar-alerta')?.classList.add('flex');
};

window.cerrarModalEditarAlerta = function () {
  document.getElementById('modal-editar-alerta')?.classList.add('hidden');
  document.getElementById('modal-editar-alerta')?.classList.remove('flex');
};

window.submitEditarAlerta = async function (e) {
  e.preventDefault();
  const id = Number(document.getElementById('editar-alerta-id')?.value);
  const titulo = document.getElementById('editar-alerta-titulo')?.value;
  const mensaje = document.getElementById('editar-alerta-mensaje')?.value;
  const fecha_vencimiento = document.getElementById('editar-alerta-vencimiento')?.value;
  if (!titulo) return alert('Titulo requerido');
  try {
    await apiFetch('/alertas', { method: 'PUT', body: { id, titulo, mensaje, fecha_vencimiento } });
    cerrarModalEditarAlerta();
    cargarAlertas();
  } catch (e) { alert('Error: ' + e.message); }
};

window.enviarWhatsAppAlerta = function (j) {
  const tel = j.telefono;
  if (!tel) { alert('Sin numero de telefono'); return; }
  let num = tel.replace(/[^0-9]/g, '');
  if (num.length === 10) num = '57' + num;
  const mes = new Date().toLocaleDateString('es-ES', { month: 'long' });
  let msg;
  if (j.tipo_alerta === 'VENCIMIENTO') {
    msg = `Hola ${j.nombre}, le escribimos de EFUSA. Ya comenzo el mes de ${mes} y aun no recibimos su pago. Monto: $${(j.deuda || 0).toLocaleString()}. Gracias.`;
  } else if (j.tipo === 'manual') {
    msg = `${j.mensaje || 'Le escribimos de EFUSA.'}`;
  } else {
    msg = `Hola ${j.nombre}, le escribimos de EFUSA. Tiene un saldo pendiente de $${(j.deuda || 0).toLocaleString()}. Por favor ponese al dia. Gracias.`;
  }
  window.open(`https://wa.me/57${num}?text=${encodeURIComponent(msg)}`, '_blank');
};

window.abrirModalAlertaManual = function () {
  document.getElementById('modal-alerta-manual')?.classList.remove('hidden');
  document.getElementById('modal-alerta-manual')?.classList.add('flex');
  cargarJugadoresSelect();
};

window.cerrarModalAlertaManual = function () {
  document.getElementById('modal-alerta-manual')?.classList.add('hidden');
  document.getElementById('modal-alerta-manual')?.classList.remove('flex');
  document.getElementById('formAlertaManual')?.reset();
};

async function cargarJugadoresSelect() {
  try {
    const jugadores = await apiFetch('/jugadores');
    const sel = document.getElementById('alerta-jugador-id');
    if (sel) {
      sel.innerHTML = '<option value="">General (sin jugador)</option>' +
        jugadores.map(j => `<option value="${j.id}">${j.nombre} ${j.apellidos || ''} (${j.categoria || ''})</option>`).join('');
    }
  } catch (e) { console.error(e); }
}

window.submitAlertaManual = async function (e) {
  e.preventDefault();
  const titulo = document.getElementById('alerta-titulo')?.value;
  const mensaje = document.getElementById('alerta-mensaje')?.value;
  const jugador_id = document.getElementById('alerta-jugador-id')?.value;
  const fecha_vencimiento = document.getElementById('alerta-vencimiento')?.value;
  if (!titulo) return alert('Titutlo requerido');
  try {
    await apiFetch('/alertas', {
      method: 'POST',
      body: { accion: 'crear', titulo, mensaje, jugador_id: jugador_id ? Number(jugador_id) : null, fecha_vencimiento }
    });
    cerrarModalAlertaManual();
    cargarAlertas();
  } catch (e) { alert('Error: ' + e.message); }
};

window.enviarMasivoAlertas = async function () {
  const filtrados = getFiltrados();
  if (!filtrados.length) return alert('No hay alertas para enviar');
  if (!confirm(`Enviar WhatsApp masivo a ${filtrados.length} deudores?`)) return;
  try {
    const ids = filtrados.map(a => a.id);
    const res = await apiFetch('/alertas', {
      method: 'POST',
      body: { accion: 'whatsapp_masivo', alertas_ids: ids, mensaje: '' }
    });
    alert(`Encolados ${res.encolados} mensajes. Ve a Centro WhatsApp para ver la cola.`);
  } catch (e) { alert('Error: ' + e.message); }
};
