import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { TradeDirection } from "@/generated/prisma/client";
import { updateTrade } from "../../actions";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

export default async function EditTradePage(props: PageProps<"/trades/[id]/edit">) {
  const { id } = await props.params;
  const trade = await prisma.trade.findUnique({ where: { id }, include: { items: true } });

  if (!trade) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Edit trade</h1>
      <div className={`${cardClass} p-6`}>
        <form action={updateTrade} className="space-y-6">
          <input type="hidden" name="id" value={trade.id} />
          <input type="hidden" name="itemIds" value={trade.items.map((i) => i.id).join(",")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="date">
                Trade date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={toDateInputValue(trade.date)}
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
                defaultValue={trade.partnerName ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              You can fix a description or value here, but not which pins were involved — that was
              already applied to your collection when this trade was logged. To change what was
              actually traded, delete this trade and log it again.
            </p>
            {trade.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-3 rounded-md border border-white/10 p-3 sm:grid-cols-[80px_1fr_140px]"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {item.direction === TradeDirection.GIVEN ? "You gave" : "You received"}
                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                </div>
                <input
                  name={`item-${item.id}-description`}
                  defaultValue={item.description}
                  className={inputClass}
                />
                <div>
                  <input
                    name={`item-${item.id}-estimatedValue`}
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={item.estimatedValue ?? ""}
                    className={inputClass}
                    placeholder="$ total"
                  />
                </div>
              </div>
            ))}
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
              defaultValue={trade.shippingCost ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={trade.notes ?? ""}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={primaryButtonClass}>
              Save changes
            </button>
            <Link href="/trades" className={secondaryButtonClass}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
