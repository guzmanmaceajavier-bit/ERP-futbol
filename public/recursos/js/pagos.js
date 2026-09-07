import { apiFetch, MESES, CATEGORIAS, getMensualidadObjetivo } from './configuracion.js';

let todosLosPagos = [];
let jugadoresList = [];
let paginaActual = 1;
let pagoEnEdicion = null;

window.cambiarPagina = (d) => { paginaActual += d; filtrarPagos(); };

// --- CACHE DE ELEMENTOS DOM (lazy para que siempre existan) ---
const DOM = {};
function refreshDOM(){
  DOM.buscador = document.getElementById('buscador');
  DOM.fechaInicio = document.getElementById('filtro-inicio');
  DOM.fechaFin = document.getElementById('filtro-fin');
  DOM.selectJugador = document.getElementById('jugador_id');
  DOM.formPago = document.getElementById('formPago');
  DOM.tablaResumen = document.getElementById('tabla-resumen');
  DOM.vistaMovilResumen = document.getElementById('vista-movil-resumen');
  DOM.tablaPagos = document.getElementById('tabla-pagos');
  DOM.vistaMovilHistorial = document.getElementById('vista-movil-historial');
  DOM.selectMes = document.getElementById('mes_inicio_select');
  DOM.fechaInicioInput = document.getElementById('periodo_inicio');
  DOM.totalFiltrado = document.getElementById('total-filtrado');
}

document.addEventListener('DOMContentLoaded', () => {
  refreshDOM();
  inicializarEventos();
  Promise.all([cargarPagos(), cargarJugadoresSelect()])
    .then(() => {
      filtrarPagos();
      renderizarResumen('todos');
      inicializarFormulario();
      // Fallback: si viene ?jugador= y no se selecciono dentro de initBuscador
      const q=new URLSearchParams(location.search).get('jugador');
      if(q){
        const j=jugadoresList.find(x=> String(x.id)===String(q));
        if(j) seleccionarJugador(j);
      }
    })
    .catch(err => console.error("Error inicializando:", err));
});

