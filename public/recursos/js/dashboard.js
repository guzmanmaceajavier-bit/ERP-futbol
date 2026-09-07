import { apiFetch, getMensualidadObjetivo, CATEGORIAS } from './configuracion.js';

let jugadoresList = [];
let listaPagos = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 8;

let tabla, buscador, filtroCategoria, infoPaginacion, btnPrev, btnNext, containerActividad;
let chartRecaudado = null, chartCategorias = null, chartJugadoresCat = null, chartAsistencia = null;

document.addEventListener('DOMContentLoaded', () => {
  tabla = document.getElementById('tabla-jugadores');
  buscador = document.getElementById('buscador');
  filtroCategoria = document.getElementById('filtro-categoria');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');
  containerActividad = document.getElementById('actividad-feed');
  if (buscador) buscador.addEventListener('input', filtrar);
  if (filtroCategoria) filtroCategoria.addEventListener('change', filtrar);
  cargarDatos();
});

async function cargarDatos() {
  try {
    const resultados = await Promise.allSettled([
      apiFetch('/jugadores'),
      apiFetch('/pagos'),
      apiFetch('/reportes?tipo=recaudado-por-mes'),
      apiFetch('/reportes?tipo=estado-cuenta'),
    ]);
    if (resultados[0].status === 'fulfilled') {
      jugadoresList = Array.isArray(resultados[0].value) ? resultados[0].value : [];
    }
    if (resultados[1].status === 'fulfilled') {
      listaPagos = Array.isArray(resultados[1].value) ? resultados[1].value : [];
      listaPagos.sort((a, b) => new Date(b.created_at || b.fecha) - new Date(a.created_at || a.fecha));
    }
    renderTabla();
    renderActividad();
    renderTopPagadores();
    renderChartJugadoresCat();
    renderChartAsistencia();
    if (resultados[2].status === 'fulfilled') renderChartRecaudado(resultados[2].value);
    if (resultados[3].status === 'fulfilled') renderChartCategorias(resultados[3].value);
  } catch (error) {
    console.error('Error critico:', error);
  }
}

function filtrar() { paginaActual = 1; renderTabla(); }

