"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cardClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { formatCurrency } from "@/lib/format";

type SellablePin = {
  id: string;
  name: string;
  series: string | null;
  imageUrl: string | null;
  quantity: number;
  pricePaid: number | null;
};

export function BulkSellForm({
  pins,
  action,
}: {
  pins: SellablePin[];
  action: (formData: FormData) => void;
}) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");
  const [shipping, setShipping] = useState("");

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return pins;
    return pins.filter((p) => `${p.name} ${p.series ?? ""}`.toLowerCase().includes(q));
  }, [pins, filter]);

  const chosen = pins.filter((p) => selected[p.id] !== undefined);
  const units = chosen.reduce((sum, p) => sum + selected[p.id], 0);
  const cost = chosen.reduce((sum, p) => sum + (p.pricePaid ?? 0) * selected[p.id], 0);
  const profit =
    price === "" ? null : Number(price) - Number(fee || 0) - Number(shipping || 0) - cost;

  function toggle(pin: SellablePin) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[pin.id] === undefined) next[pin.id] = pin.quantity;
      else delete next[pin.id];
      return next;
    });
  }

  function setQuantity(pin: SellablePin, raw: string) {
    const value = Math.min(Math.max(Math.round(Number(raw) || 1), 1), pin.quantity);
    setSelected((prev) => ({ ...prev, [pin.id]: value }));
  }

  return (
    <form action={action} className="space-y-6">
      {chosen.map((pin) => (
        <span key={pin.id}>
          <input type="hidden" name="pinId" value={pin.id} />
          <input type="hidden" name="qty" value={selected[pin.id]} />
        </span>
      ))}

      <div className="space-y-3">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter pins by name or series…"
          aria-label="Filter pins"
          className={inputClass}
        />
        <div className={`${cardClass} max-h-[28rem] divide-y divide-white/5 overflow-y-auto`}>
          {visible.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No pins match.</p>
          ) : (
            visible.map((pin) => {
              const isSelected = selected[pin.id] !== undefined;
              return (
                <div key={pin.id} className="flex items-center gap-3 p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(pin)}
                    aria-label={`Select ${pin.name}`}
                    className="h-4 w-4 shrink-0"
                  />
                  {pin.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pin.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded border border-white/10 object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-white/10 bg-black/20">
                      📌
                    </div>
                  )}
                  <button type="button" onClick={() => toggle(pin)} className="min-w-0 flex-1 text-left">
                    <div className="truncate font-semibold text-slate-100">{pin.name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {pin.series ?? "No series"} · {pin.quantity > 1 ? `×${pin.quantity} owned · ` : ""}
                      {formatCurrency(pin.pricePaid)} each
                    </div>
                  </button>
                  {isSelected && pin.quantity > 1 ? (
                    <label className="flex items-center gap-1.5 text-xs text-slate-400">
                      Sell
                      <input
                        type="number"
                        min={1}
                        max={pin.quantity}
                        value={selected[pin.id]}
                        onChange={(e) => setQuantity(pin, e.target.value)}
                        className={`${inputClass} w-16 py-1`}
                      />
                    </label>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        <p className="text-sm text-slate-400">
          {chosen.length === 0
            ? "Tick the pins that are in this sale."
            : `${chosen.length} pin${chosen.length === 1 ? "" : "s"} selected (${units} unit${units === 1 ? "" : "s"}) · you paid ${formatCurrency(cost)} for them`}
        </p>
      </div>

      <div className={`${cardClass} space-y-4 p-4`}>
        <h2 className="text-sm font-semibold text-slate-300">One sale for all of them</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="soldPrice">
              Total sale price ($)
            </label>
            <input
              id="soldPrice"
              name="soldPrice"
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="soldDate">
              Sale date
            </label>
            <input
              id="soldDate"
              name="soldDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="soldFee">
              Selling fee ($)
            </label>
            <input
              id="soldFee"
              name="soldFee"
              type="number"
              step="0.01"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className={inputClass}
              placeholder="One fee for the whole sale"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="shippingCost">
              Shipping cost ($)
            </label>
            <input
              id="shippingCost"
              name="shippingCost"
              type="number"
              step="0.01"
              min="0"
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              className={inputClass}
              placeholder="One shipping cost for the whole sale"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          The price, fee and shipping are split across the pins in proportion to what you paid for
          each (evenly per pin if any of them has no cost), so the Sold page adds back up to exactly
          what you entered here.
        </p>
        {profit !== null && chosen.length > 0 ? (
          <p
            className={`text-sm font-bold ${
              profit > 0 ? "text-emerald-400" : profit < 0 ? "text-rose-400" : "text-slate-400"
            }`}
          >
            Estimated profit: {profit > 0 ? "+" : ""}
            {formatCurrency(profit)}
          </p>
        ) : null}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={chosen.length === 0}
          className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Mark {chosen.length > 0 ? chosen.length : ""} as sold
        </button>
        <Link href="/pins" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
