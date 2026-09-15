interface PaginationProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ pagina, totalPaginas, total, onPrev, onNext }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
      <span className="text-sm text-slate-400">
        {total} registros | Pagina {pagina} de {totalPaginas}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={pagina <= 1}
          className="px-3 py-1 rounded bg-slate-700 text-white text-sm disabled:opacity-50 hover:bg-slate-600 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={pagina >= totalPaginas}
          className="px-3 py-1 rounded bg-slate-700 text-white text-sm disabled:opacity-50 hover:bg-slate-600 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
