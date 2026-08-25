import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-[20px] border border-cream/[0.09]">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn("bg-cream/[0.04] text-left font-display text-[11px] font-medium uppercase tracking-[0.12em] text-cream/45", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn("divide-y divide-cream/[0.07]", className)}>{children}</tbody>;
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn("bg-ink transition-colors hover:bg-cream/[0.04]", className)}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: TableProps) {
  return <th className={cn("px-4 py-3.5", className)}>{children}</th>;
}

export function TableCell({ children, className }: TableProps) {
  return <td className={cn("px-4 py-3.5 text-cream/80", className)}>{children}</td>;
}
