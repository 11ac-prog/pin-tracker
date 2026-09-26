import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteTrade } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { TradeDirection } from "@/generated/prisma/client";
import { EditIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const trades = await prisma.trade.findMany({
    orderBy: { date: "desc" },
    include: { items: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Trades</h1>
          <p className="text-sm text-slate-500">
            {trades.length} trade{trades.length === 1 ? "" : "s"} logged
          </p>
        </div>
        <Link href="/trades/new" className={primaryButtonClass}>
          + Log a trade
        </Link>
      </div>

      {trades.length === 0 ? (
        <div className={`${cardClass} border-dashed p-10 text-center text-slate-500`}>
          No trades logged yet.{" "}
          <Link href="/trades/new" className="font-semibold text-emerald-300 underline underline-offset-4">
            Log your first trade
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => {
            const given = trade.items.filter((i) => i.direction === TradeDirection.GIVEN);
            const received = trade.items.filter((i) => i.direction === TradeDirection.RECEIVED);
            const givenValue = given.reduce((sum, i) => sum + (i.estimatedValue ?? 0), 0);
            const receivedValue = received.reduce((sum, i) => sum + (i.estimatedValue ?? 0), 0);
            const net = receivedValue - givenValue - (trade.shippingCost ?? 0);

            return (
              <div key={trade.id} className={`${cardClass} p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-100">
                      {formatDate(trade.date)}
                      {trade.partnerName ? ` — with ${trade.partnerName}` : ""}
                    </div>
                    {trade.notes ? (
                      <p className="mt-1 text-sm text-slate-500">{trade.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/trades/${trade.id}/edit`} className={secondaryButtonClass}>
                      <EditIcon className="h-4 w-4" /> Edit
                    </Link>
                    <form action={deleteTrade}>
                      <input type="hidden" name="id" value={trade.id} />
                      <DeleteButton confirmText="Delete this trade record?" />
                    </form>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      You gave
                    </div>
                    <ul className="mt-1 space-y-1 text-sm text-slate-300">
                      {given.map((i) => (
                        <li key={i.id} className="flex justify-between">
                          <span>
                            {i.description}
                            {i.quantity > 1 ? ` ×${i.quantity}` : ""}
                          </span>
                          <span className="text-slate-500">{formatCurrency(i.estimatedValue)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      You received
                    </div>
                    <ul className="mt-1 space-y-1 text-sm text-slate-300">
                      {received.map((i) => (
                        <li key={i.id} className="flex justify-between">
                          <span>
                            {i.description}
                            {i.quantity > 1 ? ` ×${i.quantity}` : ""}
                          </span>
                          <span className="text-slate-500">{formatCurrency(i.estimatedValue)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 pt-3">
                  {trade.shippingCost ? (
                    <div className="text-sm text-slate-500">
                      Shipping: {formatCurrency(trade.shippingCost)}
                    </div>
                  ) : null}
                  <div
                    className={`text-sm font-bold ${
                      net > 0 ? "text-emerald-400" : net < 0 ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    Net value: {net > 0 ? "+" : ""}
                    {formatCurrency(net)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
