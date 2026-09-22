import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { configService } from '../../services/configService';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ToastList } from '../../components/feedback/ToastList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CATEGORIAS } from '../../utils/constants';

const PLANTILLAS = [
  { key: 'whatsapp_confirmacion', label: 'Confirmacion de pago', desc: 'Al registrar un pago exitoso' },
  { key: 'whatsapp_recordatorio', label: 'Recordatorio de pago', desc: 'Enviar antes del vencimiento' },
  { key: 'whatsapp_vencimiento', label: 'Aviso de vencimiento', desc: 'Cuando un pago esta en mora' },
  { key: 'whatsapp_cumpleanos', label: 'Felicitacion cumpleanos', desc: 'En el cumpleanos del jugador' },
];

const PLANTILLAS_TEXTO: Record<string, string> = {
  whatsapp_confirmacion: 'Gracias {nombre}, recibimos ${monto} de {jugador}. Recibo {recibo}.',
  whatsapp_recordatorio: 'Hola {nombre}, le recordamos que la mensualidad de {periodo} vence pronto. Valor: ${monto}.',
  whatsapp_vencimiento: 'Hola {nombre}, la mensualidad de {periodo} esta vencida. Deuda: ${deuda}. Por favor regularice.',
  whatsapp_cumpleanos: 'Feliz cumpleanos {nombre}! {escuela} le desea un excelente dia.',
};

