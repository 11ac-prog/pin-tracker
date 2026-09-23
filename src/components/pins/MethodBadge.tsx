import { AcquisitionMethod } from "@/generated/prisma/client";

const methodBadgeClass: Record<AcquisitionMethod, string> = {
  BOUGHT: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  TRADED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  GIFTED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  OTHER: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

export function MethodBadge({ method }: { method: AcquisitionMethod }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${methodBadgeClass[method]}`}
    >
      {method}
    </span>
  );
}
