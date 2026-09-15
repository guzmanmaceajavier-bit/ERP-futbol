interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  success: 'bg-green-900/50 text-green-300 border-green-700',
  danger: 'bg-red-900/50 text-red-300 border-red-700',
  warning: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  info: 'bg-blue-900/50 text-blue-300 border-blue-700',
  default: 'bg-slate-700 text-slate-300 border-slate-600',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
