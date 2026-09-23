import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { PinStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [ownedPins, soldPins, wishlistCount, tradeCount] = await Promise.all([
    prisma.pin.findMany({ where: { status: PinStatus.OWNED }, orderBy: { createdAt: "desc" } }),
    prisma.pin.findMany({ where: { status: PinStatus.SOLD } }),
    prisma.wishlistItem.count(),
    prisma.trade.count(),
  ]);

  const totalPaid = ownedPins.reduce((sum, p) => sum + (p.pricePaid ?? 0), 0);
  const totalWorth = ownedPins.reduce((sum, p) => sum + (p.currentValue ?? p.pricePaid ?? 0), 0);
  const unrealizedGain = totalWorth - totalPaid;
  const realizedProfit = soldPins.reduce(
    (sum, p) => sum + ((p.soldPrice ?? 0) - (p.pricePaid ?? 0) - (p.shippingCost ?? 0)),
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
      tone: unrealizedGain > 0 ? "text-green-600" : unrealizedGain < 0 ? "text-red-600" : "text-neutral-900",
    },
    {
      label: "Realized profit (sold)",
      value: `${realizedProfit > 0 ? "+" : ""}${formatCurrency(realizedProfit)}`,
      tone: realizedProfit > 0 ? "text-green-600" : realizedProfit < 0 ? "text-red-600" : "text-neutral-900",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500">
          A quick look at your pin collection&apos;s worth and activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {stat.label}
            </div>
            <div className={`mt-1 text-2xl font-semibold ${stat.tone ?? "text-neutral-900"}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/wishlist"
          className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Wishlist
          </div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{wishlistCount}</div>
          <div className="text-sm text-neutral-500">items you&apos;re hunting for</div>
        </Link>
        <Link href="/trades"
          className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Trades
          </div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{tradeCount}</div>
          <div className="text-sm text-neutral-500">trades logged</div>
        </Link>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recently added</h2>
          <Link href="/pins" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            View all
          </Link>
        </div>
        {recentPins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
            No pins yet.{" "}
            <Link href="/pins/new" className="font-medium text-neutral-900 underline">
              Add your first pin
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <ul className="divide-y divide-neutral-100">
              {recentPins.map((pin) => (
                <li key={pin.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-neutral-900">{pin.name}</div>
                    <div className="text-xs text-neutral-500">
                      Added {formatDate(pin.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {formatCurrency(pin.currentValue ?? pin.pricePaid)}
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
