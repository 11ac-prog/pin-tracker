"use client";

import { useState, useTransition } from "react";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";

// Plain string literals instead of importing the generated Prisma enum:
// that enum lives in the generated client package, and pulling a runtime
// value from it into a client component drags Prisma's Node-only internals
// into the browser bundle and breaks the build.
type AcquisitionMethodValue = "BOUGHT" | "TRADED" | "GIFTED" | "OTHER";

const ACQUISITION_METHOD_OPTIONS: { value: AcquisitionMethodValue; label: string }[] = [
  { value: "BOUGHT", label: "Bought" },
  { value: "TRADED", label: "Traded" },
  { value: "GIFTED", label: "Gifted" },
  { value: "OTHER", label: "Other" },
];

type Purchase = {
  id: string;
  quantity: number;
  pricePaid: number | null;
  acquisitionDate: Date | null;
  acquisitionMethod: AcquisitionMethodValue;
};

function toDateInputValue(date: Date | null) {
  if (!date) return new Date().toISOString().slice(0, 10);
  return new Date(date).toISOString().slice(0, 10);
}

// Compact fields shared by the "add another" and "edit this purchase" forms —
// only the trigger button and which server action gets called differ.
function Fields({ purchase }: { purchase?: Purchase }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Qty
          </label>
          <input
            name="quantity"
            type="number"
            step="1"
            min="1"
            defaultValue={purchase?.quantity ?? 1}
            className={`${inputClass} py-1.5 text-xs`}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Price each
          </label>
          <input
            name="pricePaid"
            type="number"
            step="0.01"
            min="0"
            defaultValue={purchase?.pricePaid ?? ""}
            className={`${inputClass} py-1.5 text-xs`}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Date
          </label>
          <input
            name="acquisitionDate"
            type="date"
            defaultValue={toDateInputValue(purchase?.acquisitionDate ?? null)}
            className={`${inputClass} py-1.5 text-xs`}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            How
          </label>
          <select
            name="acquisitionMethod"
            defaultValue={purchase?.acquisitionMethod ?? "BOUGHT"}
            className={`${inputClass} py-1.5 text-xs`}
          >
            {ACQUISITION_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

export function AddPurchaseButton({
  pinId,
  lastPrice,
  lastMethod,
  compact = false,
  action,
}: {
  pinId: string;
  lastPrice: number | null;
  lastMethod: AcquisitionMethodValue;
  compact?: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          title="Add another one of this pin"
          aria-label="Add another one of this pin"
          className={
            compact
              ? "flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-xs font-bold leading-none text-emerald-300 transition hover:bg-emerald-400/20"
              : `${secondaryButtonClass} !text-emerald-300`
          }
        >
          {compact ? "+" : "+ Add another purchase"}
        </button>
      </div>
    );
  }

  return (
    <form
      className="w-full space-y-2 rounded-md border border-white/10 bg-black/30 p-3"
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          await action(formData);
          setOpen(false);
        });
      }}
    >
      <input type="hidden" name="pinId" value={pinId} />
      <Fields purchase={{ id: "", quantity: 1, pricePaid: lastPrice, acquisitionDate: null, acquisitionMethod: lastMethod }} />
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className={`${primaryButtonClass} flex-1 !py-1.5 text-[10px]`}>
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
          className={`${secondaryButtonClass} !py-1.5 text-[10px]`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function EditPurchaseButton({
  purchase,
  action,
}: {
  purchase: Purchase;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-100"
      >
        Edit
      </button>
    );
  }

  return (
    <form
      className="w-full space-y-2 rounded-md border border-white/10 bg-black/30 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          await action(formData);
          setOpen(false);
        });
      }}
    >
      <input type="hidden" name="purchaseId" value={purchase.id} />
      <Fields purchase={purchase} />
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className={`${primaryButtonClass} flex-1 !py-1.5 text-[10px]`}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={`${secondaryButtonClass} !py-1.5 text-[10px]`}>
          Cancel
        </button>
      </div>
    </form>
  );
}