function renderTabla() {
  if (!tabla) return;
  tabla.innerHTML = '';
  const texto = buscador ? buscador.value.toLowerCase() : '';
  const cat = filtroCategoria ? filtroCategoria.value : '';
  const filtrados = jugadoresList.filter(j => {
    const nombreCompleto = `${j.nombre || ''} ${j.apellidos || ''}`.toLowerCase();
    return nombreCompleto.includes(texto) && (cat === '' || j.categoria === cat);
  });
  const totalItems = filtrados.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const datosPagina = filtrados.slice(inicio, fin);
  if (datosPagina.length === 0) {
    tabla.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-slate-400 text-sm">No hay datos.</td></tr>`;
  } else {
    datosPagina.forEach(j => {
      const valor = Number(j.mensualidad || 0);
      const meta = getMensualidadObjetivo(j.categoria);
      let estadoHtml = '';
      if (valor >= meta) {
        estadoHtml = '<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">Al dia</span>';
      } else if (valor > 0) {
        estadoHtml = '<span class="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold">Abono</span>';
      } else {
        estadoHtml = '<span class="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold">Pendiente</span>';
      }
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 border-b border-slate-100 transition";
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 text-sm">${j.nombre} ${j.apellidos || ''}</div>
          ${j.numero_identificacion ? `<div class="text-[10px] text-slate-400">${j.numero_identificacion}</div>` : ''}
        </td>
        <td class="px-4 py-3 text-slate-600 hidden sm:table-cell text-xs">${j.categoria || '-'}</td>
        <td class="px-4 py-3 text-slate-600 text-xs">${j.telefono ? `<a href="tel:${j.telefono}" class="hover:text-brand-600 hover:underline">${j.telefono}</a>` : '-'}</td>
        <td class="px-4 py-3 text-center">${estadoHtml}<div class="text-[10px] text-slate-400 mt-0.5">$${valor.toLocaleString()}</div></td>
      `;
      tabla.appendChild(tr);
    });
  }
  if (infoPaginacion) infoPaginacion.textContent = `Mostrando ${datosPagina.length} de ${totalItems} registros`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual >= totalPages;
}

function renderActividad() {
  if (!containerActividad) return;
  containerActividad.innerHTML = '';
  if (!listaPagos || listaPagos.length === 0) {
    containerActividad.innerHTML = '<div class="text-center text-xs text-slate-400 py-8 italic">No hay pagos registrados.</div>';
    return;
  }
  const ultimos5 = listaPagos.slice(0, 5);
  ultimos5.forEach((p, idx) => {
    const fechaObj = new Date(p.fecha || p.created_at);
    const hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const fechaCorta = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const item = document.createElement('div');
    item.className = `relative pl-8 ${idx < ultimos5.length - 1 ? 'pb-5' : ''}`;
    let icono = 'ph-money';
    let colorFondo = 'bg-emerald-100 text-emerald-600';
    if (p.tipo === 'inscripcion') { icono = 'ph-id-card'; colorFondo = 'bg-blue-100 text-blue-600'; }
    if (p.tipo === 'uniforme') { icono = 'ph-t-shirt'; colorFondo = 'bg-violet-100 text-violet-600'; }
    if (idx < ultimos5.length - 1) {
      item.innerHTML += `<div class="absolute left-3.5 top-8 bottom-0 w-px bg-slate-200"></div>`;
    }
    item.innerHTML += `
      <div class="absolute left-0 top-0 w-7 h-7 rounded-full ${colorFondo} border-2 border-white shadow-sm flex items-center justify-center z-10">
        <i class="ph ${icono} text-xs"></i>
      </div>
      <div class="pl-2">
        <div class="flex justify-between items-start">
          <p class="text-xs font-bold text-slate-700 leading-tight">${p.jugador || 'Desconocido'}</p>
          <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">${fechaCorta}</span>
        </div>
        <div class="flex items-center justify-between mt-0.5">
          <p class="text-[10px] text-slate-500">${p.tipo || 'Mensualidad'}</p>
          <span class="text-xs font-bold text-emerald-600">$${Number(p.monto).toLocaleString()}</span>
        </div>
        <p class="text-[10px] text-slate-400 mt-0.5">${hora}</p>
      </div>
    `;
    containerActividad.appendChild(item);
  });
}

function renderChartRecaudado(datos) {
  const ctx = document.getElementById('chart-recaudado');
  const empty = document.getElementById('chart-recaudado-empty');
  if (!ctx || !datos || datos.length === 0) {
    if (empty) empty.classList.remove('hidden');
    if (ctx) ctx.parentElement.style.display = 'none';
    return;
  }
  if (empty) empty.classList.add('hidden');
  if (chartRecaudado) chartRecaudado.destroy();
  chartRecaudado = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: datos.map(d => d.mes),
      datasets: [{
        label: 'Recaudado',
        data: datos.map(d => Number(d.total)),
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          gradient.addColorStop(0, '#22c55e');
          gradient.addColorStop(1, '#15803d');
          return gradient;
        },
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 40,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => '$' + ctx.raw.toLocaleString() }, backgroundColor: '#0F172A', titleFont: { weight: 'bold' }, padding: 10, cornerRadius: 8 }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v), font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function renderChartCategorias(datos) {
  const ctx = document.getElementById('chart-categorias');
  const empty = document.getElementById('chart-categorias-empty');
  const legend = document.getElementById('categorias-legend');
  if (!ctx || !datos || datos.length === 0) {
    if (empty) empty.classList.remove('hidden');
    if (ctx) ctx.parentElement.style.display = 'none';
    return;
  }
  if (empty) empty.classList.add('hidden');
  if (chartCategorias) chartCategorias.destroy();
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
  chartCategorias = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: datos.map(d => d.categoria),
      datasets: [{
        data: datos.map(d => Number(d.total)),
        backgroundColor: colors.slice(0, datos.length),
        borderWidth: 0,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw + ' jugadores' }, backgroundColor: '#0F172A', padding: 10, cornerRadius: 8 }
      }
    }
  });
  if (legend) {
    const total = datos.reduce((s, d) => s + Number(d.total), 0) || 1;
    legend.innerHTML = datos.map((d, i) => `<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${colors[i%colors.length]}"></span><span class="truncate flex-1">${d.categoria}</span><span class="font-bold">${Number(d.total)}</span><span class="text-slate-400 text-[10px]">(${(Number(d.total)/total*100).toFixed(0)}%)</span></div>`).join('');
  }
}

function renderChartJugadoresCat() {
  const ctx = document.getElementById('chart-jugadores-cat');
  if (!ctx || jugadoresList.length === 0) return;
  const catMap = {};
  jugadoresList.forEach(j => {
    const cat = j.categoria || 'Sin categoria';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const labels = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]);
  const data = labels.map(k => catMap[k]);
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  if (chartJugadoresCat) chartJugadoresCat.destroy();
  chartJugadoresCat = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderRadius: 6, maxBarThickness: 30 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8 }},
      scales: { x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, font: { size: 10 } } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } }
    }
  });
}

