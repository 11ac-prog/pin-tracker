import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { deletePin } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { cardClass, primaryButtonClass } from "@/components/form";
import { AcquisitionMethod, PinStatus, type Pin } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function gainToneClass(gain: number | null) {
  if (gain === null) return "text-slate-600";
  if (gain > 0) return "text-emerald-400";
  if (gain < 0) return "text-rose-400";
  return "text-slate-400";
}

function gainLabel(gain: number | null) {
  return gain === null ? "—" : `${gain > 0 ? "+" : ""}${formatCurrency(gain)}`;
}

const methodBadgeClass: Record<AcquisitionMethod, string> = {
  BOUGHT: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  TRADED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  GIFTED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  OTHER: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

function MethodBadge({ method }: { method: AcquisitionMethod }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${methodBadgeClass[method]}`}
    >
      {method}
    </span>
  );
}

const actionLinkClass =
  "rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition hover:border-white/20";

function PinActions({ pin }: { pin: Pin }) {
  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={`/trades/new?givenPinId=${pin.id}`}
        className={`${actionLinkClass} text-cyan-300 hover:bg-cyan-400/10`}
      >
        Trade
      </Link>
      <Link
        href={`/pins/${pin.id}/sell`}
        className={`${actionLinkClass} text-emerald-300 hover:bg-emerald-400/10`}
      >
        Sell
      </Link>
      <Link
        href={`/pins/${pin.id}/edit`}
        className={`${actionLinkClass} text-slate-300 hover:bg-white/10`}
      >
        Edit
      </Link>
      <form action={deletePin}>
        <input type="hidden" name="id" value={pin.id} />
        <DeleteButton confirmText={`Delete "${pin.name}" from your collection?`} className={actionLinkClass} />
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Collection</h1>
          <p className="text-sm text-slate-500">
            {pins.length} pin{pins.length === 1 ? "" : "s"} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-white/10 bg-white/5 p-0.5 text-xs">
            <Link
              href="/pins?view=list"
              className={`rounded px-3 py-1 font-bold uppercase tracking-wider ${
                view === "list"
                  ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-neutral-950"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              List
            </Link>
            <Link
              href="/pins?view=cards"
              className={`rounded px-3 py-1 font-bold uppercase tracking-wider ${
                view === "cards"
                  ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-neutral-950"
                  : "text-slate-400 hover:text-slate-100"
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
        <div className={`${cardClass} border-dashed p-10 text-center text-slate-500`}>
          No pins yet.{" "}
          <Link href="/pins/new" className="font-semibold text-emerald-300 underline underline-offset-4">
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
              <div key={pin.id} className={`${cardClass} flex flex-col overflow-hidden`}>
                {pin.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pin.imageUrl}
                    alt=""
                    className="aspect-square w-full border-b border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center border-b border-white/10 bg-black/20 text-5xl">
                    📌
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="font-semibold text-slate-100">{pin.name}</div>
                    {pin.series ? (
                      <div className="text-xs text-slate-500">{pin.series}</div>
                    ) : null}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                    <dt className="text-slate-500">Acquired</dt>
                    <dd className="text-right text-slate-300">{formatDate(pin.acquisitionDate)}</dd>
                    <dt className="text-slate-500">Method</dt>
                    <dd className="text-right">
                      <MethodBadge method={pin.acquisitionMethod} />
                    </dd>
                    <dt className="text-slate-500">Paid</dt>
                    <dd className="text-right text-slate-300">{formatCurrency(pin.pricePaid)}</dd>
                    <dt className="text-slate-500">Worth</dt>
                    <dd className="text-right text-slate-300">{formatCurrency(pin.currentValue)}</dd>
                    <dt className="text-slate-500">Gain / Loss</dt>
                    <dd className={`text-right font-bold ${gainToneClass(gain)}`}>
                      {gainLabel(gain)}
                    </dd>
                  </dl>

                  <div className="mt-auto flex items-center justify-end border-t border-white/5 pt-3">
                    <PinActions pin={pin} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/[0.03] text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
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
            <tbody className="divide-y divide-white/5">
              {pins.map((pin) => {
                const gain =
                  pin.currentValue !== null && pin.pricePaid !== null
                    ? pin.currentValue - pin.pricePaid
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
                          <div className="font-semibold text-slate-100">{pin.name}</div>
                          {pin.series ? (
                            <div className="text-xs text-slate-500">{pin.series}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDate(pin.acquisitionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <MethodBadge method={pin.acquisitionMethod} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {formatCurrency(pin.pricePaid)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {formatCurrency(pin.currentValue)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${gainToneClass(gain)}`}>
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
