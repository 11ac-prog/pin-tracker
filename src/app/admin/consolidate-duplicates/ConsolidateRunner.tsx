"use client";

import { useState, useTransition } from "react";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import type { DuplicateGroup } from "./actions";

export function ConsolidateRunner({
  initialGroups,
  mergeAction,
}: {
  initialGroups: DuplicateGroup[];
  mergeAction: (pinIds: string[]) => Promise<void>;
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [merging, setMerging] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function mergeOne(group: DuplicateGroup) {
    setMerging(group.key);
    startTransition(async () => {
      await mergeAction(group.pinIds);
      setGroups((prev) => prev.filter((g) => g.key !== group.key));
      setMerging(null);
    });
  }

  function mergeAll() {
    startTransition(async () => {
      for (const group of groups) {
        setMerging(group.key);
        await mergeAction(group.pinIds);
      }
      setMerging(null);
      setGroups([]);
    });
  }

  if (groups.length === 0) {
    return <p className="text-sm text-slate-500">No duplicates found. 🎉</p>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={mergeAll}
        disabled={pending}
        className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Merge all {groups.length} groups
      </button>

      <div className={`${cardClass} divide-y divide-white/5`}>
        {groups.map((group) => (
          <div key={group.key} className="flex items-center gap-3 p-4">
            {group.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.imageUrl} alt="" className="h-12 w-12 rounded border border-white/10 object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded border border-white/10 bg-black/20 text-xl">
                📌
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-100">{group.name}</div>
              <div className="text-xs text-slate-500">
                {group.series ?? "No series"} — {group.pinIds.length} entries, {group.totalQuantity} total
              </div>
            </div>
            <button
              type="button"
              onClick={() => mergeOne(group)}
              disabled={pending}
              className={`${secondaryButtonClass} !text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {merging === group.key ? "Merging…" : "Merge"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
