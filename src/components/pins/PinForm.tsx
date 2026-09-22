import { AcquisitionMethod, type Pin } from "@/generated/prisma/client";
import Link from "next/link";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";

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
        <div className="flex items-start gap-4">
          {pin?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pin.imageUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-md border border-neutral-200 object-cover"
            />
          ) : null}
          <div className="flex-1 space-y-2">
            <input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/*"
              className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
            />
            <p className="text-xs text-neutral-500">
              Take a photo or choose one from your device, or paste an image URL instead:
            </p>
            <input
              id="imageUrl"
              name="imageUrl"
              defaultValue={pin?.imageUrl ?? ""}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="acquisitionDate">
            Acquired on
          </label>
          <input
            id="acquisitionDate"
            name="acquisitionDate"
            type="date"
            defaultValue={toDateInputValue(pin?.acquisitionDate)}
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
            defaultValue={pin?.acquisitionMethod ?? AcquisitionMethod.BOUGHT}
            className={inputClass}
          >
            <option value={AcquisitionMethod.BOUGHT}>Bought</option>
            <option value={AcquisitionMethod.TRADED}>Traded</option>
            <option value={AcquisitionMethod.GIFTED}>Gifted</option>
            <option value={AcquisitionMethod.OTHER}>Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="pricePaid">
            Price paid ($)
          </label>
          <input
            id="pricePaid"
            name="pricePaid"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pin?.pricePaid ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="currentValue">
            Current estimated worth ($)
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
      </div>

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
