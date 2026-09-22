import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { restorePin } from "../pins/actions";
import { secondaryButtonClass } from "@/components/form";
import { PinStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function SoldPage() {
  const soldPins = await prisma.pin.findMany({
    where: { status: PinStatus.SOLD },
    orderBy: { soldDate: "desc" },
  });

  const totalPaid = soldPins.reduce((sum, p) => sum + (p.pricePaid ?? 0), 0);
  const totalSold = soldPins.reduce((sum, p) => sum + (p.soldPrice ?? 0), 0);
  const totalProfit = totalSold - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sold</h1>
          <p className="text-sm text-neutral-500">
            {soldPins.length} pin{soldPins.length === 1 ? "" : "s"} sold
          </p>
        </div>
        <Link href="/pins" className={secondaryButtonClass}>
          Back to collection
        </Link>
      </div>

      {soldPins.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          You haven&apos;t sold any pins yet. Sell one from your{" "}
          <Link href="/pins" className="font-medium text-neutral-900 underline">
            collection
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Total paid
              </div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900">
                {formatCurrency(totalPaid)}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Total sold for
              </div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900">
                {formatCurrency(totalSold)}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Realized profit
              </div>
              <div
                className={`mt-1 text-2xl font-semibold ${
                  totalProfit > 0
                    ? "text-green-600"
                    : totalProfit < 0
                      ? "text-red-600"
                      : "text-neutral-900"
                }`}
              >
                {totalProfit > 0 ? "+" : ""}
                {formatCurrency(totalProfit)}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Pin</th>
                  <th className="px-4 py-3">Sold on</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Sold for</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {soldPins.map((pin) => {
                  const profit =
                    pin.soldPrice !== null ? pin.soldPrice - (pin.pricePaid ?? 0) : null;
                  return (
                    <tr key={pin.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {pin.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pin.imageUrl}
                              alt=""
                              className="h-10 w-10 rounded-md border border-neutral-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-lg">
                              📌
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-neutral-900">{pin.name}</div>
                            {pin.series ? (
                              <div className="text-xs text-neutral-500">{pin.series}</div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{formatDate(pin.soldDate)}</td>
                      <td className="px-4 py-3 text-right text-neutral-600">
                        {formatCurrency(pin.pricePaid)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600">
                        {formatCurrency(pin.soldPrice)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          profit === null
                            ? "text-neutral-400"
                            : profit > 0
                              ? "text-green-600"
                              : profit < 0
                                ? "text-red-600"
                                : "text-neutral-500"
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
        </>
      )}
    </div>
  );
}
