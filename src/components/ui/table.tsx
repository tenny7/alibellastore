import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[#E2E8F0]">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn("bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn("divide-y divide-[#E2E8F0]", className)}>{children}</tbody>;
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn("bg-white even:bg-[#F8FAFC] hover:bg-gray-50 transition-colors", className)}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: TableProps) {
  return <th className={cn("px-4 py-3", className)}>{children}</th>;
}

export function TableCell({ children, className }: TableProps) {
  return <td className={cn("px-4 py-3 text-gray-700", className)}>{children}</td>;
}
