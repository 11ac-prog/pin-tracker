import { AcquisitionMethod } from "@/generated/prisma/client";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/components/form";
import { SeriesDatalist } from "@/components/SeriesDatalist";
import { getSeriesOptions } from "@/lib/series";
import { bulkAddPins } from "./actions";

export const dynamic = "force-dynamic";

export default async function BulkAddPage() {
  const seriesOptions = await getSeriesOptions();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Bulk add pins</h1>
        <p className="text-sm text-slate-500">
          For a box, calendar or lot you bought together: paste the names (one per line, bullets
          are fine), set the shared details once, and each name becomes its own pin with one
          purchase. Add photos afterwards from the Photo import page.
        </p>
      </div>

      <form action={bulkAddPins} className={`${cardClass} space-y-4 p-6`}>
        <div>
          <label className={labelClass} htmlFor="names">
            Pin names (one per line)
          </label>
          <textarea id="names" name="names" rows={12} required className={`${inputClass} font-mono text-xs`} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="series">
              Set / Series
            </label>
            <input
              id="series"
              name="series"
              list="series-options"
              autoComplete="off"
              className={inputClass}
              placeholder="Pick an existing series or type a new one"
            />
            <SeriesDatalist id="series-options" options={seriesOptions} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pricePaid">
              Price paid ($ per pin)
            </label>
            <input id="pricePaid" name="pricePaid" type="number" step="0.01" min="0" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="acquisitionDate">
              Acquired on
            </label>
            <input
              id="acquisitionDate"
              name="acquisitionDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="acquisitionMethod">
              How you got them
            </label>
            <select id="acquisitionMethod" name="acquisitionMethod" defaultValue={AcquisitionMethod.BOUGHT} className={inputClass}>
              <option value={AcquisitionMethod.BOUGHT}>Bought</option>
              <option value={AcquisitionMethod.TRADED}>Traded</option>
              <option value={AcquisitionMethod.GIFTED}>Gifted</option>
              <option value={AcquisitionMethod.OTHER}>Other</option>
            </select>
          </div>
        </div>

        <button type="submit" className={primaryButtonClass}>
          Add pins
        </button>
      </form>
    </div>
  );
}
