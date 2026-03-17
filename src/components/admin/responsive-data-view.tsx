"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render: (item: T) => React.ReactNode;
}

interface ResponsiveDataViewProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

export function ResponsiveDataView<T>({
  data,
  columns,
  keyExtractor,
  renderCard,
  emptyIcon,
  emptyTitle = "No data found",
  emptyDescription,
  emptyAction,
}: ResponsiveDataViewProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 rounded-lg border border-[#E2E8F0] bg-white">
        {emptyIcon && <div className="mb-3 flex justify-center">{emptyIcon}</div>}
        <p className="text-gray-500 font-medium mb-1">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-sm text-gray-400 mb-4">{emptyDescription}</p>
        )}
        {emptyAction}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <tr>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.label}
                </TableHead>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={keyExtractor(item)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Card list */}
      <div className="lg:hidden space-y-3">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className="rounded-lg border border-[#E2E8F0] bg-white p-4"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            {renderCard(item)}
          </div>
        ))}
      </div>
    </>
  );
}
