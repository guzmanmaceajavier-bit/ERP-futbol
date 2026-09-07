import { apiFetch, getMensualidadObjetivo, CATEGORIAS } from './configuracion.js';
const FILAS_POR_PAGINA = 5;
// RESTORED
let todosLosJugadores = [];
let paginaActual = 1;

// Elementos DOM
let modal, backdrop, panel, form, tbody, infoPaginacion, btnPrev, btnNext;

// ==========================
// INICIALIZACION
// ==========================
let vistaActual = 'lista';
document.addEventListener('DOMContentLoaded', () => {
  modal = document.getElementById('modal-jugador');
  backdrop = document.getElementById('modal-backdrop'); 
  panel = document.getElementById('modal-panel'); 
  form = document.getElementById('formJugador');
  tbody = document.getElementById('tabla-jugadores');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');

  if (form) form.addEventListener('submit', guardarJugador);
  if (modal && backdrop) backdrop.addEventListener('click', cerrarModal);

  // Filtros premium
  ['buscador','f-genero','f-categoria','f-estado'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('input', ()=>{ paginaActual=1; renderTabla(); });
    if(el) el.addEventListener('change', ()=>{ paginaActual=1; renderTabla(); });
  });
  const btnList=document.getElementById('btn-view-list');
  const btnGrid=document.getElementById('btn-view-grid');
  if(btnList) btnList.addEventListener('click', ()=> setVista('lista'));
  if(btnGrid) btnGrid.addEventListener('click', ()=> setVista('grid'));

  cargarJugadores();
});
function setVista(v){
  vistaActual=v;
  document.getElementById('btn-view-list')?.classList.toggle('bg-white', v==='lista');
  document.getElementById('btn-view-list')?.classList.toggle('text-slate-900', v==='lista');
  document.getElementById('btn-view-grid')?.classList.toggle('bg-white', v==='grid');
  document.getElementById('btn-view-grid')?.classList.toggle('text-slate-900', v==='grid');
  renderTabla();
}

// ==========================
// DATOS (CRUD)
// ==========================
async function cargarJugadores() {
  try {
    const data = await apiFetch('/jugadores');
    todosLosJugadores = Array.isArray(data) ? data : [];
    
    actualizarEstadisticas();
    renderTabla();
  } catch (error) {
    mostrarNotificacion('Error al cargar jugadores: ' + error.message, 'error');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 p-4">Error de conexion.</td></tr>`;
  }
}

async function guardarJugador(e) {
  e.preventDefault();
  
  const id = document.getElementById('jugador-id').value;
  const esEdicion = !!id;

  // Generar QR si no existe
  const nombreVal=document.getElementById('nombre').value;
  const apellidosVal=document.getElementById('apellidos').value;
  const qrTexto=`EFUSA-${nombreVal}-${apellidosVal}-${Date.now()}`.slice(0,60);
  if(!document.getElementById('qr_code').value && window.generarQR) window.generarQR(qrTexto);
  const payload = {
    nombre: nombreVal,
    apellidos: apellidosVal,
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
    tipo_identificacion: document.getElementById('tipo_identificacion').value,
    numero_identificacion: document.getElementById('numero_identificacion').value,
    categoria: document.getElementById('categoria').value,
    telefono: document.getElementById('telefono').value,
    mensualidad: Number(document.getElementById('mensualidad').value) || 0,
    activo: document.getElementById('activo').checked,
    genero: document.getElementById('genero')?.value || 'Masculino',
    tipo_beca: document.getElementById('tipo_beca')?.value || 'Normal',
    acudiente_nombre: document.getElementById('acudiente_nombre')?.value || '',
    acudiente_telefono: document.getElementById('acudiente_telefono')?.value || '',
    acudiente_parentesco: document.getElementById('acudiente_parentesco')?.value || '',
    whatsapp_opt_out: document.getElementById('whatsapp_opt_out')?.checked || false,
    foto_url: document.getElementById('foto_url')?.value || null,
    qr_code: document.getElementById('qr_code')?.value || qrTexto
  };
  if (esEdicion) payload.id = Number(id);

  try {
    if (esEdicion) {
      await apiFetch(`/jugadores?id=${id}`, { method: 'PUT', body: payload });
      mostrarNotificacion('Jugador actualizado correctamente');
    } else {
      await apiFetch('/jugadores', { method: 'POST', body: payload });
      mostrarNotificacion('Jugador registrado correctamente');
    }
    
    cerrarModal();
    cargarJugadores(); 
  } catch (error) {
    mostrarNotificacion('Error: ' + error.message, 'error');
  }
}

