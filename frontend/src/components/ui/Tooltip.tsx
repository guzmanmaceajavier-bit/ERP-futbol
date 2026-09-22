import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
