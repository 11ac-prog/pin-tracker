import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate, lineTotal } from "@/lib/format";
import { restorePin } from "../pins/actions";
import { cardClass, secondaryButtonClass, statLabelClass } from "@/components/form";
import { PinStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function SoldPage() {
  const soldPins = await prisma.pin.findMany({
    where: { status: PinStatus.SOLD },
    orderBy: { soldDate: "desc" },
  });

  const totalPaid = soldPins.reduce((sum, p) => sum + (lineTotal(p.pricePaid, p.quantity) ?? 0), 0);
  const totalSold = soldPins.reduce((sum, p) => sum + (p.soldPrice ?? 0), 0);
  const totalShipping = soldPins.reduce((sum, p) => sum + (p.shippingCost ?? 0), 0);
  const totalProfit = totalSold - totalPaid - totalShipping;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Sold</h1>
          <p className="text-sm text-slate-500">
            {soldPins.length} pin{soldPins.length === 1 ? "" : "s"} sold
          </p>
        </div>
        <Link href="/pins" className={secondaryButtonClass}>
          Back to collection
        </Link>
      </div>

      {soldPins.length === 0 ? (
        <div className={`${cardClass} border-dashed p-10 text-center text-slate-500`}>
          You haven&apos;t sold any pins yet. Sell one from your{" "}
          <Link href="/pins" className="font-semibold text-emerald-300 underline underline-offset-4">
            collection
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`${cardClass} p-4`}>
              <div className={statLabelClass}>Total paid</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">
                {formatCurrency(totalPaid)}
              </div>
            </div>
            <div className={`${cardClass} p-4`}>
              <div className={statLabelClass}>Total sold for</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">
                {formatCurrency(totalSold)}
              </div>
            </div>
            <div className={`${cardClass} p-4`}>
              <div className={statLabelClass}>Shipping costs</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">
                {formatCurrency(totalShipping)}
              </div>
            </div>
            <div className={`${cardClass} p-4`}>
              <div className={statLabelClass}>Realized profit</div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  totalProfit > 0
                    ? "text-emerald-400"
                    : totalProfit < 0
                      ? "text-rose-400"
                      : "text-slate-100"
                }`}
              >
                {totalProfit > 0 ? "+" : ""}
                {formatCurrency(totalProfit)}
              </div>
            </div>
          </div>

          <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5 text-sm">
                <thead className="bg-white/[0.03] text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Pin</th>
                    <th className="px-4 py-3">Sold on</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Sold for</th>
                    <th className="px-4 py-3 text-right">Shipping</th>
                    <th className="px-4 py-3 text-right">Profit</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {soldPins.map((pin) => {
                    const linePaid = lineTotal(pin.pricePaid, pin.quantity);
                    const profit =
                      pin.soldPrice !== null
                        ? pin.soldPrice - (linePaid ?? 0) - (pin.shippingCost ?? 0)
                        : null;
                    return (
                      <tr key={pin.id} className="transition hover:bg-white/[0.03]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {pin.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={pin.imageUrl}
                                alt=""
                                className="h-10 w-10 rounded-md border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-black/20 text-lg">
                                📌
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-100">{pin.name}</span>
                                {pin.quantity > 1 ? (
                                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                                    ×{pin.quantity}
                                  </span>
                                ) : null}
                              </div>
                              {pin.series ? (
                                <div className="text-xs text-slate-500">{pin.series}</div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(pin.soldDate)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {formatCurrency(linePaid)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {formatCurrency(pin.soldPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {formatCurrency(pin.shippingCost)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            profit === null
                              ? "text-slate-600"
                              : profit > 0
                                ? "text-emerald-400"
                                : profit < 0
                                  ? "text-rose-400"
                                  : "text-slate-400"
                          }`}
                        >
                          {profit === null ? "—" : `${profit > 0 ? "+" : ""}${formatCurrency(profit)}`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <form action={restorePin}>
                              <input type="hidden" name="id" value={pin.id} />
                              <button type="submit" className={secondaryButtonClass}>
                                Undo
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
