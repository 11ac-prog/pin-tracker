"use client";

import type { ReactNode } from "react";

export function DeleteButton({
  confirmText = "Are you sure you want to delete this?",
  label = "Delete",
  ariaLabel,
  className = "text-sm font-medium",
}: {
  confirmText?: string;
  label?: ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`${className} text-rose-400 hover:bg-rose-400/10 hover:text-rose-300`}
      onClick={(event) => {
        if (!confirm(confirmText)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
