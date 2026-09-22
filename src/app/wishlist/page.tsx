import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { deleteWishlistItem, moveWishlistItemToCollection } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { primaryButtonClass, secondaryButtonClass } from "@/components/form";

export const dynamic = "force-dynamic";

const priorityLabel: Record<number, string> = {
  1: "High",
  2: "Medium",
  3: "Low",
};

const priorityClass: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-amber-100 text-amber-700",
  3: "bg-neutral-100 text-neutral-600",
};

export default async function WishlistPage() {
  const items = await prisma.wishlistItem.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
          <p className="text-sm text-neutral-500">
            {items.length} item{items.length === 1 ? "" : "s"} you&apos;re after
          </p>
        </div>
        <Link href="/wishlist/new" className={primaryButtonClass}>
          + Add to wishlist
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          Nothing on your wishlist yet.{" "}
          <Link href="/wishlist/new" className="font-medium text-neutral-900 underline">
            Add something you&apos;re hunting for
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-14 rounded-md border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-xl">
                    ⭐
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">{item.name}</div>
                  {item.series ? (
                    <div className="text-xs text-neutral-500">{item.series}</div>
                  ) : null}
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass[item.priority] ?? priorityClass[2]}`}
                  >
                    {priorityLabel[item.priority] ?? "Medium"} priority
                  </span>
                </div>
              </div>

              <div className="text-sm text-neutral-600">
                Est. worth: {formatCurrency(item.estimatedValue)}
              </div>

              {item.notes ? (
                <p className="text-sm text-neutral-500">{item.notes}</p>
              ) : null}

              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex gap-3">
                  <Link href={`/wishlist/${item.id}/edit`}
                    className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                  >
                    Edit
                  </Link>
                  <form action={deleteWishlistItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <DeleteButton confirmText={`Remove "${item.name}" from your wishlist?`} />
                  </form>
                </div>
                <form action={moveWishlistItemToCollection}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className={secondaryButtonClass}>
                    Got it! Add to collection
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
