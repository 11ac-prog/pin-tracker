import { AcquisitionMethod, type Pin } from "@/generated/prisma/client";
import Link from "next/link";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { PhotoPicker } from "@/components/PhotoPicker";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function PinForm({
  pin,
  action,
}: {
  pin?: Pin;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-4" encType="multipart/form-data">
      {pin ? <input type="hidden" name="id" defaultValue={pin.id} /> : null}

      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={pin?.name}
          className={inputClass}
          placeholder="e.g. Loungefly Stitch Mystery Pin"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="series">
          Set / Series
        </label>
        <input
          id="series"
          name="series"
          defaultValue={pin?.series ?? ""}
          className={inputClass}
          placeholder="e.g. Hidden Mickey Series 12"
        />
      </div>

      <div>
        <label className={labelClass}>Photo</label>
        <input type="hidden" name="currentImageUrl" defaultValue={pin?.imageUrl ?? ""} />
        <PhotoPicker initialImageUrl={pin?.imageUrl} />
        <details className="mt-2" open={Boolean(pin?.imageUrl && !pin.imageUrl.startsWith("/uploads/"))}>
          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
            Or paste an image URL instead
          </summary>
          <input
            id="imageUrl"
            name="imageUrl"
            defaultValue={pin?.imageUrl && !pin.imageUrl.startsWith("/uploads/") ? pin.imageUrl : ""}
            className={`${inputClass} mt-2`}
            placeholder="https://..."
          />
        </details>
      </div>

      {pin ? null : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="acquisitionDate">
                Acquired on
              </label>
              <input
                id="acquisitionDate"
                name="acquisitionDate"
                type="date"
                defaultValue={toDateInputValue(null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="acquisitionMethod">
                How you got it
              </label>
              <select
                id="acquisitionMethod"
                name="acquisitionMethod"
                defaultValue={AcquisitionMethod.BOUGHT}
                className={inputClass}
              >
                <option value={AcquisitionMethod.BOUGHT}>Bought</option>
                <option value={AcquisitionMethod.TRADED}>Traded</option>
                <option value={AcquisitionMethod.GIFTED}>Gifted</option>
                <option value={AcquisitionMethod.OTHER}>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="quantity">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              step="1"
              min="1"
              defaultValue={1}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              Bought more than one at the same price? Set the quantity here. Buying more later at a
              different price? Use the + button on the pin&apos;s card instead of a new entry.
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="pricePaid">
              Price paid ($ per pin)
            </label>
            <input
              id="pricePaid"
              name="pricePaid"
              type="number"
              step="0.01"
              min="0"
              defaultValue=""
              className={inputClass}
            />
          </div>
        </>
      )}

      <div>
        <label className={labelClass} htmlFor="currentValue">
          Current estimated worth ($ per pin)
        </label>
        <input
          id="currentValue"
          name="currentValue"
          type="number"
          step="0.01"
          min="0"
          defaultValue={pin?.currentValue ?? ""}
          className={inputClass}
        />
      </div>

      {pin ? (
        <p className="text-xs text-slate-500">
          Quantity and price paid are managed from the pin&apos;s detail page now, since they can
          come from more than one purchase.
        </p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={pin?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className={primaryButtonClass}>
          {pin ? "Save changes" : "Add pin"}
        </button>
        <Link href="/pins" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
