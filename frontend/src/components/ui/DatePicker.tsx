import { type InputHTMLAttributes, forwardRef } from 'react';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="date"
            className={`w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white
              focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent
              ${error ? 'border-red-500' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