function renderChartAsistencia() {
  const ctx = document.getElementById('chart-asistencia');
  if (!ctx) return;
  const dias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const data = dias.map(() => Math.floor(Math.random() * 20) + 10);
  if (chartAsistencia) chartAsistencia.destroy();
  chartAsistencia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dias,
      datasets: [{
        label: 'Asistencia',
        data,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: ctx => ctx.raw + ' asistencias' } }},
      scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
    }
  });
}

function renderTopPagadores() {
  const container = document.getElementById('top-pagadores');
  if (!container) return;
  const pagosMap = {};
  jugadoresList.forEach(j => {
    const nombre = `${j.nombre || ''} ${j.apellidos || ''}`.trim();
    if (nombre) pagosMap[nombre] = Number(j.mensualidad || 0);
  });
  const sorted = Object.entries(pagosMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (sorted.length === 0) {
    container.innerHTML = '<div class="text-center text-xs text-slate-400 py-4">Sin datos.</div>';
    return;
  }
  const maxVal = sorted[0][1] || 1;
  container.innerHTML = sorted.map(([nombre, monto], i) => {
    const medals = ['bg-amber-400', 'bg-slate-400', 'bg-amber-600', 'bg-slate-300', 'bg-slate-300'];
    const pct = (monto / maxVal * 100);
    return `<div class="flex items-center gap-3">
      <div class="w-7 h-7 rounded-full ${medals[i]} text-white flex items-center justify-center text-[10px] font-black shrink-0">${i + 1}</div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-700 truncate">${nombre}</span><span class="text-xs font-bold text-emerald-600">$${monto.toLocaleString()}</span></div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1"><div class="bg-emerald-500 h-1.5 rounded-full" style="width:${pct}%"></div></div>
      </div>
    </div>`;
  }).join('');
}

function exportarExcel() {
  if (typeof XLSX === 'undefined') { alert("Libreria Excel no cargada."); return; }
  if (jugadoresList.length === 0) { alert("No hay datos."); return; }
  try {
    const datosExportar = jugadoresList.map(j => {
      const valor = Number(j.mensualidad);
      const meta = getMensualidadObjetivo(j.categoria);
      let estado = 'Pendiente';
      if (valor >= meta) estado = 'Pago';
      else if (valor > 0) estado = 'Abono';
      return { "Nombre": `${j.nombre} ${j.apellidos}`, "Categoria": j.categoria || '-', "Telefono": j.telefono || '-', "Estado": estado, "Mensualidad": valor };
    });
    const hoja = XLSX.utils.json_to_sheet(datosExportar);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Jugadores EFUSA");
    XLSX.writeFile(libro, `Reporte_Jugadores_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (error) { console.error(error); alert("Error al generar Excel."); }
}

function exportarPDF() {
  if (typeof window.jspdf === 'undefined') { alert("Libreria jsPDF no cargada."); return; }
  if (jugadoresList.length === 0) { alert("No hay datos."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Reporte de Jugadores - EFUSA", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 28);
  const datosTabla = jugadoresList.map(j => {
    const valor = Number(j.mensualidad);
    const meta = getMensualidadObjetivo(j.categoria);
    let estado = 'Pendiente';
    if (valor >= meta) estado = 'Pago';
    else if (valor > 0) estado = 'Abono';
    return [`${j.nombre} ${j.apellidos || ''}`, j.categoria || '-', j.telefono || '-', estado, `$${valor.toLocaleString()}`];
  });
  doc.autoTable({ head: [['Nombre', 'Categoria', 'Telefono', 'Estado', 'Monto']], body: datosTabla, startY: 35, headStyles: { fillColor: [22, 163, 74] }, styles: { fontSize: 9 } });
  doc.save(`Reporte_Jugadores_${new Date().toISOString().slice(0,10)}.pdf`);
}

async function exportarCompleto() {
  try {
    const data = await apiFetch('/reportes?tipo=exportar-completo');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `efusa_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
  }
}

window.cambiarPagina = (d) => { paginaActual += d; renderTabla(); };
window.exportarExcel = exportarExcel;
window.exportarPDF = exportarPDF;
window.exportarCompleto = exportarCompleto;
