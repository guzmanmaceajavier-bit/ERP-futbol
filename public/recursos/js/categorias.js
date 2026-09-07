import { apiFetch } from './configuracion.js';

let todasLasCategorias = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 8;
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('formCat')?.addEventListener('submit', guardarCategoria);
  cargarCategorias();
});

async function cargarCategorias() {
  try {
    todasLasCategorias = await apiFetch('/categorias');
  } catch (e) {
    console.error(e);
    todasLasCategorias = [];
  }
  renderTabla();
}

function getFiltrados() {
  const q = (document.getElementById('buscador')?.value || '').toLowerCase();
  const fTipo = document.getElementById('f-tipo')?.value || '';
  const fEstado = document.getElementById('f-estado')?.value || '';
  return todasLasCategorias.filter(c => {
    if (q && !c.nombre.toLowerCase().includes(q)) return false;
    if (fTipo && c.tipo_genero !== fTipo) return false;
    if (fEstado === 'activa' && !c.activo) return false;
    if (fEstado === 'pausada' && c.activo) return false;
    return true;
  });
}

function renderTabla() {
  const tbody = document.getElementById('tabla-cat');
  const infoPag = document.getElementById('info-paginacion');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const totalCat = document.getElementById('total-cat');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtrados = getFiltrados();
  const totalItems = filtrados.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  const page = filtrados.slice((paginaActual - 1) * FILAS_POR_PAGINA, paginaActual * FILAS_POR_PAGINA);

  if (totalCat) totalCat.textContent = totalItems + ' CATEGORIAS';

  if (page.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-slate-400">No hay categorias</td></tr>`;
    if (infoPag) infoPag.textContent = '0 registros';
    if (btnPrev) btnPrev.disabled = true;
    if (btnNext) btnNext.disabled = true;
    return;
  }

  page.forEach(c => {
    const tr = document.createElement('tr');
    tr.className = `hover:bg-slate-50 border-b border-slate-100 transition ${c.activo === false ? 'opacity-50' : ''}`;
    const tipoColor = c.tipo_genero === 'Femenino' ? 'bg-pink-50 text-pink-700 border-pink-200' : c.tipo_genero === 'Masculino' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200';
    const estadoBadge = c.activo === false
      ? '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500"><i class="ph ph-pause"></i> Pausada</span>'
      : '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><i class="ph ph-check-circle"></i> Activa</span>';
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="font-bold text-sm text-slate-900">${c.nombre}</div>
      </td>
      <td class="px-4 py-3">
        <span class="text-xs px-2 py-1 rounded-full font-bold border ${tipoColor}">${c.tipo_genero || 'Mixto'}</span>
      </td>
      <td class="px-4 py-3 text-right font-black text-sm">$${Number(c.mensualidad_base || 0).toLocaleString()}</td>
      <td class="px-4 py-3 text-center">
        <span class="bg-slate-900 text-white px-2 py-1 rounded-full text-xs font-bold">${c.total_jugadores || 0}</span>
      </td>
      <td class="px-4 py-3 text-center">${estadoBadge}</td>
      <td class="px-4 py-3">
        <div class="flex justify-center gap-1">
          <button onclick="editarCategoria(${c.id})" class="w-8 h-8 rounded-lg bg-white border hover:bg-slate-50 flex items-center justify-center text-slate-600" title="Editar"><i class="ph ph-pencil-simple"></i></button>
          <button onclick="togglePausarCategoria(${c.id})" class="w-8 h-8 rounded-lg ${c.activo === false ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'} flex items-center justify-center" title="${c.activo === false ? 'Reactivar' : 'Pausar'}"><i class="ph ${c.activo === false ? 'ph-play' : 'ph-pause'}"></i></button>
          <button onclick="eliminarCategoria(${c.id}, '${c.nombre}')" class="w-8 h-8 rounded-lg bg-white border hover:bg-rose-50 text-rose-600 flex items-center justify-center" title="Eliminar"><i class="ph ph-trash"></i></button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  if (infoPag) infoPag.textContent = `Mostrando ${page.length} de ${totalItems} registros`;
  if (btnPrev) btnPrev.disabled = paginaActual <= 1;
  if (btnNext) btnNext.disabled = paginaActual >= totalPages;
}

window.cambiarPagina = (d) => { paginaActual += d; renderTabla(); };

window.abrirModalNueva = function () {
  editandoId = null;
  const form = document.getElementById('formCat');
  if (form) form.reset();
  document.getElementById('modal-title-cat').textContent = 'Nueva Categoria';
  document.getElementById('modal-icon-cat').className = 'ph ph-tag';
  document.getElementById('btn-guardar-cat').textContent = 'Crear Categoria';
  document.getElementById('modal-cat')?.classList.remove('hidden');
  document.getElementById('modal-cat')?.classList.add('flex');
};

window.editarCategoria = function (id) {
  const cat = todasLasCategorias.find(c => c.id === id);
  if (!cat) return;
  editandoId = id;
  document.getElementById('cat-nombre').value = cat.nombre;
  document.getElementById('cat-tipo').value = cat.tipo_genero || 'Mixto';
  document.getElementById('cat-monto').value = cat.mensualidad_base || 50000;
  document.getElementById('modal-title-cat').textContent = 'Editar Categoria';
  document.getElementById('modal-icon-cat').className = 'ph ph-pencil-simple';
  document.getElementById('btn-guardar-cat').textContent = 'Actualizar Categoria';
  document.getElementById('modal-cat')?.classList.remove('hidden');
  document.getElementById('modal-cat')?.classList.add('flex');
};

window.cerrarModalCat = function () {
  document.getElementById('modal-cat')?.classList.add('hidden');
  document.getElementById('modal-cat')?.classList.remove('flex');
  editandoId = null;
  const form = document.getElementById('formCat');
  if (form) form.reset();
};

async function guardarCategoria(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('cat-nombre').value,
    tipo_genero: document.getElementById('cat-tipo').value,
    mensualidad_base: Number(document.getElementById('cat-monto').value) || 50000,
  };
  try {
    if (editandoId) {
      await apiFetch('/categorias', { method: 'PUT', body: { ...payload, id: editandoId } });
      mostrarNotificacion('Categoria actualizada', 'success');
    } else {
      await apiFetch('/categorias', { method: 'POST', body: payload });
      mostrarNotificacion('Categoria creada', 'success');
    }
    cerrarModalCat();
    cargarCategorias();
  } catch (err) {
    mostrarNotificacion('Error: ' + err.message, 'error');
  }
}

window.togglePausarCategoria = async function (id) {
  const cat = todasLasCategorias.find(c => c.id === id);
  if (!cat) return;
  const accion = cat.activo === false ? 'reactivar' : 'pausar';
  if (!confirm(`Estas seguro de ${accion} la categoria "${cat.nombre}"? Los jugadores no podran ser asignados a ella.`)) return;
  try {
    await apiFetch('/categorias', { method: 'PATCH', body: { id } });
    mostrarNotificacion(`Categoria ${accion === 'pausar' ? 'pausada' : 'reactivada'}`, 'success');
    cargarCategorias();
  } catch (err) {
    mostrarNotificacion('Error: ' + err.message, 'error');
  }
};

window.eliminarCategoria = async function (id, nombre) {
  if (!confirm(`Eliminar la categoria "${nombre}"? Solo se puede si no tiene jugadores activos.`)) return;
  try {
    await apiFetch('/categorias?id=' + id, { method: 'DELETE' });
    mostrarNotificacion('Categoria eliminada', 'success');
    cargarCategorias();
  } catch (err) {
    mostrarNotificacion('Error: ' + err.message, 'error');
  }
};

function mostrarNotificacion(mensaje, tipo = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const colores = tipo === 'error' ? 'bg-rose-500' : tipo === 'success' ? 'bg-emerald-500' : 'bg-blue-500';
  toast.className = `${colores} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-bold pointer-events-auto transform transition-all duration-300 translate-y-4 opacity-0`;
  toast.textContent = mensaje;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.classList.remove('translate-y-4', 'opacity-0'); });
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Filtros
['buscador', 'f-tipo', 'f-estado'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => { paginaActual = 1; renderTabla(); });
  if (el) el.addEventListener('change', () => { paginaActual = 1; renderTabla(); });
});
