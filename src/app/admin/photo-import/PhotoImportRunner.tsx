"use client";

import { useState } from "react";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { applyResolvedMatches, listPinsNeedingPhotos, type ApplyOutcome } from "./actions";

type Pending = Awaited<ReturnType<typeof listPinsNeedingPhotos>>[number];

export function PhotoImportRunner({ initialPending }: { initialPending: Pending[] }) {
  const [pending, setPending] = useState<Pending[]>(initialPending);
  const [pasted, setPasted] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [results, setResults] = useState<ApplyOutcome[]>([]);
  const [manualUrl, setManualUrl] = useState<Record<string, string>>({});

  async function refresh() {
    setPending(await listPinsNeedingPhotos());
  }

  async function applyBatch(resolved: { pinId: string; imageUrl: string; newName?: string; label?: string }[]) {
    setApplying(true);
    try {
      const outcomes = await applyResolvedMatches(resolved);
      setResults((prev) => [...prev, ...outcomes]);
      await refresh();
    } finally {
      setApplying(false);
    }
  }

  function submitPasted() {
    setParseError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(pasted);
    } catch {
      setParseError("That's not valid JSON.");
      return;
    }
    if (!Array.isArray(parsed)) {
      setParseError("Expected a JSON array.");
      return;
    }

    const byName = new Map(pending.map((p) => [p.name.trim().toLowerCase(), p.id]));
    const resolved: { pinId: string; imageUrl: string; newName?: string; label?: string }[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const e = entry as Record<string, unknown>;
      const imageUrl = typeof e.imageUrl === "string" ? e.imageUrl : null;
      if (!imageUrl) continue;
      const pinId =
        typeof e.pinId === "string"
          ? e.pinId
          : typeof e.name === "string"
            ? byName.get(e.name.trim().toLowerCase())
            : undefined;
      if (!pinId) continue;
      resolved.push({
        pinId,
        imageUrl,
        newName: typeof e.newName === "string" ? e.newName : undefined,
        label: typeof e.label === "string" ? e.label : undefined,
      });
    }

    if (resolved.length === 0) {
      setParseError("Couldn't match any entries to a pin that's missing a photo.");
      return;
    }
    setPasted("");
    applyBatch(resolved);
  }

  function saveManualUrl(pinId: string) {
    const url = manualUrl[pinId]?.trim();
    if (!url) return;
    applyBatch([{ pinId, imageUrl: url }]);
    setManualUrl((prev) => ({ ...prev, [pinId]: "" }));
  }

  return (
    <div className="space-y-6">
      <div className={`${cardClass} p-4`}>
        <p className="text-sm text-slate-400">
          Pin &amp; Pop sits behind bot-detection that blocks server-side requests, so this can&apos;t
          search and match pins on its own in the background. What it <em>can</em> do automatically:
          take a photo URL — one you found yourself, or one Claude looked up for you in a chat — and
          download + re-host it here, for one pin or a whole batch at once.
        </p>
      </div>

      <div className={`${cardClass} space-y-3 p-4`}>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Paste resolved matches (JSON array of {"{"}name or pinId, imageUrl, newName?{"}"})
        </label>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={6}
          placeholder='[{"name": "The Kingdom Key Keyblade", "imageUrl": "https://...", "newName": "Official Pin & Pop Name"}]'
          className={`${inputClass} font-mono text-xs`}
        />
        {parseError ? <p className="text-xs text-rose-400">{parseError}</p> : null}
        <button
          type="button"
          onClick={submitPasted}
          disabled={applying || !pasted.trim()}
          className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {applying ? "Applying…" : "Apply batch"}
        </button>
      </div>

      {results.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-300">
            Applied ({results.filter((r) => r.status === "applied").length}/{results.length})
          </h2>
          <div className={`${cardClass} divide-y divide-white/5`}>
            {results.map((r, i) => (
              <div key={`${r.pinId}-${i}`} className="flex items-center gap-3 p-3 text-sm">
                {r.status === "applied" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt="" className="h-10 w-10 rounded border border-white/10 object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded border border-rose-400/30 text-rose-400">
                    !
                  </div>
                )}
                <div className="text-slate-200">
                  {r.label ?? r.pinId} —{" "}
                  <span className={r.status === "applied" ? "text-emerald-400" : "text-rose-400"}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-300">
          Still missing a photo ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">Every pin has a photo. 🎉</p>
        ) : (
          <div className={`${cardClass} divide-y divide-white/5`}>
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <div className="min-w-[10rem] flex-1">
                  <div className="font-semibold text-slate-100">{p.name}</div>
                  {p.series ? <div className="text-xs text-slate-500">{p.series}</div> : null}
                </div>
                <input
                  className={`${inputClass} max-w-xs`}
                  placeholder="Paste image URL"
                  value={manualUrl[p.id] ?? ""}
                  onChange={(e) => setManualUrl((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => saveManualUrl(p.id)}
                  disabled={applying}
                  className={secondaryButtonClass}
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
