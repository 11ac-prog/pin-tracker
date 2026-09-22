import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PinForm } from "@/components/pins/PinForm";
import { updatePin } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPinPage(props: PageProps<"/pins/[id]/edit">) {
  const { id } = await props.params;
  const pin = await prisma.pin.findUnique({ where: { id } });

  if (!pin) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit pin</h1>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <PinForm pin={pin} action={updatePin} />
      </div>
    </div>
  );
}
