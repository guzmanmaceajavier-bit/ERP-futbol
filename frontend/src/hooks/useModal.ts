import { useState, useCallback } from 'react';

interface UseModalResult<T> {
  isOpen: boolean;
  editing: T | null;
  openNew: () => void;
  openEdit: (item: T) => void;
  close: () => void;
}

export function useModal<T = unknown>(): UseModalResult<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const openNew = useCallback(() => {
    setEditing(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditing(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditing(null);
  }, []);

  return { isOpen, editing, openNew, openEdit, close };
}
