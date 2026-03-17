"use client";

import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick?: () => void;
  href?: string;
  label?: string;
}

export function FloatingActionButton({ onClick, href, label = "Add" }: FloatingActionButtonProps) {
  const className =
    "fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-white shadow-lg hover:bg-primary-hover active:scale-95 transition-all lg:hidden";

  if (href) {
    return (
      <a href={href} className={className}>
        <Plus className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      <Plus className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
