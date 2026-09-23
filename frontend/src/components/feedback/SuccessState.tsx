import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface SuccessStateProps {
  title?: string;
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function SuccessState({
  title = 'Operacion exitosa',
  message,
  onAction,
  actionLabel = 'Continuar',
}: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
        <Icon name="check" className="w-6 h-6 text-green-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {message && <p className="text-slate-400 max-w-md mb-4">{message}</p>}
      {onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
