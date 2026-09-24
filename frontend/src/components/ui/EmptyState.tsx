import { type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon name="archivar" className="w-12 h-12 text-slate-600 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && <p className="text-slate-400 mb-4 max-w-md">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
