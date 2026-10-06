"use client";

import { useEffect } from "react";

const SCROLL_KEY = "collection-scroll";
export const LAST_URL_KEY = "collection-last-url";
const MAX_AGE_MS = 10 * 60 * 1000;

// Remembers where you were in the collection when you open a pin (or its
// edit/sell/trade pages) and puts you back there when you return. The saved
// position is used once and only if it's recent and for the same view/search.
export function CollectionScroll() {
  useEffect(() => {
    const url = window.location.pathname + window.location.search;
    try {
      sessionStorage.setItem(LAST_URL_KEY, url);
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (raw) {
        sessionStorage.removeItem(SCROLL_KEY);
        const saved = JSON.parse(raw) as { y: number; url: string; at: number };
        if (saved.url === url && Date.now() - saved.at < MAX_AGE_MS) {
          requestAnimationFrame(() => window.scrollTo(0, saved.y));
        }
      }
    } catch {
      /* sessionStorage unavailable (private mode etc.): just skip restoring */
    }

    function onClick(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest("a");
      const href = link?.getAttribute("href");
      if (!href || !/^\/(pins|trades)\/(?!new)/.test(href)) return;
      try {
        sessionStorage.setItem(
          SCROLL_KEY,
          JSON.stringify({
            y: window.scrollY,
            url: window.location.pathname + window.location.search,
            at: Date.now(),
          }),
        );
      } catch {
        /* ignore */
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
