import { prisma } from "@/lib/prisma";
import { PinStatus } from "@/generated/prisma/client";
import { BulkSellForm } from "@/components/pins/BulkSellForm";
import { sellPins } from "../actions";

export const dynamic = "force-dynamic";

export default async function SellMultiplePage() {
  const pins = await prisma.pin.findMany({
    where: { status: PinStatus.OWNED },
    orderBy: { name: "asc" },
    select: { id: true, name: true, series: true, imageUrl: true, quantity: true, pricePaid: true },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Sell multiple pins</h1>
        <p className="text-sm text-slate-500">
          Pick everything in the sale, then enter one price, fee and shipping cost for the whole set.
        </p>
      </div>
      <BulkSellForm pins={pins} action={sellPins} />
    </div>
  );
}
