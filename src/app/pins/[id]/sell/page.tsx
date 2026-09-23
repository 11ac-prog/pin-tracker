import { notFound } from "next/navigation";
import { cardClass } from "@/components/form";
import { prisma } from "@/lib/prisma";
import { SellForm } from "@/components/pins/SellForm";
import { sellPin } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SellPinPage(props: PageProps<"/pins/[id]/sell">) {
  const { id } = await props.params;
  const pin = await prisma.pin.findUnique({ where: { id } });

  if (!pin) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Sell {pin.name}</h1>
        <p className="text-sm text-slate-500">
          This moves the pin out of your active collection and records the sale as profit.
        </p>
      </div>
      <div className={`${cardClass} p-6`}>
        <SellForm pin={pin} action={sellPin} />
      </div>
    </div>
  );
}
