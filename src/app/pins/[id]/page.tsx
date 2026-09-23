import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, gainLabel, gainToneClass } from "@/lib/format";
import { cardClass, secondaryButtonClass } from "@/components/form";
import { PinStatus, TradeDirection } from "@/generated/prisma/client";
import { DeleteIcon, EditIcon, SellIcon, TradeIcon } from "@/components/icons";
import { MethodBadge } from "@/components/pins/MethodBadge";
import { DeleteButton } from "@/components/DeleteButton";
import { deletePin } from "../actions";

export const dynamic = "force-dynamic";

export default async function PinDetailPage(props: PageProps<"/pins/[id]">) {
  const { id } = await props.params;
  const pin = await prisma.pin.findUnique({ where: { id } });

  if (!pin) notFound();

  const receivedItem = await prisma.tradeItem.findFirst({
    where: { pinId: pin.id, direction: TradeDirection.RECEIVED },
    include: { trade: { include: { items: true } } },
  });

  const givenAwayItems = receivedItem?.trade.items.filter(
    (item) => item.direction === TradeDirection.GIVEN,
  );

  const gain =
    pin.currentValue !== null && pin.pricePaid !== null ? pin.currentValue - pin.pricePaid : null;
  const profit =
    pin.status === PinStatus.SOLD && pin.soldPrice !== null
      ? pin.soldPrice - (pin.pricePaid ?? 0) - (pin.shippingCost ?? 0)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/pins" className={secondaryButtonClass}>
          ← Back to collection
        </Link>
        {pin.status === PinStatus.OWNED ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/trades/new?givenPinId=${pin.id}`}
              className={`${secondaryButtonClass} !text-cyan-300`}
            >
              <TradeIcon className="h-4 w-4" /> Trade
            </Link>
            <Link
              href={`/pins/${pin.id}/sell`}
              className={`${secondaryButtonClass} !text-emerald-300`}
            >
              <SellIcon className="h-4 w-4" /> Sell
            </Link>
            <Link href={`/pins/${pin.id}/edit`} className={secondaryButtonClass}>
              <EditIcon className="h-4 w-4" /> Edit
            </Link>
            <form action={deletePin}>
              <input type="hidden" name="id" value={pin.id} />
              <DeleteButton
                confirmText={`Delete "${pin.name}" from your collection?`}
                className={`${secondaryButtonClass} !text-rose-400`}
                label={
                  <>
                    <DeleteIcon className="h-4 w-4" /> Delete
                  </>
                }
              />
            </form>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className={`${cardClass} overflow-hidden`}>
          {pin.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pin.imageUrl}
              alt=""
              className="aspect-[4/3] w-full border-b border-white/10 object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center border-b border-white/10 bg-black/20 text-7xl">
              📌
            </div>
          )}

          <div className="space-y-5 p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-100">{pin.name}</h1>
                {pin.quantity > 1 ? (
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-300">
                    ×{pin.quantity}
                  </span>
                ) : null}
                <MethodBadge method={pin.acquisitionMethod} />
                {pin.status === PinStatus.SOLD ? (
                  <span className="inline-flex items-center rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Sold
                  </span>
                ) : null}
              </div>
              {pin.series ? <p className="mt-1 text-sm text-slate-500">{pin.series}</p> : null}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/5 pt-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Acquired
                </dt>
                <dd className="mt-1 text-slate-200">{formatDate(pin.acquisitionDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quantity
                </dt>
                <dd className="mt-1 text-slate-200">{pin.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Paid{pin.quantity > 1 ? " (total)" : ""}
                </dt>
                <dd className="mt-1 text-slate-200">{formatCurrency(pin.pricePaid)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {pin.status === PinStatus.SOLD ? "Sold for" : "Current worth"}
                  {pin.quantity > 1 ? " (total)" : ""}
                </dt>
                <dd className="mt-1 text-slate-200">
                  {formatCurrency(pin.status === PinStatus.SOLD ? pin.soldPrice : pin.currentValue)}
                </dd>
              </div>
              {pin.status === PinStatus.SOLD ? (
                <>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Sold on
                    </dt>
                    <dd className="mt-1 text-slate-200">{formatDate(pin.soldDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Shipping
                    </dt>
                    <dd className="mt-1 text-slate-200">{formatCurrency(pin.shippingCost)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Profit
                    </dt>
                    <dd
                      className={`mt-1 font-bold ${
                        profit === null
                          ? "text-slate-400"
                          : profit > 0
                            ? "text-emerald-400"
                            : profit < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                      }`}
                    >
                      {profit === null ? "—" : `${profit > 0 ? "+" : ""}${formatCurrency(profit)}`}
                    </dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Gain / Loss
                  </dt>
                  <dd className={`mt-1 font-bold ${gainToneClass(gain)}`}>{gainLabel(gain)}</dd>
                </div>
              )}
            </dl>

            {pin.notes ? (
              <div className="border-t border-white/5 pt-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Notes
                </dt>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{pin.notes}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Trade History
          </h2>

          {!receivedItem ? (
            <p className="mt-3 text-sm text-slate-500">
              This pin wasn&apos;t acquired through a trade.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="text-sm text-slate-400">
                {formatDate(receivedItem.trade.date)}
                {receivedItem.trade.partnerName ? ` — with ${receivedItem.trade.partnerName}` : ""}
                {receivedItem.quantity > 1 ? ` (received ×${receivedItem.quantity})` : ""}
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Traded away for this pin
                </div>
                <ul className="mt-2 space-y-2">
                  {givenAwayItems?.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-md border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/20 text-xl">
                          📌
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-200">
                          {item.description}
                          {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatCurrency(item.estimatedValue)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {receivedItem.trade.shippingCost ? (
                <div className="border-t border-white/5 pt-3 text-sm text-slate-400">
                  Shipping: {formatCurrency(receivedItem.trade.shippingCost)}
                </div>
              ) : null}

              <Link
                href="/trades"
                className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-emerald-300"
              >
                View all trades →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
