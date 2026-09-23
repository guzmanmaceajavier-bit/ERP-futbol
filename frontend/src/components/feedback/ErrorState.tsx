import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon name="alerta" className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">Algo salio mal</h3>
      <p className="text-slate-400 mb-4 max-w-md">{error}</p>
      {onRetry && <Button onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}
