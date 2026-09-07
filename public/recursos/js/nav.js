export async function injectNav(paginaActiva) {
  const userData = JSON.parse(localStorage.getItem('efusa_user') || '{}');
  const role = userData.role || 'admin';
  const isSuper = role === 'super_admin';
  const nombre = userData.nombre || 'Administrador';
  // Nombre escuela configurable (sin hardcode EFUSA)
  let escuelaNombre = localStorage.getItem('escuela_nombre') || '';
  try{
    const cfg = await fetch('/api/config', { headers: { Authorization: `Bearer ${localStorage.getItem('efusa_token')||''}` }}).then(r=> r.ok? r.json(): null);
    if(cfg && cfg.escuela_nombre){ escuelaNombre=cfg.escuela_nombre; localStorage.setItem('escuela_nombre', escuelaNombre); }
  }catch{}
  if(!escuelaNombre) escuelaNombre='Escuela';

  const allItems = [
    { href: '/index.html', icon: 'ph-house', label: 'Inicio', id: 'dashboard' },
    { href: '/jugadores.html', icon: 'ph-users-three', label: 'Jugadores', id: 'jugadores' },
    { href: '/profesores.html', icon: 'ph-chalkboard-teacher', label: 'Profes', id: 'profesores', roles: ['super_admin','admin'] },
    { href: '/categorias.html', icon: 'ph-tag', label: 'Categorias', id: 'categorias', roles: ['super_admin','admin','profe'] },
    { href: '/pagos.html', icon: 'ph-coins', label: 'Ingresos', id: 'pagos' },
    { href: '/gastos.html', icon: 'ph-receipt', label: 'Gastos', id: 'gastos' },
    { href: '/caja.html', icon: 'ph-vault', label: 'Caja', id: 'caja' },
    { href: '/asistencias.html', icon: 'ph-clipboard-text', label: 'Asistencia', id: 'asistencias' },
    { href: '/inventario.html', icon: 'ph-package', label: 'Inventario', id: 'inventario' },
    { href: '/torneos.html', icon: 'ph-trophy', label: 'Torneos', id: 'torneos' },
    { href: '/alertas.html', icon: 'ph-warning-circle', label: 'Alertas', id: 'alertas' },
    { href: '/whatsapp.html', icon: 'ph-whatsapp-logo', label: 'WhatsApp', id: 'whatsapp', roles: ['super_admin','admin'] },
    { href: '/reportes.html', icon: 'ph-chart-line-up', label: 'Reportes', id: 'reportes' },
    { href: '/bitacora.html', icon: 'ph-files', label: 'Bitacora', id: 'bitacora', roles: ['super_admin'] },
    { href: '/configuracion.html', icon: 'ph-gear-six', label: 'Config', id: 'configuracion', roles: ['super_admin'] },
  ].filter(i => !i.roles || i.roles.includes(role));

  const menus = [
    { titulo: 'INICIO', items: allItems.filter(x=>['dashboard'].includes(x.id)) },
    { titulo: 'ESCUELA', items: allItems.filter(x=>['jugadores','profesores','categorias'].includes(x.id)) },
    { titulo: 'DINERO', items: allItems.filter(x=>['pagos','gastos','caja'].includes(x.id)) },
    { titulo: 'CANCHA', items: allItems.filter(x=>['asistencias','inventario','torneos'].includes(x.id)) },
    { titulo: 'SISTEMA', items: allItems.filter(x=>['alertas','whatsapp','reportes','bitacora','configuracion'].includes(x.id)) },
  ].filter(g=> g.items.length);

  const navHtml = `
<!-- SIDEBAR DESKTOP - Siempre visible -->
<aside id="sidebar-desktop" class="hidden md:flex fixed top-0 left-0 bottom-0 w-[288px] bg-[#0F172A] z-40 flex-col border-r border-white/10">
  <div class="px-5 pt-6 pb-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-brand-600 flex items-center justify-center shadow-lg">
        <i class="ph ph-soccer-ball text-white text-xl"></i>
      </div>
      <div class="flex-1">
        <h2 class="text-white font-black text-[15px] leading-none">${escuelaNombre}</h2>
          <p class="text-emerald-300/70 text-[10px] font-black uppercase tracking-[0.14em]">Escuela Futbol</p>
      </div>
      <span class="text-[9px] font-black px-2 py-1 rounded-full ${isSuper ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white'}">${role.toUpperCase().replace('_',' ')}</span>
    </div>
    <div class="mt-4 relative">
      <i class="ph ph-magnifying-glass absolute left-3 top-2.5 text-white/40"></i>
      <input id="nav-search-desktop" placeholder="Buscar..." class="w-full pl-9 pr-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400/30">
    </div>
  </div>
  <div class="flex-1 overflow-y-auto px-3 pb-4 space-y-5 custom-scroll-dark">
    ${menus.map(grupo => `
      <div>
        <p class="text-[10px] font-black text-white/30 uppercase tracking-[0.14em] px-3 mb-1.5">${grupo.titulo}</p>
        <div class="space-y-1">
        ${grupo.items.map(p => {
          const active = paginaActiva === p.id;
          return `<a href="${p.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold relative ${active ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:bg-white/[0.07] hover:text-white'}">
            ${active ? '<span class="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-full"></span>' : ''}
            <span class="w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-slate-900 text-white' : 'bg-white/10'}"><i class="ph ${p.icon} text-[16px]"></i></span>
            <span class="flex-1">${p.label}</span>
            ${active ? '<span class="text-[10px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">ACTIVO</span>' : ''}
          </a>`;
        }).join('')}
        </div>
      </div>
    `).join('')}
  </div>
  <div class="p-3 border-t border-white/10">
    <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10">
      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center font-black text-white text-xs" id="nav-user-avatar-d">AD</div>
      <div class="flex-1 min-w-0">
        <p class="text-white text-xs font-bold truncate" id="nav-user-name-d">${nombre}</p>
        <p class="text-white/50 text-[11px] truncate" id="nav-user-role-d">${role}</p>
      </div>
      <button onclick="window.cerrarSesion()" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-500 text-white/70 flex items-center justify-center"><i class="ph ph-sign-out"></i></button>
    </div>
  </div>
</aside>

<!-- TOP BAR MOVIL - TODO VISIBLE, SCROLL HORIZONTAL, NADA ESCONDIDO -->
<div id="topbar-mobile" class="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F172A] border-b border-white/10">
  <div class="px-3 pt-3 pb-2 flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-brand-600 flex items-center justify-center"><i class="ph ph-soccer-ball text-white"></i></div>
    <span class="font-black text-white text-sm">${escuelaNombre}</span>
    <span class="ml-auto text-[10px] bg-white/10 text-white/70 px-2 py-1 rounded-full font-bold">${role.toUpperCase().replace('_',' ')}</span>
    <button onclick="window.cerrarSesion()" class="w-8 h-8 rounded-lg bg-white/10 text-white/70 flex items-center justify-center"><i class="ph ph-sign-out"></i></button>
  </div>
  <!-- Menu horizontal scroll - TODO AFUERA -->
  <div class="px-2 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none" style="scrollbar-width:none">
    ${allItems.map(p => {
      const active = paginaActiva === p.id;
      return `<a href="${p.href}" class="whitespace-nowrap flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-black border ${active ? 'bg-white text-slate-900 border-white' : 'bg-white/10 text-white/70 border-white/10'}">
        <i class="ph ${p.icon}"></i> ${p.label}
      </a>`;
    }).join('')}
  </div>
</div>

<style>
  body.has-sidebar { padding-left: 0; }
  @media (min-width: 768px) { body.has-sidebar { padding-left: 288px; } }
  @media (max-width: 767px) { body.has-sidebar { padding-top: 88px; } }
  .custom-scroll-dark::-webkit-scrollbar{width:5px} .custom-scroll-dark::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px}
  .scrollbar-none::-webkit-scrollbar{display:none}
</style>`;

  const container = document.getElementById('nav-container');
  if (container) container.innerHTML = navHtml;
  document.body.classList.add('has-sidebar');

  // Mantener visible el item activo sin que se vaya arriba
  requestAnimationFrame(()=>{
    const activeLink = document.querySelector('#sidebar-desktop a.bg-white, #topbar-mobile a.bg-white');
    if(activeLink){
      activeLink.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
      // En desktop, asegurar que el grupo SISTEMA quede visible si el activo esta abajo
      const sidebarScroll = document.querySelector('#sidebar-desktop .custom-scroll-dark');
      if(sidebarScroll && activeLink.closest('#sidebar-desktop')){
        const rect = activeLink.getBoundingClientRect();
        const contRect = sidebarScroll.getBoundingClientRect();
        if(rect.bottom > contRect.bottom || rect.top < contRect.top){
          activeLink.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
      }
    }
  });

  const sd = document.getElementById('nav-search-desktop');
  if(sd) sd.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ const q=sd.value.trim(); if(q) location.href='/jugadores.html?q='+encodeURIComponent(q); }
  });

  const set = (id, val)=>{ const el=document.getElementById(id); if(el && val) el.textContent=val; };
  set('nav-user-name-d', nombre);
  set('nav-user-role-d', role.replace('_',' '));
  const av=document.getElementById('nav-user-avatar-d');
  if(av && nombre) av.textContent=nombre.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

window.cerrarSesion = function() {
  if(!confirm('Estas seguro que quieres cerrar sesion?')) return;
  localStorage.removeItem('efusa_token');
  localStorage.removeItem('efusa_user');
  window.location.href = '/login.html';
};
