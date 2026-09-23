import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { deleteWishlistItem, moveWishlistItemToCollection } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";

export const dynamic = "force-dynamic";

const priorityLabel: Record<number, string> = {
  1: "High",
  2: "Medium",
  3: "Low",
};

const priorityClass: Record<number, string> = {
  1: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  2: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  3: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

export default async function WishlistPage() {
  const items = await prisma.wishlistItem.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Wishlist</h1>
          <p className="text-sm text-slate-500">
            {items.length} item{items.length === 1 ? "" : "s"} you&apos;re after
          </p>
        </div>
        <Link href="/wishlist/new" className={primaryButtonClass}>
          + Add to wishlist
        </Link>
      </div>

      {items.length === 0 ? (
        <div className={`${cardClass} border-dashed p-10 text-center text-slate-500`}>
          Nothing on your wishlist yet.{" "}
          <Link href="/wishlist/new" className="font-semibold text-emerald-300 underline underline-offset-4">
            Add something you&apos;re hunting for
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className={`${cardClass} flex flex-col gap-3 p-4`}>
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-14 rounded-md border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-md border border-white/10 bg-black/20 text-xl">
                    ⭐
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-slate-100">{item.name}</div>
                  {item.series ? (
                    <div className="text-xs text-slate-500">{item.series}</div>
                  ) : null}
                  <span
                    className={`mt-1 inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityClass[item.priority] ?? priorityClass[2]}`}
                  >
                    {priorityLabel[item.priority] ?? "Medium"} priority
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-400">
                Est. worth: {formatCurrency(item.estimatedValue)}
              </div>

              {item.notes ? (
                <p className="text-sm text-slate-500">{item.notes}</p>
              ) : null}

              <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex gap-3">
                  <Link
                    href={`/wishlist/${item.id}/edit`}
                    className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-100"
                  >
                    Edit
                  </Link>
                  <form action={deleteWishlistItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <DeleteButton
                      confirmText={`Remove "${item.name}" from your wishlist?`}
                      className="text-xs font-semibold uppercase tracking-wider"
                    />
                  </form>
                </div>
                <form action={moveWishlistItemToCollection}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className={secondaryButtonClass}>
                    Got it!
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
