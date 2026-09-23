import { PinForm } from "@/components/pins/PinForm";
import { cardClass } from "@/components/form";
import { createPin } from "../actions";

export default function NewPinPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Add a pin</h1>
      <div className={`${cardClass} p-6`}>
        <PinForm action={createPin} />
      </div>
    </div>
  );
}
