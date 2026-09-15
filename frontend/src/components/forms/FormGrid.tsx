import { type ReactNode } from 'react';

interface FormGridProps {
  cols?: 1 | 2 | 3;
  children: ReactNode;
}

export function FormGrid({ cols = 2, children }: FormGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  };

  return <div className={gridCols[cols]}>{children}</div>;
}