function inicializarEventos() {
  // Filtros
  if (DOM.buscador) DOM.buscador.addEventListener('input', () => { paginaActual = 1; filtrarPagos(); });
  if (DOM.fechaInicio) DOM.fechaInicio.addEventListener('change', () => { paginaActual = 1; filtrarPagos(); });
  if (DOM.fechaFin) DOM.fechaFin.addEventListener('change', () => { paginaActual = 1; filtrarPagos(); });
  
  // Cambio de Jugador
  if (DOM.selectJugador) {
    DOM.selectJugador.addEventListener('change', () => {
      paginaActual = 1;
      filtrarPagos(); 
      renderizarResumen(document.querySelector('input[name="filtro-resumen"]:checked')?.value || 'todos');
      
      // Scroll suave al historial en movil
      const historialMovil = document.getElementById('vista-movil-historial');
      if(historialMovil) historialMovil.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Formulario
  if (DOM.formPago) DOM.formPago.addEventListener('submit', guardarPago);
}

function inicializarFormulario() {
  if (DOM.selectMes) {
    DOM.selectMes.innerHTML = MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('');
    DOM.selectMes.value = new Date().getMonth();
  }
  if (DOM.fechaInicioInput && !DOM.fechaInicioInput.value) {
    DOM.fechaInicioInput.valueAsDate = new Date();
  }
}

// --- LOGICA PAGO MULTIPLE (WINDOW PARA ACCESO HTML) ---
window.toggleMultiplePayment = function() {
  const val = document.querySelector('input[name="pago_multiple"]:checked').value;
  const wrapper = document.getElementById('pago-multiple-wrapper');
  if (val === 'si') { 
    wrapper.classList.remove('hidden'); 
    calcularPeriodo(); 
  } else { 
    wrapper.classList.add('hidden'); 
  }
  // Mostrar ayuda para abono
  const montoInput=document.getElementById('monto');
  if(val==='abono' && montoInput){
    montoInput.placeholder='Ej. 20000 (parcial)';
  } else if(montoInput){
    montoInput.placeholder='0';
  }
};

window.calcularPeriodo = function() {
  const cantidad = parseInt(document.getElementById('cantidad_meses').value) || 1;
  const mesInicioIdx = parseInt(document.getElementById('mes_inicio_select').value);
  const fechaInicioVal = document.getElementById('periodo_inicio').value;
  if(!fechaInicioVal) return;

  const fechaInicio = new Date(fechaInicioVal + 'T12:00:00'); 

  // Lista de meses (Texto)
  let lista = [];
  for(let i=0; i<cantidad; i++) {
    let idx = (mesInicioIdx + i) % 12; 
    lista.push(MESES[idx]);
  }
  const textoLista = lista.join(', ');
  const elResumen = document.getElementById('resumen-meses-texto');
  if(elResumen) elResumen.innerText = textoLista;

  // Fecha Fin
  const fechaFin = new Date(fechaInicio);
  fechaFin.setMonth(fechaFin.getMonth() + cantidad);
  fechaFin.setDate(fechaFin.getDate() - 1); 
  
  const y = fechaFin.getFullYear();
  const m = String(fechaFin.getMonth() + 1).padStart(2, '0');
  const d = String(fechaFin.getDate()).padStart(2, '0');
  const elPeriodoFin = document.getElementById('periodo_fin');
  if(elPeriodoFin) elPeriodoFin.value = `${y}-${m}-${d}`;

  // Proximo Pago
  const proximo = new Date(fechaFin);
  proximo.setDate(proximo.getDate() + 1); 
  
  const diaProx = String(proximo.getDate()).padStart(2,'0');
  const mesProx = MESES[proximo.getMonth()];
  const anioProx = proximo.getFullYear();
  
  const elNextPayment = document.getElementById('next_payment_preview');
  if(elNextPayment) elNextPayment.value = `${diaProx} de ${mesProx} de ${anioProx}`;
  
  const elMesPago = document.getElementById('mes_pago');
  if(elMesPago) {
    elMesPago.value = MESES[mesInicioIdx];
    elMesPago.dataset.listaMeses = textoLista;
  }
};

// --- DATOS ---
async function cargarPagos() {
  try { 
    const data = await apiFetch('/pagos'); 
    todosLosPagos = data; 
  } catch (e) { 
    mostrarNotificacion('Error cargando pagos', 'error'); 
    console.error(e); 
  }
}

async function cargarJugadoresSelect() {
  try { 
    const data = await apiFetch('/jugadores'); 
    jugadoresList = data; 
    window.jugadoresList = data;
    // Poblar select oculto para compatibilidad
    if (DOM.selectJugador) { 
      DOM.selectJugador.innerHTML = '<option value="">Seleccione...</option>'; 
      data.forEach(j => { 
        DOM.selectJugador.innerHTML += `<option value="${j.id}">${j.nombre} ${j.apellidos||''} (${j.categoria})</option>`; 
      }); 
    }
    initBuscadorInteligente();
  } catch(e) { console.error(e); }
}
function initBuscadorInteligente(){
  const input=document.getElementById('buscador-jugador');
  const filtroCat=document.getElementById('filtro-cat-pago');
  const gridContainer=document.getElementById('grid-jugadores-cat');
  const gridList=document.getElementById('grid-jugadores-list');
  const gridCount=document.getElementById('grid-count');
  if(!input || !gridContainer) return;

  function getFiltrados(q){
    const cat=filtroCat? filtroCat.value : '';
    q=(q||'').toLowerCase();
    return jugadoresList.filter(j=>{
      if(cat && j.categoria!==cat) return false;
      if(!q) return true;
      const txt=`${j.nombre} ${j.apellidos||''} ${j.numero_identificacion||''}`.toLowerCase();
      return txt.includes(q);
    });
  }

  function renderGrid(q){
    const res=getFiltrados(q);
    gridList.innerHTML='';
    gridCount.textContent=`${res.length} jugador${res.length!==1?'es':''}`;
    if(!res.length){
      gridList.innerHTML='<div class="col-span-full p-4 text-center text-sm text-slate-400">Sin jugadores en esta categoria</div>';
      gridContainer.classList.remove('hidden');
      return;
    }
    res.forEach(j=>{
      const base=getMensualidadObjetivo(j.categoria); const desc=Number(j.descuento_beca||0); const obj=Math.round(base*(1-desc/100));
      const pag=Number(j.mensualidad||0);
      const estado= obj===0? 'Becado' : pag>=obj? 'Al dia' : pag>0? 'Abono' : 'Debe';
      const colorEstado= estado==='Al dia'?'bg-emerald-100 text-emerald-700 border-emerald-200' : estado==='Abono'?'bg-amber-100 text-amber-700 border-amber-200' : estado==='Becado'?'bg-purple-100 text-purple-700 border-purple-200':'bg-rose-100 text-rose-700 border-rose-200';
      const colorBarra= estado==='Al dia'?'bg-emerald-500' : estado==='Abono'?'bg-amber-500' : estado==='Becado'?'bg-purple-500':'bg-rose-500';
      const iniciales=(j.nombre[0]||'J')+(j.apellidos?.[0]||'');
      const card=document.createElement('button');
      card.type='button';
      card.className=`relative text-left p-3 bg-white border rounded-xl hover:border-slate-400 hover:shadow-md transition cursor-pointer overflow-hidden`;
      card.innerHTML=`
        <div class="absolute top-0 left-0 h-1 ${colorBarra}" style="width:100%"></div>
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 shrink-0">${iniciales}</div>
          <div class="min-w-0 flex-1">
            <p class="font-bold text-xs text-slate-900 truncate">${j.nombre} ${j.apellidos||''}</p>
            <p class="text-[10px] text-slate-400">${j.categoria}</p>
          </div>
        </div>
        <span class="inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${colorEstado}">${estado}</span>`;
      card.onclick=()=> seleccionarJugador(j);
      gridList.appendChild(card);
    });
    gridContainer.classList.remove('hidden');
  }

  function seleccionarJugador(j){
    document.getElementById('jugador_id').value=j.id;
    input.value=j.nombre+' '+(j.apellidos||'');
    gridContainer.classList.add('hidden');
    mostrarFicha(j);
    paginaActual=1; filtrarPagos(); renderizarResumen('todos');
  }
  window.seleccionarJugador=seleccionarJugador;
  window.limpiarJugador=()=>{
    document.getElementById('jugador_id').value='';
    input.value='';
    document.getElementById('ficha-jugador').classList.add('hidden');
    paginaActual=1; filtrarPagos();
  };

  function mostrarFicha(j){
    const ficha=document.getElementById('ficha-jugador');
    if(!ficha) return;
    const base=getMensualidadObjetivo(j.categoria); const desc=Number(j.descuento_beca||0); const obj=Math.round(base*(1-desc/100));
    const pag=Number(j.mensualidad||0);
    const estado= obj===0? 'Becado' : pag>=obj? 'Al dia' : pag>0? 'Abono' : 'Debe';
    const falta=Math.max(0, obj-pag);
    const color= estado==='Al dia'?'bg-emerald-500' : estado==='Abono'?'bg-amber-500' : estado==='Becado'?'bg-purple-500':'bg-rose-500';
    document.getElementById('ficha-inicial').textContent=(j.nombre[0]||'J')+(j.apellidos?.[0]||'');
    document.getElementById('ficha-nombre').textContent=j.nombre+' '+(j.apellidos||'')+' ('+j.categoria+')';
    document.getElementById('ficha-detalle').textContent=`${j.genero||''} - ${j.tipo_identificacion||''} ${j.numero_identificacion||''} - Tel: ${j.telefono||''} - Acudiente: ${j.acudiente_nombre||'-'} (${j.acudiente_telefono||''})`;
    const estEl=document.getElementById('ficha-estado');
    estEl.textContent=estado;
    estEl.className=`px-2 py-1 rounded-full text-xs font-black ${color} text-white`;
    const deudaEl=document.getElementById('ficha-deuda');
    deudaEl.textContent= estado==='Al dia'? 'Al dia' : estado==='Becado'? 'Sin pago' : `Debe $${falta.toLocaleString()} (Pagado $${pag.toLocaleString()} / ${obj.toLocaleString()})`;
    ficha.classList.remove('hidden');
  }

  // Eventos
  input.addEventListener('input', ()=> renderGrid(input.value));
  input.addEventListener('focus', ()=> renderGrid(input.value));
  if(filtroCat) filtroCat.addEventListener('change', ()=> { input.value=''; renderGrid(''); });
  document.addEventListener('click', (e)=>{
    if(!gridContainer.contains(e.target) && !input.contains(e.target)) gridContainer.classList.add('hidden');
  });

  // Si viene con ?jugador= id, preseleccionar
  const q=new URLSearchParams(location.search).get('jugador');
  if(q){
    function intentarSeleccionar(){
      const j=jugadoresList.find(x=> String(x.id)===String(q));
      if(j) seleccionarJugador(j);
      else setTimeout(intentarSeleccionar, 300);
    }
    intentarSeleccionar();
  }
}

// --- FILTRADO Y RENDERIZADO HISTORIAL ---

function filtrarPagos() {
  const txt = DOM.buscador ? DOM.buscador.value.toLowerCase() : ''; 
  const fIni = DOM.fechaInicio ? DOM.fechaInicio.value : ''; 
  const fFin = DOM.fechaFin ? DOM.fechaFin.value : ''; 
  const jugadorId = DOM.selectJugador ? DOM.selectJugador.value : '';

  const pagosFiltrados = todosLosPagos.filter(p => {
    const fechaPago = p.fecha ? p.fecha.split('T')[0] : '';
    
    // Condiciones
    const matchTexto = p.jugador && p.jugador.toLowerCase().includes(txt);
    const matchFechaIni = !fIni || fechaPago >= fIni;
    const matchFechaFin = !fFin || fechaPago <= fFin;
    // Importante: Si hay jugador seleccionado, filtrar estrictamente por su ID
    const matchJugador = !jugadorId || p.jugador_id == jugadorId;

    return matchTexto && matchFechaIni && matchFechaFin && matchJugador;
  });

  // Calcular total recaudado filtrado
  const total = pagosFiltrados.reduce((sum, p) => sum + Number(p.monto), 0);
  if(DOM.totalFiltrado) DOM.totalFiltrado.innerText = '$' + total.toLocaleString();

  renderPagos(pagosFiltrados);
}

function renderPagos(pagos) {
  if (!DOM.tablaPagos) return;
  refreshDOM();
  DOM.tablaPagos.innerHTML = '';
  if(DOM.vistaMovilHistorial) DOM.vistaMovilHistorial.innerHTML = '';
  if(pagos.length === 0) {
    DOM.tablaPagos.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400">No se encontraron pagos. Registra el primero arriba.</td></tr>';
    if(DOM.vistaMovilHistorial) DOM.vistaMovilHistorial.innerHTML = '<div class="text-center py-8 text-slate-400">Sin pagos.</div>';
    return;
  }

  const fragmentTabla = document.createDocumentFragment();
  const fragmentMovil = document.createDocumentFragment();

  pagos.forEach(p => {
    let detHTML = ''; 
    if(p.cantidad_meses > 1) {
      detHTML += `<div class="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><i class="ph ph-receipt"></i> ${p.recibo_numero||""}</div>`;
    }
    if(p.observacion) {
      detHTML += `<div class="text-[10px] text-slate-400 truncate" title="${p.observacion}">${p.observacion}</div>`;
    }

    // Fila Desktop - 5 columnas: Jugador, Fecha, Concepto, Monto, Acciones
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-slate-100 transition";
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="font-bold text-slate-900 text-sm">${p.jugador || 'N/A'}</div>
        <div class="text-[11px] text-slate-500">${p.recibo_numero || 'REC-'+String(p.id).padStart(4,'0')}</div>
      </td>
      <td class="px-4 py-3 text-sm text-slate-600">${p.fecha ? p.fecha.split('T')[0] : ''}</td>
      <td class="px-4 py-3">
        <span class="bg-slate-900 text-white px-2 py-1 rounded-full text-[11px] font-bold capitalize">${p.tipo || 'abono'}</span>
        ${detHTML ? `<div class="mt-1">${detHTML}</div>` : ''}
      </td>
      <td class="px-4 py-3 text-right font-black text-emerald-600">$${Number(p.monto).toLocaleString()}</td>
      <td class="px-4 py-3">
        <div class="flex justify-center gap-1">
          <button onclick="window.descargarFactura(${p.id})" class="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-black" title="Recibo"><i class="ph ph-receipt text-sm"></i></button>
          <button onclick="window.enviarWhatsapp(${p.id})" class="w-7 h-7 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600" title="WhatsApp"><i class="ph ph-whatsapp-logo text-sm"></i></button>
          <button onclick="window.editarPago(${p.id})" class="w-7 h-7 bg-white border rounded-lg flex items-center justify-center hover:bg-slate-50" title="Editar"><i class="ph ph-pencil-simple"></i></button>
          <button onclick="window.eliminarPago(${p.id})" class="w-7 h-7 bg-white border text-rose-600 rounded-lg flex items-center justify-center" title="Eliminar"><i class="ph ph-trash"></i></button>
        </div>
      </td>
    `;
    fragmentTabla.appendChild(tr);

    // Tarjeta Movil
    const div = document.createElement('div');
    div.className = "bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3";
    div.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-slate-900">${p.jugador || 'N/A'}</h3>
          <p class="text-xs text-slate-500">${p.fecha.split("T")[0]} - ${p.tipo || ""}</p>
        </div>
        <span class="font-bold text-emerald-600 text-lg">$${Number(p.monto).toLocaleString()}</span>
      </div>
      ${detHTML ? `<div class="bg-slate-50 p-2 rounded text-xs text-slate-600 mb-2 mt-2">${detHTML}</div>` : ''}
      <div class="flex gap-2 mt-2">
        <button onclick="window.editarPago(${p.id})" class="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition flex justify-center items-center gap-1"><i class="ph ph-pencil-simple text-lg"></i> Editar</button>
        <button onclick="window.enviarWhatsapp(${p.id})" class="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-xs font-bold hover:bg-green-100 transition flex justify-center items-center gap-1"><i class="ph ph-whatsapp-logo text-lg"></i> WhatsApp</button>
        <button onclick="window.eliminarPago(${p.id})" class="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition">Eliminar</button>
      </div>
    `;
    fragmentMovil.appendChild(div);
  });

  DOM.tablaPagos.appendChild(fragmentTabla);
  if(DOM.vistaMovilHistorial) DOM.vistaMovilHistorial.appendChild(fragmentMovil);
}

function renderizarResumen(tipo) {
  if(!DOM.tablaResumen || !DOM.vistaMovilResumen) return; 
  DOM.tablaResumen.innerHTML = ''; 
  DOM.vistaMovilResumen.innerHTML = '';
  
  let lista = jugadoresList;
  const jugadorId = DOM.selectJugador ? DOM.selectJugador.value : null;

  // 1. Filtrado de Lista
  if (tipo === 'deudores') {
    lista = jugadorId ? lista.filter(j => j.id === Number(jugadorId)) : lista.filter(j => j.mensualidad < getMensualidadObjetivo(j.categoria));
  } else if(tipo === 'pagados') {
    lista = jugadorId ? lista.filter(j => j.id === Number(jugadorId)) : lista.filter(j => j.mensualidad >= getMensualidadObjetivo(j.categoria));
  } else if (jugadorId) {
    // Todos pero con filtro de jugador seleccionado
    lista = lista.filter(j => j.id === Number(jugadorId));
  }

  // 2. Paginacion
  const totalItems = lista.length;
  const itemsPorPagina = 5;
  const totalPages = Math.ceil(totalItems / itemsPorPagina) || 1; 
  
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const datosPagina = lista.slice(inicio, fin);

  // Update pagination info
  const infoEl = document.getElementById('info-paginacion');
  if(infoEl) infoEl.textContent = `Mostrando ${datosPagina.length} de ${totalItems} registros`;
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if(btnPrev) btnPrev.disabled = paginaActual <= 1;
  if(btnNext) btnNext.disabled = paginaActual >= totalPages;

  if (datosPagina.length === 0) {
    const msg = jugadorId ? "Este jugador no tiene pagos registrados." : "No hay registros en esta vista.";
    DOM.tablaResumen.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">${msg}</td></tr>`;
    DOM.vistaMovilResumen.innerHTML = `<div class="text-center py-8 text-slate-400">${msg}</div>`;
    return; 
  }

  // 3. Renderizado
  const fragmentTabla = document.createDocumentFragment();
  const fragmentMovil = document.createDocumentFragment();

  datosPagina.forEach(j => {
    let estadoBadge = '';
    const meta = getMensualidadObjetivo(j.categoria);
    if (j.mensualidad >= meta) {
      estadoBadge = '<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">Al dia</span>';
    } else if (j.mensualidad > 0) {
      estadoBadge = `<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">Parcial ($${j.mensualidad.toLocaleString()})</span>`;
    } else {
      estadoBadge = '<span class="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">No Pagado</span>';
    }

    // Fila Tabla
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-slate-100 transition";
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="font-medium text-slate-900">${j.nombre}</div>
        <div class="mt-1 text-xs text-slate-500">${j.categoria}</div>
      </td>
      <td class="px-4 py-3 text-center">${estadoBadge}</td>
      <td class="px-4 py-3 text-center">
        <div class="text-xs font-bold text-slate-700">$${j.mensualidad.toLocaleString()}</div>
        ${j.mensualidad > 0 && j.mensualidad < meta ? `<div class="text-[10px] text-rose-500">Faltan $${(meta - j.mensualidad).toLocaleString()}</div>` : ''}
      </td>
      <td class="px-4 py-3 text-right">
        <button onclick="window.irAPagar(${j.id})" class="text-blue-600 hover:text-blue-800 text-xs font-bold underline decoration-blue-200 hover:decoration-blue-600 underline-offset-4 transition-all">
          Pagar
        </button>
      </td>
    `;
    fragmentTabla.appendChild(tr);

    // Tarjeta Movil
    const div = document.createElement('div');
    div.className = "bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center";
    div.innerHTML = `
      <div>
        <h4 class="font-bold text-slate-900">${j.nombre}</h4>
        <div class="mt-1">${estadoBadge}</div>
      </div>
      <div class="text-right">
        <div class="font-bold text-lg ${j.mensualidad >= meta ? 'text-emerald-600' : (j.mensualidad > 0 ? 'text-amber-600' : 'text-rose-600')}">
          $${j.mensualidad.toLocaleString()}
        </div>
        <button onclick="window.irAPagar(${j.id})" class="mt-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
          Pagar
        </button>
      </div>
    `;
    fragmentMovil.appendChild(div);
  });

  DOM.tablaResumen.appendChild(fragmentTabla);
  if(DOM.vistaMovilResumen) DOM.vistaMovilResumen.appendChild(fragmentMovil);
}

// --- ACCIONES ---

async function guardarPago(e) {
  e.preventDefault();
  const btnSubmit = DOM.formPago.querySelector('button[type="submit"]');
  const textoOriginal = btnSubmit ? btnSubmit.innerText : '';
  
  if(btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Guardando...';
  }

  const esMultiple = document.querySelector('input[name="pago_multiple"]:checked').value === 'si';
  let tipoVal=document.getElementById('tipo').value;
  if(tipoVal==='otro') tipoVal=document.getElementById('tipo-otro').value||'otro';
  const payload = {
    jugador_id: DOM.selectJugador ? DOM.selectJugador.value : null, 
    monto: Number(document.getElementById('monto').value),
    fecha: document.getElementById('fecha').value, 
    tipo: tipoVal,
    observacion: document.getElementById('observacion').value + ' | Medio: ' + (document.getElementById('medio_pago')?.value||'Efectivo'), 
    mes_pago: document.getElementById('mes_pago').value,
    cantidad_meses: 1, 
    periodo_inicio: null, 
    periodo_fin: null
  };

  if(!payload.jugador_id) {
    mostrarNotificacion('Seleccione un jugador', 'error');
    if(btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = textoOriginal; }
    return;
  }

  if(esMultiple) {
    payload.cantidad_meses = Number(document.getElementById('cantidad_meses').value);
    payload.periodo_inicio = document.getElementById('periodo_inicio').value;
    payload.periodo_fin = document.getElementById('periodo_fin').value;
    if(!payload.observacion) payload.observacion = `Meses pagados: ${document.getElementById('resumen-meses-texto').innerText}`;
  } else { 
    payload.periodo_inicio = payload.fecha; 
  }

  try {
    const esEdicion = pagoEnEdicion !== null;
    const url = esEdicion ? `/pagos?id=${pagoEnEdicion.id}` : '/pagos';
    const method = esEdicion ? 'PUT' : 'POST';
    if (esEdicion) payload.id = pagoEnEdicion.id;
    await apiFetch(url, { method, body: payload });
    mostrarNotificacion(esEdicion ? '✅ Pago actualizado correctamente' : '✅ Pago guardado correctamente', 'success');
    pagoEnEdicion = null;
    DOM.formPago.reset();
    const wrapper = document.getElementById('pago-multiple-wrapper');
    if(wrapper) wrapper.classList.add('hidden');
    const radioNo = document.querySelector('input[name="pago_multiple"][value="no"]');
    if(radioNo) radioNo.checked = true;
    const titulo = document.getElementById('titulo-form-pago');
    if (titulo) titulo.innerText = 'Registrar Nuevo Pago';
    const btnText = DOM.formPago.querySelector('button[type="submit"]');
    if (btnText) btnText.innerHTML = '<i class="ph ph-check-circle text-xl"></i> Guardar Pago';
    
    await Promise.all([cargarPagos(), cargarJugadoresSelect()]);
    filtrarPagos(); 
    renderizarResumen(document.querySelector('input[name="filtro-resumen"]:checked').value || 'todos');
  } catch (error) { 
    console.error(error);
    mostrarNotificacion('Error al guardar pago', 'error'); 
  } finally {
    if(btnSubmit) { 
      btnSubmit.disabled = false; 
      btnSubmit.innerText = textoOriginal; 
    }
  }
}

window.editarPago = function(id) {
  const pago = todosLosPagos.find(p => p.id === id);
  if (!pago) return;
  pagoEnEdicion = pago;
  DOM.formPago.scrollIntoView({ behavior: 'smooth' });
  if (DOM.selectJugador) DOM.selectJugador.value = pago.jugador_id;
  document.getElementById('monto').value = pago.monto;
  document.getElementById('fecha').value = pago.fecha ? pago.fecha.split('T')[0] : '';
  document.getElementById('tipo').value = pago.tipo || 'abono';
  document.getElementById('observacion').value = pago.observacion || '';
  document.getElementById('mes_pago').value = pago.mes_pago || '';
  const titulo = document.getElementById('titulo-form-pago');
  if (titulo) titulo.innerText = 'Editando Pago #' + pago.id;
  const btnText = DOM.formPago.querySelector('button[type="submit"]');
  if (btnText) btnText.innerHTML = '<i class="ph ph-floppy-disk text-xl"></i> Actualizar Pago';
};

async function eliminarPago(id) {
  if(!confirm('Estas seguro de borrar este pago?')) return;
  
  try {
    await apiFetch(`/pagos?id=${id}`, {method:'DELETE'});
    mostrarNotificacion('Pago eliminado', 'success');
    await Promise.all([cargarPagos(), cargarJugadoresSelect()]);
    filtrarPagos();
    renderizarResumen(document.querySelector('input[name="filtro-resumen"]:checked').value || 'todos');
  } catch(e) {
    mostrarNotificacion('Error al eliminar', 'error');
  }
}

function enviarWhatsapp(idPago) {
  const pago = todosLosPagos.find(p => p.id === idPago);
  if(!pago) return alert('Pago no encontrado');
  const jugador = jugadoresList.find(j=> j.id===pago.jugador_id) || {};
  const tel = jugador.acudiente_telefono || jugador.telefono || pago.jugador_telefono;
  if(!tel) return mostrarNotificacion('El jugador no tiene telefono registrado', 'error');
  const nombreAcudiente = jugador.acudiente_nombre || pago.jugador || 'Familia';
  const nombreJugador = jugador.nombre ? `${jugador.nombre} ${jugador.apellidos||''}` : (pago.jugador||'Jugador');
  const categoria = jugador.categoria || '';
  const h=new Date().getHours();
  const saludo = h < 12 ? "Buenos dias" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const monto = Number(pago.monto).toLocaleString();
  const base = getMensualidadObjetivo(jugador.categoria||'');
  const desc = Number(jugador.descuento_beca||0);
  const objetivo = Math.round(base*(1-desc/100));
  const falta = Math.max(0, objetivo - Number(pago.monto));
  const venc = pago.vencimiento ? new Date(pago.vencimiento).toLocaleDateString('es-ES',{day:'numeric', month:'long', year:'numeric'}) : (pago.periodo_fin ? new Date(new Date(pago.periodo_fin).getTime()+86400000).toLocaleDateString('es-ES',{day:'numeric',month:'long'}) : 'proximo mes');
  const escuelaWA=localStorage.getItem('escuela_nombre')||'Escuela';
  let mensaje = `${saludo} ${nombreAcudiente},%0A%0A`;
  if(pago.cantidad_meses > 1 && pago.periodo_fin){
    mensaje += `Muchas gracias por tu pago adelantado de *$${monto}* para ${nombreJugador}${categoria?` (${categoria})`:''}.%0A`;
    mensaje += `Has cubierto ${pago.cantidad_meses} meses. Quedas al dia hasta *${venc}*.%0A%0A`;
    mensaje += `Recibo: ${pago.recibo_numero||"REC-"+pago.id}%0AGracias por tu compromiso! - ${escuelaWA}`;
  } else if(falta>0 && Number(pago.monto) < objetivo){
    // Abono
    mensaje += `Gracias por tu abono de *$${monto}* para ${nombreJugador}${categoria?` (${categoria})`:''}.%0A`;
    mensaje += `Te faltan *$${falta.toLocaleString()}* para quedar al dia.%0A`;
    mensaje += `Tu proximo vencimiento es *${venc}*.%0A%0A`;
    mensaje += `Quedamos atentos. Muchas gracias! - ${escuelaWA}`;
  } else {
    mensaje += `Muchas gracias por tu pago completo de *$${monto}* para ${nombreJugador}${categoria?` (${categoria})`:''}.%0A`;
    mensaje += `Quedas al dia hasta *${venc}*.%0A%0A`;
    mensaje += `Recibo: ${pago.recibo_numero||"REC-"+pago.id}%0AGracias por confiar en ${escuelaWA}.%0A`;
  }
  window.open(`https://wa.me/57${String(tel).replace(/[^0-9]/g,'')}?text=${mensaje}`, '_blank');
}

// --- UTILIDADES ---

function mostrarNotificacion(mensaje, tipo = 'info') {
  let container = document.getElementById('toast-container');
  if(!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const colores = tipo === 'error' ? 'bg-rose-500' : (tipo === 'success' ? 'bg-emerald-500' : 'bg-blue-500');
  
  toast.className = `${colores} text-white px-4 py-3 rounded shadow-lg text-sm font-medium transform transition-all duration-300 translate-y-10 opacity-0`;
  toast.innerText = mensaje;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

  window.descargarFactura = (id)=>{
  const p=todosLosPagos.find(x=>x.id===id);
  if(!p) return alert('Pago no encontrado');
  const {jsPDF}=window.jspdf; const doc=new jsPDF();
  const jugador=p.jugador||'Jugador';
  const fecha=p.fecha? p.fecha.split('T')[0]: new Date().toISOString().split('T')[0];
  const recibo=p.recibo_numero||'REC-'+String(p.id).padStart(4,'0');
  const escuela=localStorage.getItem('escuela_nombre')||'Escuela';
  // Encabezado elegante
  doc.setFillColor(15,23,42); doc.rect(0,0,210,32,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text(escuela+' - Escuela de Futbol', 14, 14);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text('Recibo de Pago / Factura', 14, 20);
  doc.setFontSize(8); doc.text('Fecha: '+fecha+'  |  Recibo: '+recibo, 14, 26);
  doc.setTextColor(0,0,0);
  doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('Cliente: '+jugador, 14, 42);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text('Concepto: '+(p.tipo||'abono'), 14, 48);
  if(p.observacion) doc.text('Obs: '+p.observacion.slice(0,80), 14, 54);
  // Tabla
  doc.autoTable({
    startY: 62,
    head:[['Descripcion','Monto']],
    body: [[(p.tipo||'abono')+' - '+recibo, '$'+Number(p.monto).toLocaleString()]],
    headStyles:{fillColor:[22,163,74]},
    styles:{fontSize:10}
  });
  const y=doc.lastAutoTable.finalY+8;
  doc.setFontSize(9); doc.text('Medio de pago: '+(p.observacion?.includes('Medio:')? p.observacion.split('Medio:')[1].trim() : 'Efectivo'), 14, y);
  doc.text('Vencimiento proximo: '+(p.vencimiento|| p.fecha||''), 14, y+6);
  doc.setFontSize(8); doc.setTextColor(100,100,100);
  doc.text('Gracias por confiar en EFUSA. Conserve este recibo.', 14, y+14);
  doc.save(recibo+'_'+jugador.replace(/\s+/g,'_')+'.pdf');
};
// Exponer al scope global
window.irAPagar = (id) => { 
  if(DOM.selectJugador) DOM.selectJugador.value = id; 
  if(DOM.formPago) DOM.formPago.scrollIntoView({behavior:'smooth'}); 
};
window.eliminarPago = eliminarPago;
window.enviarWhatsapp = enviarWhatsapp;
window.renderizarResumen = renderizarResumen;
window.limpiarFiltros = () => { 
  if(DOM.buscador) DOM.buscador.value=''; 
  if(DOM.fechaInicio) DOM.fechaInicio.value=''; 
  if(DOM.fechaFin) DOM.fechaFin.value=''; 
  paginaActual = 1;
  filtrarPagos(); 
};
