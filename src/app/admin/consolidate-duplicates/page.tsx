import { backfillMissingPurchases, findDuplicateGroups, mergeDuplicateGroup } from "./actions";
import { ConsolidateRunner } from "./ConsolidateRunner";
import { secondaryButtonClass } from "@/components/form";

export const dynamic = "force-dynamic";

export default async function ConsolidateDuplicatesPage() {
  const groups = await findDuplicateGroups();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Consolidate duplicates</h1>
        <p className="text-sm text-slate-500">
          Finds pins that share the same name and series but ended up as separate cards (usually
          because they were bought at different prices) and merges them into one card with a
          combined quantity and a weighted-average price — each original purchase is kept on the
          pin&apos;s detail page.
        </p>
      </div>

      <ConsolidateRunner initialGroups={groups} mergeAction={mergeDuplicateGroup} />

      <div className="space-y-2 border-t border-white/10 pt-6">
        <p className="text-xs text-slate-500">
          One-time maintenance: backfills a purchase record for pins that predate the purchase
          feature, so their history isn&apos;t empty. Run this once, after merging duplicates above.
        </p>
        <form action={backfillMissingPurchases}>
          <button type="submit" className={secondaryButtonClass}>
            Backfill missing purchase history
          </button>
        </form>
      </div>
    </div>
  );
}
