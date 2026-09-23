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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="soldPrice">
            Sale price ($)
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
        <p className="mt-1 text-xs text-neutral-500">
          Counted as an expense against this sale&apos;s profit.
        </p>
      </div>

      {pin.pricePaid !== null ? (
        <p className="text-sm text-neutral-500">Originally paid {"$" + pin.pricePaid.toFixed(2)} for this pin.</p>
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
