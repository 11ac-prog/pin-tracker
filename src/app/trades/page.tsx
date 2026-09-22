import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteTrade } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { primaryButtonClass } from "@/components/form";
import { TradeDirection } from "@/generated/prisma/client";

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
          <h1 className="text-2xl font-semibold tracking-tight">Trades</h1>
          <p className="text-sm text-neutral-500">
            {trades.length} trade{trades.length === 1 ? "" : "s"} logged
          </p>
        </div>
        <Link href="/trades/new" className={primaryButtonClass}>
          + Log a trade
        </Link>
      </div>

      {trades.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          No trades logged yet.{" "}
          <Link href="/trades/new" className="font-medium text-neutral-900 underline">
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
            const net = receivedValue - givenValue;

            return (
              <div key={trade.id} className="rounded-lg border border-neutral-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-neutral-900">
                      {formatDate(trade.date)}
                      {trade.partnerName ? ` — with ${trade.partnerName}` : ""}
                    </div>
                    {trade.notes ? (
                      <p className="mt-1 text-sm text-neutral-500">{trade.notes}</p>
                    ) : null}
                  </div>
                  <form action={deleteTrade}>
                    <input type="hidden" name="id" value={trade.id} />
                    <DeleteButton confirmText="Delete this trade record?" />
                  </form>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      You gave
                    </div>
                    <ul className="mt-1 space-y-1 text-sm text-neutral-700">
                      {given.map((i) => (
                        <li key={i.id} className="flex justify-between">
                          <span>{i.description}</span>
                          <span className="text-neutral-500">{formatCurrency(i.estimatedValue)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      You received
                    </div>
                    <ul className="mt-1 space-y-1 text-sm text-neutral-700">
                      {received.map((i) => (
                        <li key={i.id} className="flex justify-between">
                          <span>{i.description}</span>
                          <span className="text-neutral-500">{formatCurrency(i.estimatedValue)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  className={`mt-4 text-sm font-medium ${
                    net > 0 ? "text-green-600" : net < 0 ? "text-red-600" : "text-neutral-500"
                  }`}
                >
                  Net value: {net > 0 ? "+" : ""}
                  {formatCurrency(net)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
