"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/components/form";
import { NO_SERIES } from "@/lib/collection-filter";

export function CollectionSearch({
  initialQuery,
  view,
  series,
  seriesOptions,
}: {
  initialQuery: string;
  view: "cards" | "list";
  series: string;
  seriesOptions: { name: string; count: number; total: number }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(next: string, nextSeries: string = series) {
    const params = new URLSearchParams({ view });
    if (next.trim()) params.set("q", next.trim());
    if (nextSeries) params.set("series", nextSeries);
    router.replace(`/pins?${params.toString()}`, { scroll: false });
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(next), 250);
  }

  return (
    <form
      className="flex w-full flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        navigate(value);
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name or series…"
        aria-label="Search collection"
        className={`${inputClass} sm:max-w-sm`}
      />
      <select
        value={series}
        onChange={(event) => navigate(value, event.target.value)}
        aria-label="Filter by collection"
        className={`${inputClass} sm:max-w-xs`}
      >
        <option value="">All collections</option>
        {seriesOptions.map((o) => (
          <option key={o.name} value={o.name}>
            {o.name} ({o.count} different · {o.total} total)
          </option>
        ))}
        <option value={NO_SERIES}>No collection set</option>
      </select>
    </form>
  );
}
