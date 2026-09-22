import { prisma } from "@/lib/prisma";
import { TradeForm } from "@/components/trades/TradeForm";
import { createTrade } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewTradePage() {
  const pins = await prisma.pin.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Log a trade</h1>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <TradeForm action={createTrade} ownedPins={pins} />
      </div>
    </div>
  );
}
