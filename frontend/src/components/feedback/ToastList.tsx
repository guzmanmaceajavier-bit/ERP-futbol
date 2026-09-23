import type { Toast } from '../../hooks/useToast';

interface ToastListProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const icons: Record<Toast['tipo'], string> = {
  success: '+',
  error: 'x',
  info: 'i',
};

const bgColors: Record<Toast['tipo'], string> = {
  success: 'bg-green-900/80 border-green-600',
  error: 'bg-red-900/80 border-red-600',
  info: 'bg-blue-900/80 border-blue-600',
};

export function ToastList({ toasts, onDismiss }: ToastListProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in min-w-[280px] ${bgColors[t.tipo]}`}
        >
          <span>{icons[t.tipo]}</span>
          <span className="text-white text-sm flex-1">{t.mensaje}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
