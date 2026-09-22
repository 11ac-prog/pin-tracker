import { PinForm } from "@/components/pins/PinForm";
import { createPin } from "../actions";

export default function NewPinPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add a pin</h1>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <PinForm action={createPin} />
      </div>
    </div>
  );
}
