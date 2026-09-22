"use client";

import { useState } from "react";
import Link from "next/link";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";

type TradeItemRow = {
  key: string;
  direction: "GIVEN" | "RECEIVED";
  description: string;
  estimatedValue: string;
  pinId: string;
  addToCollection: boolean;
};

let keyCounter = 0;
function newRow(direction: TradeItemRow["direction"]): TradeItemRow {
  keyCounter += 1;
  return {
    key: `row-${keyCounter}`,
    direction,
    description: "",
    estimatedValue: "",
    pinId: "",
    addToCollection: true,
  };
}

export function TradeForm({
  action,
  ownedPins,
}: {
  action: (formData: FormData) => void;
  ownedPins: { id: string; name: string }[];
}) {
  const [items, setItems] = useState<TradeItemRow[]>([newRow("GIVEN"), newRow("RECEIVED")]);

  function updateItem(key: string, patch: Partial<TradeItemRow>) {
    setItems((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((row) => row.key !== key));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="itemCount" value={items.length} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="date">
            Trade date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="partnerName">
            Traded with
          </label>
          <input
            id="partnerName"
            name="partnerName"
            className={inputClass}
            placeholder="e.g. Jamie from the Facebook trade group"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">You gave</h2>
        {items
          .filter((row) => row.direction === "GIVEN")
          .map((row, idx) => (
            <div
              key={row.key}
              className="grid grid-cols-1 gap-3 rounded-md border border-neutral-200 p-3 sm:grid-cols-[1fr_1fr_140px_auto]"
            >
              <input
                type="hidden"
                name={`item-${items.indexOf(row)}-direction`}
                value="GIVEN"
              />
              <div>
                {idx === 0 ? <label className="mb-1 block text-xs text-neutral-500">From your collection (optional)</label> : null}
                <select
                  name={`item-${items.indexOf(row)}-pinId`}
                  className={inputClass}
                  value={row.pinId}
                  onChange={(e) => {
                    const pin = ownedPins.find((p) => p.id === e.target.value);
                    updateItem(row.key, {
                      pinId: e.target.value,
                      description: pin ? pin.name : row.description,
                    });
                  }}
                >
                  <option value="">Not tracked in collection</option>
                  {ownedPins.map((pin) => (
                    <option key={pin.id} value={pin.id}>
                      {pin.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {idx === 0 ? <label className="mb-1 block text-xs text-neutral-500">Description</label> : null}
                <input
                  name={`item-${items.indexOf(row)}-description`}
                  className={inputClass}
                  placeholder="What you gave"
                  value={row.description}
                  onChange={(e) => updateItem(row.key, { description: e.target.value })}
                  required
                />
              </div>
              <div>
                {idx === 0 ? <label className="mb-1 block text-xs text-neutral-500">Value ($)</label> : null}
                <input
                  name={`item-${items.indexOf(row)}-estimatedValue`}
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  value={row.estimatedValue}
                  onChange={(e) => updateItem(row.key, { estimatedValue: e.target.value })}
                />
              </div>
              <div className="flex items-end justify-start sm:justify-center">
                <button
                  type="button"
                  onClick={() => removeItem(row.key)}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, newRow("GIVEN")])}
          className={secondaryButtonClass}
        >
          + Add item given
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">You received</h2>
        {items
          .filter((row) => row.direction === "RECEIVED")
          .map((row, idx) => (
            <div
              key={row.key}
              className="grid grid-cols-1 gap-3 rounded-md border border-neutral-200 p-3 sm:grid-cols-[1fr_140px_auto_auto]"
            >
              <input
                type="hidden"
                name={`item-${items.indexOf(row)}-direction`}
                value="RECEIVED"
              />
              <div>
                {idx === 0 ? <label className="mb-1 block text-xs text-neutral-500">Description</label> : null}
                <input
                  name={`item-${items.indexOf(row)}-description`}
                  className={inputClass}
                  placeholder="What you received"
                  value={row.description}
                  onChange={(e) => updateItem(row.key, { description: e.target.value })}
                  required
                />
              </div>
              <div>
                {idx === 0 ? <label className="mb-1 block text-xs text-neutral-500">Value ($)</label> : null}
                <input
                  name={`item-${items.indexOf(row)}-estimatedValue`}
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  value={row.estimatedValue}
                  onChange={(e) => updateItem(row.key, { estimatedValue: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  name={`item-${items.indexOf(row)}-addToCollection`}
                  checked={row.addToCollection}
                  onChange={(e) => updateItem(row.key, { addToCollection: e.target.checked })}
                />
                Add to my collection
              </label>
              <div className="flex items-end justify-start sm:justify-center">
                <button
                  type="button"
                  onClick={() => removeItem(row.key)}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, newRow("RECEIVED")])}
          className={secondaryButtonClass}
        >
          + Add item received
        </button>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} className={inputClass} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className={primaryButtonClass}>
          Save trade
        </button>
        <Link href="/trades" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
