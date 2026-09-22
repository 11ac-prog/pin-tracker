import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { deletePin, restorePin } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { PinStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function PinsPage() {
  const [pins, soldPins] = await Promise.all([
    prisma.pin.findMany({
      where: { status: PinStatus.OWNED },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pin.findMany({
      where: { status: PinStatus.SOLD },
      orderBy: { soldDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Collection</h1>
            <p className="text-sm text-neutral-500">
              {pins.length} pin{pins.length === 1 ? "" : "s"} tracked
            </p>
          </div>
          <Link href="/pins/new" className={primaryButtonClass}>
            + Add pin
          </Link>
        </div>

        {pins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            No pins yet.{" "}
            <Link href="/pins/new" className="font-medium text-neutral-900 underline">
              Add your first pin
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Pin</th>
                  <th className="px-4 py-3">Acquired</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Worth</th>
                  <th className="px-4 py-3 text-right">Gain / Loss</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pins.map((pin) => {
                  const gain =
                    pin.currentValue !== null && pin.pricePaid !== null
                      ? pin.currentValue - pin.pricePaid
                      : null;
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
                      <td className="px-4 py-3 text-neutral-600">
                        {formatDate(pin.acquisitionDate)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {pin.acquisitionMethod[0] + pin.acquisitionMethod.slice(1).toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600">
                        {formatCurrency(pin.pricePaid)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600">
                        {formatCurrency(pin.currentValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          gain === null
                            ? "text-neutral-400"
                            : gain > 0
                              ? "text-green-600"
                              : gain < 0
                                ? "text-red-600"
                                : "text-neutral-500"
                        }`}
                      >
                        {gain === null ? "—" : `${gain > 0 ? "+" : ""}${formatCurrency(gain)}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/pins/${pin.id}/sell`}
                            className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                          >
                            Sell
                          </Link>
                          <Link
                            href={`/pins/${pin.id}/edit`}
                            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                          >
                            Edit
                          </Link>
                          <form action={deletePin}>
                            <input type="hidden" name="id" value={pin.id} />
                            <DeleteButton confirmText={`Delete "${pin.name}" from your collection?`} />
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {soldPins.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Sold</h2>
            <p className="text-sm text-neutral-500">
              {soldPins.length} pin{soldPins.length === 1 ? "" : "s"} sold
            </p>
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
                        <div className="font-medium text-neutral-900">{pin.name}</div>
                        {pin.series ? (
                          <div className="text-xs text-neutral-500">{pin.series}</div>
                        ) : null}
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
        </div>
      ) : null}
    </div>
  );
}
