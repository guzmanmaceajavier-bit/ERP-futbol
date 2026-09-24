import { Icon } from '../ui/Icon';

export function LoadingOverlay({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon name="cargando" className="h-10 w-10 text-[#22C55E] mb-4" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}
