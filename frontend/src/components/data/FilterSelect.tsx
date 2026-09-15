import { type SelectHTMLAttributes } from 'react';

interface FilterSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}

export function FilterSelect({ value, onChange, options, label, className = '', ...props }: FilterSelectProps) {
  return (
    <div className={className}>
      {label && <label className="block text-xs text-slate-400 mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white
          focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
