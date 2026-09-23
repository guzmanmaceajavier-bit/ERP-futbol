import { type ReactNode } from 'react';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = 'No hay registros',
  emptyIcon = '📭',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="cargando" className="h-8 w-8 text-[#22C55E]" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider
                  ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={`transition-colors hover:bg-slate-800/50 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-sm text-slate-300 ${col.className || ''}`}>
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
