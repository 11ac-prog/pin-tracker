"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LAST_URL_KEY } from "./CollectionScroll";

// Goes back to the collection exactly as you left it (same view and search),
// rather than always to the unfiltered top of the list.
export function BackToCollection({ className }: { className: string }) {
  const router = useRouter();

  return (
    <Link
      href="/pins"
      className={className}
      onClick={(event) => {
        try {
          const last = sessionStorage.getItem(LAST_URL_KEY);
          if (last) {
            event.preventDefault();
            router.push(last);
          }
        } catch {
          /* fall through to the plain /pins link */
        }
      }}
    >
      ← Back to collection
    </Link>
  );
}
