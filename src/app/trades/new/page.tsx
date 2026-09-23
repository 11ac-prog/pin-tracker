import { prisma } from "@/lib/prisma";
import { cardClass } from "@/components/form";
import { TradeForm } from "@/components/trades/TradeForm";
import { createTrade } from "../actions";
import { PinStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function NewTradePage(props: PageProps<"/trades/new">) {
  const searchParams = await props.searchParams;
  const givenPinId = typeof searchParams.givenPinId === "string" ? searchParams.givenPinId : undefined;

  const pins = await prisma.pin.findMany({
    where: { status: PinStatus.OWNED },
    orderBy: { name: "asc" },
    select: { id: true, name: true, pricePaid: true },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Log a trade</h1>
      <div className={`${cardClass} p-6`}>
        <TradeForm action={createTrade} ownedPins={pins} initialGivenPinId={givenPinId} />
      </div>
    </div>
  );
}