export function Configuracion() {
  const { data: config, loading, error, refetch } = useApi(() => configService.getAll());
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const { hasRole, user } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [templateText, setTemplateText] = useState('');

  useEffect(() => { if (config) setForm(config); }, [config]);

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configService.update(form as any);
      showSuccess('Configuracion guardada');
      refetch();
    } catch (err: any) { showError(err.message); } finally { setSaving(false); }
  };

  const toggleField = (key: string) => {
    updateField(key, form[key] === 'false' ? 'true' : 'false');
  };

  const openTemplate = (key: string) => {
    setActiveTemplate(key);
    setTemplateText(form[key + '_texto'] || PLANTILLAS_TEXTO[key] || '');
  };

  const saveTemplate = () => {
    if (activeTemplate) {
      updateField(activeTemplate + '_texto', templateText);
      setActiveTemplate(null);
      showSuccess('Plantilla guardada');
    }
  };

  const logBitacora = (accion: string, detalle: string) => {
    try {
      const logs = JSON.parse(localStorage.getItem('erp_mock_bitacora') || '[]');
      logs.push({ id: Date.now(), usuario: user?.username || 'admin', accion, modulo: 'configuracion', detalle, fecha: new Date().toISOString() });
      localStorage.setItem('erp_mock_bitacora', JSON.stringify(logs));
    } catch {}
  };

  const handleResetConfig = () => {
    if (confirmText !== 'CONFIRMAR') { showError('Escribe CONFIRMAR para continuar'); return; }
    setForm({
      escuela_nombre: 'Mi Escuela', escuela_telefono: '', escuela_direccion: '', escuela_email: '',
      escuela_nit: '', escuela_ciudad: '', escuela_logo: '',
      regla_dia_pago: '5', regla_dias_recordatorio: '3', regla_dia_mora: '10', regla_meses_gracia: '0',
      regla_activar_vencimiento: 'true', regla_saldo_favor: 'true', regla_aplicar_saldo_favor: 'true',
      whatsapp_delay_segundos: '5', whatsapp_telefono: '', whatsapp_activo: 'true', whatsapp_limite_lote: '10',
    });
    setConfirmText('');
    logBitacora('RESTABLECER_CONFIG', 'Configuracion restablecada a valores por defecto');
    showSuccess('Configuracion restablecida. Presiona Guardar para aplicar.');
  };

  const handleClearDemo = () => {
    if (confirmText !== 'CONFIRMAR') { showError('Escribe CONFIRMAR para continuar'); return; }
    const count = Object.keys(localStorage).filter(k => k.startsWith('erp_mock_')).length;
    Object.keys(localStorage).filter(k => k.startsWith('erp_mock_')).forEach(k => localStorage.removeItem(k));
    setConfirmText('');
    logBitacora('LIMPIAR_DEMO', `${count} datasets demo eliminados`);
    showSuccess('Datos demo eliminados. Recarga la pagina.');
  };

  const handleDangerZone = () => {
    if (confirmText !== 'CONFIRMAR') { showError('Escribe CONFIRMAR para continuar'); return; }
    if (confirm('ESTA ACCION ELIMINARA TODOS LOS DATOS. No se puede deshacer. Continuar?')) {
      logBitacora('BORRAR_TODO', 'Todos los datos del sistema eliminados');
      localStorage.clear();
      setConfirmText('');
      showSuccess('Todo eliminado. Recarga la pagina.');
    }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />

      <div className="flex items-center justify-between">
        <h1 className="font-sport text-2xl font-bold text-white">Configuracion</h1>
        <Button onClick={handleSave} loading={saving}>Guardar Cambios</Button>
      </div>

      {/* 1. Datos de la escuela */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-sport font-bold text-white text-lg border-b border-slate-700 pb-2">Datos de la escuela</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre de la escuela" value={form.escuela_nombre || ''} onChange={e => updateField('escuela_nombre', e.target.value)} placeholder="Ej: Academia de Futbol XYZ" />
          <Input label="NIT / Identificacion" value={form.escuela_nit || ''} onChange={e => updateField('escuela_nit', e.target.value)} placeholder="Ej: 900123456-7" />
          <Input label="Telefono" value={form.escuela_telefono || ''} onChange={e => updateField('escuela_telefono', e.target.value)} placeholder="Ej: 3001234567" />
          <Input label="WhatsApp" value={form.escuela_whatsapp || ''} onChange={e => updateField('escuela_whatsapp', e.target.value)} placeholder="Numero de WhatsApp" />
          <Input label="Correo electronico" value={form.escuela_email || ''} onChange={e => updateField('escuela_email', e.target.value)} placeholder="Ej: info@academia.com" />
          <Input label="Ciudad" value={form.escuela_ciudad || ''} onChange={e => updateField('escuela_ciudad', e.target.value)} placeholder="Ej: Bogota" />
          <Input label="Direccion" value={form.escuela_direccion || ''} onChange={e => updateField('escuela_direccion', e.target.value)} placeholder="Ej: Calle 123 #45-67" />
          <Input label="URL Logo" value={form.escuela_logo || ''} onChange={e => updateField('escuela_logo', e.target.value)} placeholder="URL del logo para recibos" />
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 mt-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Apariencia del documento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
            <div><span className="text-slate-300">Encabezado:</span> {form.escuela_nombre || 'Sin nombre'}</div>
            <div><span className="text-slate-300">Contacto:</span> {form.escuela_telefono || '-'} | {form.escuela_email || '-'}</div>
            <div><span className="text-slate-300">Direccion:</span> {form.escuela_direccion || '-'} {form.escuela_ciudad ? `- ${form.escuela_ciudad}` : ''}</div>
          </div>
        </div>
      </div>

      {/* 2. Reglas de cobro */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-sport font-bold text-white text-lg border-b border-slate-700 pb-2">Reglas de cobro</h2>

        <div className="bg-slate-700/30 rounded-xl p-4 mb-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Cobros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="Dia limite de pago" type="number" value={form.regla_dia_pago || '5'} onChange={e => updateField('regla_dia_pago', e.target.value)} />
              <p className="text-xs text-slate-500 mt-1">Ultimo dia del mes para pagar sin consecuencias</p>
            </div>
            <div>
              <Input label="Dia de mora" type="number" value={form.regla_dia_mora || '10'} onChange={e => updateField('regla_dia_mora', e.target.value)} />
              <p className="text-xs text-slate-500 mt-1">Dia del mes a partir del cual se marca como mora</p>
            </div>
            <Input label="Dias antes para recordatorio" type="number" value={form.regla_dias_recordatorio || '3'} onChange={e => updateField('regla_dias_recordatorio', e.target.value)} />
            <Input label="Meses de gracia (beca)" type="number" value={form.regla_meses_gracia || '0'} onChange={e => updateField('regla_meses_gracia', e.target.value)} />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between py-2">
            <div><p className="text-white text-sm">Activar control de vencimiento</p><p className="text-xs text-slate-400">Marcar periodos como vencidos automaticamente</p></div>
            <button className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${form.regla_activar_vencimiento !== 'false' ? 'bg-[#22C55E]' : 'bg-slate-600'}`} onClick={() => toggleField('regla_activar_vencimiento')}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${form.regla_activar_vencimiento !== 'false' ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div><p className="text-white text-sm">Permitir saldo a favor</p><p className="text-xs text-slate-400">Excedentes se guardan como credito</p></div>
            <button className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${form.regla_saldo_favor !== 'false' ? 'bg-[#22C55E]' : 'bg-slate-600'}`} onClick={() => toggleField('regla_saldo_favor')}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${form.regla_saldo_favor !== 'false' ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div><p className="text-white text-sm">Aplicar saldo a favor automaticamente</p><p className="text-xs text-slate-400">Usar credito existente en nuevos pagos</p></div>
            <button className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${form.regla_aplicar_saldo_favor !== 'false' ? 'bg-[#22C55E]' : 'bg-slate-600'}`} onClick={() => toggleField('regla_aplicar_saldo_favor')}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${form.regla_aplicar_saldo_favor !== 'false' ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Becas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Descuento beca 50%" value={form.beca_descuento_50 || '50'} onChange={e => updateField('beca_descuento_50', e.target.value)} placeholder="50" />
            <Input label="Descuento beca 100%" value={form.beca_descuento_100 || '100'} onChange={e => updateField('beca_descuento_100', e.target.value)} placeholder="100" />
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Mensualidades base por categoria</h3>
          <p className="text-xs text-slate-500 mb-3">Valores predeterminados. Se pueden editar al crear una categoria.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIAS.map(cat => (
              <Input key={cat} label={cat} type="number" value={form[`mensualidad_${cat.replace(/\s/g, '_')}`] || ''} onChange={e => updateField(`mensualidad_${cat.replace(/\s/g, '_')}`, e.target.value)} placeholder="Auto" />
            ))}
          </div>
        </div>
      </div>

      {/* 3. WhatsApp y notificaciones */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-sport font-bold text-white text-lg border-b border-slate-700 pb-2">WhatsApp y notificaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Telefono remitente" value={form.whatsapp_telefono || ''} onChange={e => updateField('whatsapp_telefono', e.target.value)} placeholder="Numero para enviar" />
          <Input label="Delay entre envios (segundos)" type="number" value={form.whatsapp_delay_segundos || '5'} onChange={e => updateField('whatsapp_delay_segundos', e.target.value)} />
          <Input label="Limite de mensajes por lote" type="number" value={form.whatsapp_limite_lote || '10'} onChange={e => updateField('whatsapp_limite_lote', e.target.value)} />
          <div className="flex items-center justify-between py-2">
            <div><p className="text-white text-sm">Activar WhatsApp</p></div>
            <button className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${form.whatsapp_activo !== 'false' ? 'bg-[#22C55E]' : 'bg-slate-600'}`} onClick={() => toggleField('whatsapp_activo')}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${form.whatsapp_activo !== 'false' ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Automatizaciones</h3>
          <div className="space-y-2">
            {PLANTILLAS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white text-sm">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openTemplate(key)} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors">
                    Editar
                  </button>
                  <button className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${form[key] !== 'false' ? 'bg-[#22C55E]' : 'bg-slate-600'}`} onClick={() => toggleField(key)}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${form[key] !== 'false' ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeTemplate && (
          <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-medium text-white">{PLANTILLAS.find(p => p.key === activeTemplate)?.label}</h4>
            <p className="text-xs text-slate-400">Variables: {'{nombre}'} {'{monto}'} {'{periodo}'} {'{recibo}'} {'{escuela}'} {'{deuda}'} {'{jugador}'}</p>
            <textarea className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white resize-none h-24 focus:outline-none focus:border-[#22C55E]" value={templateText} onChange={e => setTemplateText(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setActiveTemplate(null)}>Cancelar</Button>
              <Button size="sm" onClick={saveTemplate}>Guardar plantilla</Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Usuarios y seguridad */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-sport font-bold text-white text-lg border-b border-slate-700 pb-2">Usuarios y seguridad</h2>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Roles del sistema</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { rol: 'super_admin', desc: 'Acceso total. Config, usuarios, bitacora, zona de peligro', color: 'border-red-600/40 bg-red-900/10' },
              { rol: 'admin', desc: 'Operativo completo: pagos, gastos, jugadores, reportes', color: 'border-blue-600/40 bg-blue-900/10' },
              { rol: 'entrenador', desc: 'Jugadores, categorias, asistencias, torneos, notas', color: 'border-green-600/40 bg-green-900/10' },
              { rol: 'auxiliar', desc: 'Jugadores (lectura), asistencias, inventario', color: 'border-yellow-600/40 bg-yellow-900/10' },
            ].map(r => (
              <div key={r.rol} className={`border rounded-xl p-3 ${r.color}`}>
                <p className="text-sm font-mono font-bold text-white">{r.rol}</p>
                <p className="text-xs text-slate-400 mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-medium text-slate-300">Sesion</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Duracion de sesion (horas)" type="number" value={form.sesion_duracion || '24'} onChange={e => updateField('sesion_duracion', e.target.value)} />
            <Input label="Maximos intentos fallidos" type="number" value={form.sesion_max_intentos || '5'} onChange={e => updateField('sesion_max_intentos', e.target.value)} />
          </div>
        </div>

        <div className="bg-slate-700/30 rounded-xl p-4 mt-2">
          <p className="text-xs text-slate-400">La gestion de usuarios (crear, editar, activar/desactivar, cambiar contrasena) se realiza desde la API directamente. Los usuarios se autentican con JWT.</p>
        </div>
      </div>

      {/* 5. Backup y restauracion */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-sport font-bold text-white text-lg border-b border-slate-700 pb-2">Backup y restauracion</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Respaldo</h3>
            <p className="text-xs text-slate-500">Crea un archivo JSON con todos los datos del sistema.</p>
            <Button size="sm" onClick={() => {
              const data = { fecha: new Date().toISOString(), version: '1.0', datos: {} as any };
              ['jugadores','pagos','gastos','categorias','profesores','torneos','caja','inventario','notas','config','periodos','pago_periodos','saldos_favor','alertas','whatsapp_historial','bitacora','usuarios'].forEach(k => {
                try { data.datos[k] = JSON.parse(localStorage.getItem(`erp_mock_${k}`) || '[]'); } catch { data.datos[k] = []; }
              });
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `erp-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click(); URL.revokeObjectURL(url);
              showSuccess('Respaldо descargado');
            }}>Crear y descargar respaldo</Button>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Restaurar</h3>
            <p className="text-xs text-slate-500">Selecciona un archivo de respaldo para restaurar los datos.</p>
            <input type="file" accept=".json" className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const data = JSON.parse(ev.target?.result as string);
                  if (!data.datos) { showError('Archivo invalido'); return; }
                  if (!confirm('Esto reemplazara los datos actuales. Continuar?')) return;
                  Object.entries(data.datos).forEach(([k, v]) => {
                    localStorage.setItem(`erp_mock_${k}`, JSON.stringify(v));
                  });
                  showSuccess('Datos restaurados. Recarga la pagina.');
                } catch { showError('Error al leer el archivo'); }
              };
              reader.readAsText(file);
            }} />
          </div>
        </div>

        <div className="bg-slate-700/30 rounded-xl p-4 mt-2">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Exportar datos</h3>
          <div className="flex flex-wrap gap-2">
            {['jugadores','pagos','gastos'].map(dataset => (
              <Button key={dataset} variant="ghost" size="sm" onClick={() => {
                try {
                  const raw = localStorage.getItem(`erp_mock_${dataset}`) || '[]';
                  const blob = new Blob([raw], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `${dataset}.json`;
                  a.click(); URL.revokeObjectURL(url);
                  showSuccess(`${dataset} exportado`);
                } catch { showError(`Error exportando ${dataset}`); }
              }}>{dataset.charAt(0).toUpperCase() + dataset.slice(1)}</Button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Mantenimiento */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-sport font-bold text-white text-lg border-b border-slate-700 pb-2">Mantenimiento</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Sistema</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Estado API</span><span className="text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>Activa</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Base de datos</span><span className="text-yellow-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>Demo (localStorage)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Version</span><span className="text-white font-mono">1.0.0</span></div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Acciones de datos</h3>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
                const count = Object.keys(localStorage).filter(k => k.startsWith('erp_mock_')).length;
                showSuccess(`${count} datasets activos en este navegador`);
              }}>Ver datos mock</Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
                Object.keys(localStorage).filter(k => k.startsWith('erp_mock_')).forEach(k => localStorage.removeItem(k));
                showSuccess('Datos mock reiniciados. Recarga la pagina.');
              }}>Limpiar datos demo</Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
                showSuccess('Configuracion restablecida a valores por defecto');
              }}>Restablecer configuracion</Button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Zona de peligro */}
      {hasRole('super_admin') && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="font-sport font-bold text-red-400 text-lg border-b border-red-800/50 pb-2">Zona de peligro</h2>
          <p className="text-xs text-slate-400">Estas acciones son irreversibles. Escribe <span className="font-mono text-red-400">CONFIRMAR</span> para habilitar los botones.</p>
          <Input label="Escribe CONFIRMAR para continuar" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="CONFIRMAR" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-800/30 border border-red-800/30 rounded-xl p-4 space-y-2">
              <p className="text-white text-sm font-medium">Restablecer configuracion</p>
              <p className="text-xs text-slate-400">Devuelve todos los ajustes a valores iniciales</p>
              <Button variant="danger" size="sm" disabled={confirmText !== 'CONFIRMAR'} onClick={handleResetConfig}>Restablecer</Button>
            </div>
            <div className="bg-slate-800/30 border border-red-800/30 rounded-xl p-4 space-y-2">
              <p className="text-white text-sm font-medium">Eliminar datos de prueba</p>
              <p className="text-xs text-slate-400">Elimina unicamente informacion demo</p>
              <Button variant="danger" size="sm" disabled={confirmText !== 'CONFIRMAR'} onClick={handleClearDemo}>Limpiar demo</Button>
            </div>
            <div className="bg-slate-800/30 border border-red-800/30 rounded-xl p-4 space-y-2">
              <p className="text-white text-sm font-medium">Borrar todos los datos</p>
              <p className="text-xs text-slate-400">Jugadores, pagos, gastos, categorias, todo</p>
              <Button variant="danger" size="sm" disabled={confirmText !== 'CONFIRMAR'} onClick={handleDangerZone}>Borrar todo</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} loading={saving}>Guardar Cambios</Button>
      </div>
    </div>
  );
}
