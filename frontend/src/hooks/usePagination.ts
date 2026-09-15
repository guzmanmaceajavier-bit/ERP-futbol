import { useState, useMemo } from 'react';

interface UsePaginationResult<T> {
  pagina: number;
  setPagina: (p: number) => void;
  totalPaginas: number;
  paginados: T[];
  total: number;
}

export function usePagination<T>(items: T[], perPage: number = 10): UsePaginationResult<T> {
  const [pagina, setPagina] = useState(1);
  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / perPage));

  const paginados = useMemo(() => {
    const start = (pagina - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, pagina, perPage]);

  // Reset to page 1 if items shrink
  if (pagina > totalPaginas && totalPaginas > 0) {
    setPagina(totalPaginas);
  }

  return { pagina, setPagina, totalPaginas, paginados, total };
}
