"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/components/form";

export function CollectionSearch({
  initialQuery,
  view,
}: {
  initialQuery: string;
  view: "cards" | "list";
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(next: string) {
    const params = new URLSearchParams({ view });
    if (next.trim()) params.set("q", next.trim());
    router.replace(`/pins?${params.toString()}`, { scroll: false });
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(next), 250);
  }

  return (
    <form
      className="w-full sm:max-w-sm"
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
        className={inputClass}
      />
    </form>
  );
}
