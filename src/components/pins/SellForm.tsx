import type { Pin } from "@/generated/prisma/client";
import Link from "next/link";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";

export function SellForm({
  pin,
  action,
}: {
  pin: Pin;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" defaultValue={pin.id} />

      {pin.quantity > 1 ? (
        <div>
          <label className={labelClass} htmlFor="soldQuantity">
            Quantity to sell (of {pin.quantity})
          </label>
          <input
            id="soldQuantity"
            name="soldQuantity"
            type="number"
            step="1"
            min="1"
            max={pin.quantity}
            defaultValue={pin.quantity}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">
            Selling fewer than {pin.quantity} keeps the rest in your collection as their own entry.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="soldPrice">
            Sale price ($ total)
          </label>
          <input
            id="soldPrice"
            name="soldPrice"
            type="number"
            step="0.01"
            min="0"
            required
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
          className={inputClass}
          placeholder="What you paid to ship it to the buyer"
        />
        <p className="mt-1 text-xs text-slate-500">
          Counted as an expense against this sale&apos;s profit.
        </p>
      </div>

      {pin.pricePaid !== null ? (
        <p className="text-sm text-slate-500">
          Originally paid {"$" + pin.pricePaid.toFixed(2)}
          {pin.quantity > 1
            ? ` each ($${(pin.pricePaid * pin.quantity).toFixed(2)} total for all ${pin.quantity}).`
            : " for this pin."}
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button type="submit" className={primaryButtonClass}>
          Mark as sold
        </button>
        <Link href="/pins" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
