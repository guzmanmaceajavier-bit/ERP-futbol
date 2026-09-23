import { useState, useEffect } from 'react';

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  placeholder?: string;
}
type NumberInputPropsLoose = Omit<NumberInputProps, 'value' | 'onChange'> & { value: number | ''; onChange: (v: number | '') => void };

function clamp(n: number, min?: number, max?: number): number {
  let v = n;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
}

export function NumberInput({ label, value, onChange, min, max, step = 1, error, placeholder }: NumberInputPropsLoose) {
  const [display, setDisplay] = useState<string>(value === '' ? '' : String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplay(value === '' ? '' : String(value));
    }
  }, [value, focused]);

  const handleChange = (raw: string) => {
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      setDisplay(raw);
      onChange('');
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      return;
    }
    // Strip leading zeros: "05" -> "5", "007" -> "7", but keep "0" and "0.xxx"
    let normalized = raw;
    const isNegative = normalized.startsWith('-');
    const core = isNegative ? normalized.slice(1) : normalized;
    if (core.length > 1 && core.startsWith('0') && !core.startsWith('0.')) {
      normalized = (isNegative ? '-' : '') + core.replace(/^0+/, '');
      if (normalized === '' || normalized === '-') normalized = '0';
    }
    // If raw had leading zeros, show normalized immediately
    if (normalized !== raw) {
      setDisplay(normalized);
      const reparsed = Number(normalized);
      if (!Number.isNaN(reparsed)) {
        onChange(clamp(reparsed, min, max));
        return;
      }
    } else {
      setDisplay(raw);
    }
    onChange(clamp(parsed, min, max));
  };

  const handleBlur = () => {
    setFocused(false);
    if (display === '' || display === '-' || display === '.' || display === '-.') {
      // empty -> 0 or min
      const fallback = min !== undefined ? clamp(0, min, max) : 0;
      // if original value allowed '' we could keep '', but spec says handle empty as 0 or keep as-is
      // For optional fields we preserve '' so parent can send null; for required we send fallback
      // Detect: if value === '' before, keep ''? We send '' to parent, keep display ''
      // If parent expects number (min=0 required), they will have handled '' as 0 via onChange('');
      // Here we decide: keep display '' and leave value as '' (parent already notified)
      // But to avoid overwriting, we don't force to fallback unless parent's value is number
      // If display empty and parent's value is '', keep ''
      if (value === '') {
        setDisplay('');
        onChange('');
      } else {
        setDisplay(String(fallback));
        onChange(fallback);
      }
      return;
    }
    const parsed = Number(display);
    if (Number.isNaN(parsed)) {
      const fallback = min !== undefined ? clamp(0, min, max) : 0;
      setDisplay(String(fallback));
      onChange(fallback);
      return;
    }
    const clamped = clamp(parsed, min, max);
    if (String(clamped) !== display) {
      setDisplay(String(clamped));
    }
    onChange(clamped);
  };

  const getNumericValue = (): number => {
    if (typeof value === 'number') return value;
    if (display === '' || display === '-' ) return min !== undefined ? min : 0;
    const p = Number(display);
    if (Number.isNaN(p)) return typeof value === 'number' ? value : (min ?? 0);
    return p;
  };

  const handleDecrement = () => {
    const current = getNumericValue();
    const next = clamp(current - step, min, max);
    setDisplay(String(next));
    onChange(next);
  };

  const handleIncrement = () => {
    const current = getNumericValue();
    const next = clamp(current + step, min, max);
    setDisplay(String(next));
    onChange(next);
  };

  const isMinDisabled = min !== undefined && getNumericValue() <= min;
  const isMaxDisabled = max !== undefined && getNumericValue() >= max;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isMinDisabled}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="decrement"
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          className={`flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white
            placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent
            ${error ? 'border-red-500' : ''}`}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={isMaxDisabled}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="increment"
        >
          +
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
