import { useState, useCallback } from 'react';
import type { FieldErrors } from '../utils/validators';

export function useForm<T extends Record<string, unknown>>(
  initial: T,
  validate?: (values: T) => FieldErrors
) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setField = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFields = useCallback((patch: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      setValues((prev) => ({ ...prev, [field]: val }));
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    if (!validate) return true;
    const errs = validate(values);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [values, validate]);

  const reset = useCallback((next?: T) => {
    setValues(next ?? initial);
    setErrors({});
    setTouched({});
  }, [initial]);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  return { values, errors, touched, setField, setFields, handleChange, validateForm, reset, markTouched, setValues, setErrors };
}
