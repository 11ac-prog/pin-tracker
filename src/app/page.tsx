import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate, lineTotal } from "@/lib/format";
import { PinStatus } from "@/generated/prisma/client";
import { cardClass, statLabelClass } from "@/components/form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [ownedPins, soldPins, wishlistCount, tradeCount, tradeShipping] = await Promise.all([
    prisma.pin.findMany({ where: { status: PinStatus.OWNED }, orderBy: { createdAt: "desc" } }),
    prisma.pin.findMany({ where: { status: PinStatus.SOLD } }),
    prisma.wishlistItem.count(),
    prisma.trade.count(),
    prisma.trade.findMany({
      where: { shippingCost: { not: null }, shippingInPinCost: false },
      select: { shippingCost: true },
    }),
  ]);

  // Cost of what you still own: what unrealized gain is measured against.
  const ownedCost = ownedPins.reduce((sum, p) => sum + (lineTotal(p.pricePaid, p.quantity) ?? 0), 0);
  // All-time spend: pins you've sold still count, so a sale never lowers it.
  // (A sold pin keeps its cost on its own row — a partial sale just splits
  // the quantity between the owned and sold rows — and trades carry cost
  // from the pins given to the pins received, so this stays put through both.)
  const soldCost = soldPins.reduce((sum, p) => sum + (lineTotal(p.pricePaid, p.quantity) ?? 0), 0);
  // Shipping paid on trades is money out too — unless it was already spread
  // into the received pins' prices (then it's in ownedCost/soldCost already).
  const tradeShippingCost = tradeShipping.reduce((sum, t) => sum + (t.shippingCost ?? 0), 0);
  const totalPaid = ownedCost + soldCost + tradeShippingCost;
  // Cash actually in hand from sales: price minus the fee and shipping you paid.
  const moneyCollected = soldPins.reduce(
    (sum, p) => sum + ((p.soldPrice ?? 0) - (p.soldFee ?? 0) - (p.shippingCost ?? 0)),
    0,
  );
  const leftToRecover = Math.max(0, totalPaid - moneyCollected);
  const recoveredPct = totalPaid > 0 ? Math.min(100, (moneyCollected / totalPaid) * 100) : 0;
  const freeCollection = totalPaid > 0 && moneyCollected >= totalPaid;
  // Worth is its own thing: only pins with a worth set count here, never
  // standing in for what was paid. Gain is measured on those same pins.
  const pricedPins = ownedPins.filter((p) => p.currentValue !== null);
  const totalWorth = pricedPins.reduce((sum, p) => sum + (lineTotal(p.currentValue, p.quantity) ?? 0), 0);
  const pricedCost = pricedPins.reduce((sum, p) => sum + (lineTotal(p.pricePaid, p.quantity) ?? 0), 0);
  const unrealizedGain = totalWorth - pricedCost;
  const realizedProfit = soldPins.reduce(
    (sum, p) =>
      sum +
      ((p.soldPrice ?? 0) -
        (p.soldFee ?? 0) -
        (lineTotal(p.pricePaid, p.quantity) ?? 0) -
        (p.shippingCost ?? 0)),
    0,
  );
  const recentPins = ownedPins.slice(0, 5);
  // Every physical pin (sum of quantities), as opposed to ownedPins.length which counts distinct cards.
  const totalPins = ownedPins.reduce((sum, p) => sum + p.quantity, 0);

  const stats = [
    {
      label: "Pins in collection",
      value: totalPins.toString(),
      hint: `${ownedPins.length} different pins`,
    },
    { label: "Total paid", value: formatCurrency(totalPaid), hint: "All-time: pins (sold ones too) plus trade shipping" },
    { label: "Money collected", value: formatCurrency(moneyCollected), hint: "From sales, after fees and shipping" },
    {
      label: "Estimated worth",
      value: formatCurrency(totalWorth),
      hint: `${pricedPins.length} of ${ownedPins.length} pins have a worth set`,
    },
    {
      label: "Unrealized gain / loss",
      hint: "On the pins that have a worth set",
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
            {"hint" in stat ? <div className="text-xs text-slate-500">{stat.hint}</div> : null}
          </div>
        ))}
      </div>

      <div className={`${cardClass} p-4`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className={statLabelClass}>Free collection goal</div>
          <div className="text-xs text-slate-500">
            {formatCurrency(moneyCollected)} collected of {formatCurrency(totalPaid)} spent
          </div>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(recoveredPct)}
          aria-label="Share of your spending recovered through sales"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{ width: `${recoveredPct}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          {freeCollection ? (
            <div className="text-lg font-bold text-emerald-400">
              Your collection is free — {formatCurrency(moneyCollected - totalPaid)} ahead
            </div>
          ) : (
            <div className="text-lg font-bold text-slate-100">
              {formatCurrency(leftToRecover)} left to recover
            </div>
          )}
          <div className="text-sm text-slate-400">{recoveredPct.toFixed(1)}% recovered</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/wishlist"
          className={`${cardClass} p-4 transition hover:border-emerald-400/30 hover:bg-white/[0.05]`}
        >
          <div className={statLabelClass}>ISO</div>
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
                  <div className="text-right text-sm text-slate-300">
                    {formatCurrency(lineTotal(pin.pricePaid, pin.quantity))}
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">paid</div>
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
