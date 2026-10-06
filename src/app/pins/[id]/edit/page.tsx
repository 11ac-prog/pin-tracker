import { notFound } from "next/navigation";
import { cardClass } from "@/components/form";
import { prisma } from "@/lib/prisma";
import { PinForm } from "@/components/pins/PinForm";
import { updatePin } from "../../actions";
import { getSeriesOptions } from "@/lib/series";

export const dynamic = "force-dynamic";

export default async function EditPinPage(props: PageProps<"/pins/[id]/edit">) {
  const { id } = await props.params;
  const [pin, seriesOptions] = await Promise.all([
    prisma.pin.findUnique({ where: { id } }),
    getSeriesOptions(),
  ]);

  if (!pin) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Edit pin</h1>
      <div className={`${cardClass} p-6`}>
        <PinForm pin={pin} action={updatePin} seriesOptions={seriesOptions} />
      </div>
    </div>
  );
}
