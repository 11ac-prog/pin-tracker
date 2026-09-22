import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { deletePin } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { primaryButtonClass } from "@/components/form";
import { PinStatus, type Pin } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function gainToneClass(gain: number | null) {
  if (gain === null) return "text-neutral-400";
  if (gain > 0) return "text-green-600";
  if (gain < 0) return "text-red-600";
  return "text-neutral-500";
}

function gainLabel(gain: number | null) {
  return gain === null ? "—" : `${gain > 0 ? "+" : ""}${formatCurrency(gain)}`;
}

function PinActions({ pin }: { pin: Pin }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/trades/new?givenPinId=${pin.id}`}
        className="text-sm font-medium text-sky-700 hover:text-sky-900"
      >
        Trade
      </Link>
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
  );
}

export default async function PinsPage(props: PageProps<"/pins">) {
  const searchParams = await props.searchParams;
  const view = searchParams.view === "cards" ? "cards" : "list";

  const pins = await prisma.pin.findMany({
    where: { status: PinStatus.OWNED },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collection</h1>
          <p className="text-sm text-neutral-500">
            {pins.length} pin{pins.length === 1 ? "" : "s"} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-neutral-300 bg-white p-0.5 text-sm">
            <Link
              href="/pins?view=list"
              className={`rounded px-3 py-1 font-medium ${
                view === "list" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              List
            </Link>
            <Link
              href="/pins?view=cards"
              className={`rounded px-3 py-1 font-medium ${
                view === "cards" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Cards
            </Link>
          </div>
          <Link href="/pins/new" className={primaryButtonClass}>
            + Add pin
          </Link>
        </div>
      </div>

      {pins.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          No pins yet.{" "}
          <Link href="/pins/new" className="font-medium text-neutral-900 underline">
            Add your first pin
          </Link>
          .
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pins.map((pin) => {
            const gain =
              pin.currentValue !== null && pin.pricePaid !== null
                ? pin.currentValue - pin.pricePaid
                : null;
            return (
              <div
                key={pin.id}
                className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white"
              >
                {pin.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pin.imageUrl}
                    alt=""
                    className="aspect-square w-full border-b border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center border-b border-neutral-200 bg-neutral-50 text-5xl">
                    📌
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="font-medium text-neutral-900">{pin.name}</div>
                    {pin.series ? (
                      <div className="text-xs text-neutral-500">{pin.series}</div>
                    ) : null}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <dt className="text-neutral-500">Acquired</dt>
                    <dd className="text-right text-neutral-700">{formatDate(pin.acquisitionDate)}</dd>
                    <dt className="text-neutral-500">Method</dt>
                    <dd className="text-right text-neutral-700">
                      {pin.acquisitionMethod[0] + pin.acquisitionMethod.slice(1).toLowerCase()}
                    </dd>
                    <dt className="text-neutral-500">Paid</dt>
                    <dd className="text-right text-neutral-700">{formatCurrency(pin.pricePaid)}</dd>
                    <dt className="text-neutral-500">Worth</dt>
                    <dd className="text-right text-neutral-700">{formatCurrency(pin.currentValue)}</dd>
                    <dt className="text-neutral-500">Gain / Loss</dt>
                    <dd className={`text-right font-medium ${gainToneClass(gain)}`}>
                      {gainLabel(gain)}
                    </dd>
                  </dl>

                  <div className="mt-auto flex items-center justify-end border-t border-neutral-100 pt-3">
                    <PinActions pin={pin} />
                  </div>
                </div>
              </div>
            );
          })}
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
                    <td className={`px-4 py-3 text-right font-medium ${gainToneClass(gain)}`}>
                      {gainLabel(gain)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <PinActions pin={pin} />
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
  );
}
