import type { WishlistItem } from "@/generated/prisma/client";
import Link from "next/link";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { PhotoPicker } from "@/components/PhotoPicker";
import { SeriesDatalist } from "@/components/SeriesDatalist";

export function WishlistForm({
  item,
  action,
  seriesOptions = [],
}: {
  item?: WishlistItem;
  action: (formData: FormData) => void;
  seriesOptions?: string[];
}) {
  return (
    <form action={action} className="space-y-4" encType="multipart/form-data">
      {item ? <input type="hidden" name="id" defaultValue={item.id} /> : null}

      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={item?.name}
          className={inputClass}
          placeholder="e.g. Cheshire Cat Glow-in-the-Dark Pin"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="series">
          Set / Series
        </label>
        <input
          id="series"
          name="series"
          list="series-options"
          autoComplete="off"
          defaultValue={item?.series ?? ""}
          className={inputClass}
          placeholder="Pick an existing series or type a new one"
        />
        <SeriesDatalist id="series-options" options={seriesOptions} />
      </div>

      <div>
        <label className={labelClass}>Photo</label>
        <input type="hidden" name="currentImageUrl" defaultValue={item?.imageUrl ?? ""} />
        <PhotoPicker initialImageUrl={item?.imageUrl} />
        <details className="mt-2" open={Boolean(item?.imageUrl && !item.imageUrl.startsWith("/uploads/"))}>
          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
            Or paste an image URL instead
          </summary>
          <input
            id="imageUrl"
            name="imageUrl"
            defaultValue={item?.imageUrl && !item.imageUrl.startsWith("/uploads/") ? item.imageUrl : ""}
            className={`${inputClass} mt-2`}
            placeholder="https://..."
          />
        </details>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="estimatedValue">
            Estimated worth ($)
          </label>
          <input
            id="estimatedValue"
            name="estimatedValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item?.estimatedValue ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={item?.priority ?? 2}
            className={inputClass}
          >
            <option value={1}>High</option>
            <option value={2}>Medium</option>
            <option value={3}>Low</option>
          </select>
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
          defaultValue={item?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className={primaryButtonClass}>
          {item ? "Save changes" : "Add to ISO"}
        </button>
        <Link href="/wishlist" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
