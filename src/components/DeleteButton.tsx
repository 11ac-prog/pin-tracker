"use client";

export function DeleteButton({
  confirmText = "Are you sure you want to delete this?",
  label = "Delete",
}: {
  confirmText?: string;
  label?: string;
}) {
  return (
    <button
      type="submit"
      className="text-sm font-medium text-red-600 hover:text-red-800"
      onClick={(event) => {
        if (!confirm(confirmText)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
