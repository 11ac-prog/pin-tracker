"use client";

import { useEffect } from "react";

const SCROLL_KEY = "collection-scroll";
export const LAST_URL_KEY = "collection-last-url";
const MAX_AGE_MS = 10 * 60 * 1000;

// Remembers where you were in the collection when you open a pin (or its
// edit/sell/trade pages) and puts you back there when you return. The saved
// position is used once and only if it's recent and for the same view/search.
// `url` is this page's view+search as rendered by the server; using it instead
// of window.location avoids racing with Next updating the address bar.
export function CollectionScroll({ url }: { url: string }) {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let userScrolled = false;
    const stopRestoring = () => {
      userScrolled = true;
    };

    try {
      sessionStorage.setItem(LAST_URL_KEY, url);
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (raw) {
        sessionStorage.removeItem(SCROLL_KEY);
        const saved = JSON.parse(raw) as { y: number; url: string; at: number };
        if (saved.url === url && Date.now() - saved.at < MAX_AGE_MS) {
          // Next.js applies its own scroll-to-top for a navigation at a
          // slightly unpredictable moment, so retry briefly rather than
          // relying on a single call — but give up as soon as the user
          // scrolls so we never fight them.
          for (const event of ["wheel", "touchstart", "keydown"] as const) {
            window.addEventListener(event, stopRestoring, { once: true, passive: true });
          }
          for (const delay of [0, 50, 150, 300, 600, 1000]) {
            timers.push(
              setTimeout(() => {
                if (!userScrolled && Math.abs(window.scrollY - saved.y) > 2) {
                  window.scrollTo(0, saved.y);
                }
              }, delay),
            );
          }
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
            url,
            at: Date.now(),
          }),
        );
      } catch {
        /* ignore */
      }
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      for (const event of ["wheel", "touchstart", "keydown"] as const) {
        window.removeEventListener(event, stopRestoring);
      }
      timers.forEach(clearTimeout);
    };
  }, [url]);

  return null;
}
