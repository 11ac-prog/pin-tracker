import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate, lineTotal } from "@/lib/format";
import { PinStatus } from "@/generated/prisma/client";
import { cardClass, statLabelClass } from "@/components/form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [ownedPins, soldPins, wishlistCount, tradeCount] = await Promise.all([
    prisma.pin.findMany({ where: { status: PinStatus.OWNED }, orderBy: { createdAt: "desc" } }),
    prisma.pin.findMany({ where: { status: PinStatus.SOLD } }),
    prisma.wishlistItem.count(),
    prisma.trade.count(),
  ]);

  const totalPaid = ownedPins.reduce((sum, p) => sum + (lineTotal(p.pricePaid, p.quantity) ?? 0), 0);
  const totalWorth = ownedPins.reduce(
    (sum, p) => sum + (lineTotal(p.currentValue, p.quantity) ?? lineTotal(p.pricePaid, p.quantity) ?? 0),
    0,
  );
  const unrealizedGain = totalWorth - totalPaid;
  const realizedProfit = soldPins.reduce(
    (sum, p) =>
      sum + ((p.soldPrice ?? 0) - (lineTotal(p.pricePaid, p.quantity) ?? 0) - (p.shippingCost ?? 0)),
    0,
  );
  const recentPins = ownedPins.slice(0, 5);

  const stats = [
    { label: "Pins in collection", value: ownedPins.length.toString() },
    { label: "Total paid", value: formatCurrency(totalPaid) },
    { label: "Estimated worth", value: formatCurrency(totalWorth) },
    {
      label: "Unrealized gain / loss",
      value: `${unrealizedGain > 0 ? "+" : ""}${formatCurrency(unrealizedGain)}`,
      tone: unrealizedGain > 0 ? "text-emerald-400" : unrealizedGain < 0 ? "text-rose-400" : "text-slate-100",
    },
    {
      label: "Realized profit (sold)",
      value: `${realizedProfit > 0 ? "+" : ""}${formatCurrency(realizedProfit)}`,
      tone: realizedProfit > 0 ? "text-emerald-400" : realizedProfit < 0 ? "text-rose-400" : "text-slate-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500">
          A quick look at your pin collection&apos;s worth and activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`${cardClass} p-4`}>
            <div className={statLabelClass}>{stat.label}</div>
            <div className={`mt-1 text-2xl font-bold ${stat.tone ?? "text-slate-100"}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/wishlist"
          className={`${cardClass} p-4 transition hover:border-emerald-400/30 hover:bg-white/[0.05]`}
        >
          <div className={statLabelClass}>Wishlist</div>
          <div className="mt-1 text-2xl font-bold text-slate-100">{wishlistCount}</div>
          <div className="text-sm text-slate-500">items you&apos;re hunting for</div>
        </Link>
        <Link
          href="/trades"
          className={`${cardClass} p-4 transition hover:border-cyan-400/30 hover:bg-white/[0.05]`}
        >
          <div className={statLabelClass}>Trades</div>
          <div className="mt-1 text-2xl font-bold text-slate-100">{tradeCount}</div>
          <div className="text-sm text-slate-500">trades logged</div>
        </Link>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-100">Recently added</h2>
          <Link href="/pins" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-emerald-300">
            View all
          </Link>
        </div>
        {recentPins.length === 0 ? (
          <div className={`${cardClass} border-dashed p-8 text-center text-slate-500`}>
            No pins yet.{" "}
            <Link href="/pins/new" className="font-semibold text-emerald-300 underline underline-offset-4">
              Add your first pin
            </Link>
            .
          </div>
        ) : (
          <div className={`${cardClass} overflow-hidden`}>
            <ul className="divide-y divide-white/5">
              {recentPins.map((pin) => (
                <li key={pin.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-100">{pin.name}</span>
                      {pin.quantity > 1 ? (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                          ×{pin.quantity}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500">
                      Added {formatDate(pin.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    {formatCurrency(lineTotal(pin.currentValue, pin.quantity) ?? lineTotal(pin.pricePaid, pin.quantity))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
