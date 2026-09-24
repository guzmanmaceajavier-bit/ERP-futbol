import { type ReactNode } from 'react';
import { Icon } from './Icon';

interface ActionsCellProps {
  onEdit: () => void;
  onDelete?: () => void;
  extra?: ReactNode;
}

export function ActionsCell({ onEdit, onDelete, extra }: ActionsCellProps) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onEdit}
        className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all"
        title="Editar"
      >
        <Icon name="editar" className="w-4 h-4" />
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
          title="Eliminar"
        >
          <Icon name="eliminar" className="w-4 h-4" />
        </button>
      )}
      {extra}
    </div>
  );
}

export function WhatsAppButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-all"
      title="Enviar WhatsApp"
    >
      <Icon name="whatsapp" className="w-4 h-4" />
    </button>
  );
}

export function ToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md transition-all ${
        active
          ? 'bg-green-500/10 text-green-400 hover:bg-red-500/20 hover:text-red-400'
          : 'bg-slate-500/10 text-slate-400 hover:bg-green-500/20 hover:text-green-400'
      }`}
      title={active ? 'Desactivar' : 'Activar'}
    >
      {active ? (
        <Icon name="verificar" className="w-4 h-4" />
      ) : (
        <Icon name="bloqueo" className="w-4 h-4" />
      )}
    </button>
  );
}