async function eliminarJugador(id) {
  if (!confirm("Estas seguro de eliminar este jugador?")) return;
  
  try {
    await apiFetch(`/jugadores?id=${id}`, { method: 'DELETE' });
    mostrarNotificacion('Jugador eliminado', 'info');
    cargarJugadores();
  } catch (error) {
    mostrarNotificacion('Error al eliminar: ' + error.message, 'error');
  }
}

// ==========================
// RENDERIZADO & UTILIDADES
// ==========================
function calcularEstado(pagado, categoria, jugador) {
  let meta = getMensualidadObjetivo(categoria);
  if (jugador?.descuento_beca) meta = Math.round(meta * (1 - Number(jugador.descuento_beca)/100));
  if (meta===0) return { texto: 'Becado', color: 'bg-purple-100 text-purple-700 border border-purple-200', key: 'becado' };
  if (pagado >= meta) {
    if(jugador?.proximo_vencimiento){
      const venc=new Date(jugador.proximo_vencimiento+'T00:00:00');
      const hoy=new Date(); hoy.setHours(0,0,0,0);
      if(venc < hoy) return { texto: 'Vencido', color: 'bg-rose-100 text-rose-700 border border-rose-200', key: 'vencido' };
    }
    return { texto: 'Al dia', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', key: 'al_dia' };
  }
  else if (pagado > 0) return { texto: `Abono ($${meta - pagado})`, color: 'bg-amber-100 text-amber-700 border border-amber-200', key: 'abono' };
  else return { texto: 'Debe', color: 'bg-rose-100 text-rose-700 border border-rose-200', key: 'debe' };
}

function getFiltrados(){
  const q = (document.getElementById('buscador')?.value || '').toLowerCase();
  const fGen = document.getElementById('f-genero')?.value || '';
  const fCat = document.getElementById('f-categoria')?.value || '';
  const fEst = document.getElementById('f-estado')?.value || '';
  return todosLosJugadores.filter(j=>{
    const nombre = `${j.nombre||''} ${j.apellidos||''} ${j.numero_identificacion||''} ${j.telefono||''} ${j.acudiente_nombre||''} ${j.acudiente_telefono||''}`.toLowerCase();
    if(q && !nombre.includes(q)) return false;
    if(fGen && j.genero !== fGen) return false;
    if(fCat && j.categoria !== fCat) return false;
    if(fEst){
      const estadoJ=calcularEstado(j.mensualidad, j.categoria, j);
      if(fEst!==estadoJ.key) return false;
    }
    return true;
  });
}

function renderTabla() {
  if (!tbody) return;
  tbody.innerHTML = '';
  const filtrados = getFiltrados();
  const totalItems = filtrados.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const datosPagina = filtrados.slice(inicio, inicio+FILAS_POR_PAGINA);

  if (datosPagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12"><div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400"><i class="ph ph-users-three"></i></div><p class="font-bold text-slate-700 mt-3">Sin jugadores</p></td></tr>`;
    if(infoPaginacion) infoPaginacion.innerText = `Mostrando 0 de ${totalItems} jugadores`;
    return;
  }

  datosPagina.forEach(j => {
    const estado = calcularEstado(j.mensualidad, j.categoria, j);
    const nombreCompleto = `${j.nombre||''} ${j.apellidos||''}`.trim();
    const fotoHtml = j.foto_url ? `<img src="${j.foto_url}" class="w-9 h-9 rounded-xl object-cover border">` : `<div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">${(j.nombre?.[0]||'J')+(j.apellidos?.[0]||'')}</div>`.toUpperCase();
    const generoBadge = j.genero==='Femenino' ? '<span class="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-bold">Nina</span>' : '<span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Nino</span>';
    const becaBadge = j.tipo_beca && j.tipo_beca!=='Normal' ? `<span class="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">${j.tipo_beca}</span>` : '';
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          ${fotoHtml}
          <div>
            <div class="font-bold text-slate-900 text-sm">${nombreCompleto}</div>
            <div class="text-[11px] text-slate-500">${j.numero_identificacion || 'Sin ID'}</div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3"><div class="flex items-center gap-1.5">${generoBadge} <span class="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg">${j.categoria}</span> ${becaBadge}</div></td>
      <td class="px-4 py-3"><div class="text-sm font-semibold">${j.acudiente_nombre||'-'}</div><div class="text-xs text-slate-500 flex items-center gap-1"><i class="ph ph-whatsapp-logo text-emerald-500"></i> ${j.acudiente_telefono||j.telefono||'-'}</div></td>
      <td class="px-4 py-3 text-center"><span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${estado.color}">${estado.texto}</span></td>
      <td class="px-4 py-3">
        <div class="flex justify-end gap-1">
          <button onclick="window.descargarReciboJugador(${j.id})" class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-black" title="Recibo"><i class="ph ph-receipt"></i></button>
          <a href="/pagos.html?jugador=${j.id}" class="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-black">Pagar</a>
          <button onclick="window.enviarWhatsAppJugador(${j.id})" class="w-8 h-8 rounded-lg bg-white border flex items-center justify-center text-emerald-600" title="WhatsApp"><i class="ph ph-whatsapp-logo"></i></button>
          <button onclick="editarJugador(${j.id})" class="w-8 h-8 rounded-lg bg-white border flex items-center justify-center text-slate-600"><i class="ph ph-pencil-simple"></i></button>
          <button onclick="eliminarJugador(${j.id})" class="w-8 h-8 rounded-lg bg-white border hover:bg-rose-50 text-rose-600 flex items-center justify-center"><i class="ph ph-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (infoPaginacion) {
    const inicioNum = (paginaActual-1)*FILAS_POR_PAGINA+1;
    const finNum = Math.min(paginaActual*FILAS_POR_PAGINA, totalItems);
    infoPaginacion.innerText = `Mostrando ${inicioNum} - ${finNum} de ${totalItems} jugadores`;
  }
  // Actualizar botones paginacion numerica si existen
}

function actualizarEstadisticas() {
  const total = todosLosJugadores.length;
  const activos = todosLosJugadores.filter(j=> j.activo!==false).length;
  let alDia=0, abono=0, debe=0, vencido=0;
  todosLosJugadores.forEach(j=>{
    const e=calcularEstado(j.mensualidad, j.categoria, j);
    if(e.key==='al_dia') alDia++;
    else if(e.key==='abono') abono++;
    else if(e.key==='debe') debe++;
    else if(e.key==='vencido') vencido++;
  });
  const elTotal = document.getElementById('stat-total');
  const elActivos = document.getElementById('stat-pagados');
  const elAbono = document.getElementById('stat-abono');
  const elDeud = document.getElementById('stat-pendientes');
  if(elTotal) elTotal.innerText = total;
  if(elActivos) elActivos.innerText = alDia;
  if(elAbono) elAbono.innerText = abono;
  if(elDeud) elDeud.innerText = debe + vencido;
}
window.enviarWhatsAppJugador = (id)=>{
  const j=todosLosJugadores.find(x=>x.id===id);
  if(!j) return;
  const tel=j.acudiente_telefono||j.telefono;
  if(!tel) return alert('Sin telefono');
  const h=new Date().getHours();
  const saludo=h<12?'Buenos dias':h<19?'Buenas tardes':'Buenas noches';
  const base=getMensualidadObjetivo(j.categoria); const desc=Number(j.descuento_beca||0); const obj=Math.round(base*(1-desc/100));
  const falta=Math.max(0, obj - Number(j.mensualidad||0));
  const escuelaJ=localStorage.getItem('escuela_nombre')||'Escuela';
  let msg=`${saludo} ${j.acudiente_nombre||j.nombre},%0A%0A`;
  if(obj===0){
    msg+=`Te escribimos de ${escuelaJ} por ${j.nombre} ${j.apellidos||''} (${j.categoria}). Actualmente tienes beca completa, sin pagos pendientes. Gracias!`;
  } else if(falta===0){
    msg+=`Muchas gracias por tener a ${j.nombre} al dia (${j.categoria}). Proximo vencimiento: ${j.proximo_vencimiento||"proximo mes"}. Gracias por tu compromiso! - ${escuelaJ}`;
  } else if(Number(j.mensualidad)>0){
    msg+=`Te escribimos por ${j.nombre} (${j.categoria}). Hemos recibido un abono, te faltan $${falta.toLocaleString()} para quedar al dia. Vencimiento: ${j.proximo_vencimiento||"proximo mes"}. Quedamos atentos. Gracias! - ${escuelaJ}`;
  } else {
    msg+=`Te escribimos de ${escuelaJ} por ${j.nombre} (${j.categoria}). Tienes un saldo pendiente de $${falta.toLocaleString()}. Te agradecemos ponerte al dia. Gracias! - ${escuelaJ}`;
  }
  window.open('https://wa.me/57'+tel.replace(/[^0-9]/g,'')+'?text='+msg,'_blank');
};
window.descargarReciboJugador = async (id)=>{
  const j=todosLosJugadores.find(x=>x.id===id);
  if(!j) return;
  // Buscar ultimo pago de ese jugador
  try{
    const pagos=await apiFetch('/pagos?jugador_id='+id);
    const ultimo = pagos.length? pagos[0] : null;
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF();
    doc.setFillColor(15,23,42); doc.rect(0,0,210,28,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text('EFUSA - Recibo',14,14);
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text('Jugador: '+j.nombre+' '+(j.apellidos||'')+'  |  Categoria: '+j.categoria,14,20);
    doc.setTextColor(0,0,0);
    doc.setFontSize(10); doc.text('Documento: '+(j.numero_identificacion||'-')+'  |  Telefono: '+(j.acudiente_telefono||j.telefono||'-'),14,36);
    doc.text('Estado: '+ (ultimo? ultimo.tipo+' - $'+Number(ultimo.monto).toLocaleString() : 'Sin pagos'),14,42);
    if(ultimo){
      doc.autoTable({ startY:48, head:[['Fecha','Concepto','Monto','Recibo']], body:[[ultimo.fecha?.slice(0,10)||'', ultimo.tipo||'', '$'+Number(ultimo.monto).toLocaleString(), ultimo.recibo_numero||'REC']], headStyles:{fillColor:[22,163,74]} });
      doc.text('Vencimiento: '+(ultimo.vencimiento||''),14, doc.lastAutoTable.finalY+8);
    } else {
      doc.text('Aun no hay pagos registrados para este jugador.',14,48);
    }
    doc.save('Recibo_'+j.nombre.replace(/\s+/g,'_')+'.pdf');
  }catch(e){ alert('Error generando recibo: '+e.message); }
};

// ==========================
// MODAL & ACCIONES
// ==========================
function abrirModal() {
  if (!form) return;
  form.reset();
  // Resetear visual de edad
  const display = document.getElementById('edad-display');
  if(display) display.style.opacity = '0';

  document.getElementById('jugador-id').value = '';
  document.getElementById('modal-title').innerText = 'Registrar Jugador';
  document.getElementById('modal-icon').className = 'ph ph-user-plus text-blue-600';
  document.getElementById('activo').checked = true;

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
      }
    }, 10);
  }
}

