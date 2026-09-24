import { type InputHTMLAttributes } from 'react';
import { Icon } from '../ui/Icon';

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...', className = '', ...props }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="buscar" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white
          placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent
          ${className}`}
        {...props}
      />
    </div>
  );
}