function cerrarModal() {
  if (!modal) return;
  if (backdrop) backdrop.classList.add('opacity-0');
  if (panel) {
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');
  }
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 200);
}

function editarJugador(id) {
  const jugador = todosLosJugadores.find(j => j.id === id);
  if (!jugador) return;

  document.getElementById('jugador-id').value = jugador.id;
  document.getElementById('nombre').value = jugador.nombre || '';
  document.getElementById('apellidos').value = jugador.apellidos || '';
  document.getElementById('fecha_nacimiento').value = jugador.fecha_nacimiento || '';
  
  // Disparar evento change manual para recalcular edad
  const fechaInput = document.getElementById('fecha_nacimiento');
  const event = new Event('change');
  fechaInput.dispatchEvent(event);

  document.getElementById('tipo_identificacion').value = jugador.tipo_identificacion || '';
  document.getElementById('numero_identificacion').value = jugador.numero_identificacion || '';
  document.getElementById('categoria').value = jugador.categoria;
  document.getElementById('telefono').value = jugador.telefono || '';
  document.getElementById('mensualidad').value = jugador.mensualidad;
  document.getElementById('activo').checked = jugador.activo;
  if(document.getElementById('genero')) document.getElementById('genero').value = jugador.genero || 'Masculino';
  if(document.getElementById('tipo_beca')) document.getElementById('tipo_beca').value = jugador.tipo_beca || 'Normal';
  if(document.getElementById('acudiente_nombre')) document.getElementById('acudiente_nombre').value = jugador.acudiente_nombre || '';
  if(document.getElementById('acudiente_telefono')) document.getElementById('acudiente_telefono').value = jugador.acudiente_telefono || '';
  if(document.getElementById('acudiente_parentesco')) document.getElementById('acudiente_parentesco').value = jugador.acudiente_parentesco || '';
  if(document.getElementById('whatsapp_opt_out')) document.getElementById('whatsapp_opt_out').checked = !!jugador.whatsapp_opt_out;
  if(document.getElementById('foto_url')){
    document.getElementById('foto_url').value = jugador.foto_url || '';
    const prev=document.getElementById('foto-preview');
    if(jugador.foto_url && prev) prev.innerHTML=`<img src="${jugador.foto_url}" class="w-full h-full object-cover">`;
    else if(prev) prev.innerHTML='<i class="ph ph-user text-3xl text-slate-300"></i>';
  }
  if(document.getElementById('qr_code')){
    document.getElementById('qr_code').value = jugador.qr_code || '';
    const qrPrev=document.getElementById('qr-preview');
    if(jugador.qr_code && qrPrev && window.QRCode){
      qrPrev.innerHTML='';
      new QRCode(qrPrev, { text: jugador.qr_code, width: 96, height: 96 });
    }
  }
  
  document.getElementById('modal-title').innerText = 'Editar Jugador';
  document.getElementById('modal-icon').className = 'ph ph-pencil-simple text-amber-500';

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
      }
    }, 10);
  }
}

function mostrarNotificacion(mensaje, tipo = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) {
    alert(mensaje); 
    return;
  }
  const toast = document.createElement('div');
  
  const estilos = {
    success: 'bg-emerald-500 text-white shadow-emerald-200',
    error: 'bg-rose-500 text-white shadow-rose-200',
    info: 'bg-blue-500 text-white shadow-blue-200'
  };
  const iconos = {
    success: '<i class="ph ph-check-circle text-xl"></i>',
    error: '<i class="ph ph-warning-circle text-xl"></i>',
    info: '<i class="ph ph-info text-xl"></i>'
  };

  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 toast-enter ${estilos[tipo]}`;
  toast.innerHTML = `${iconos[tipo]}<span class="font-medium text-sm">${mensaje}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function cambiarPagina(delta) {
  paginaActual += delta;
  renderTabla();
}

// Exportar funciones globales para HTML
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.editarJugador = editarJugador;
window.eliminarJugador = eliminarJugador;
window.cambiarPagina = cambiarPagina;


