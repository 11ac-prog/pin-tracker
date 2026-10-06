import { notFound } from "next/navigation";
import { cardClass } from "@/components/form";
import { prisma } from "@/lib/prisma";
import { WishlistForm } from "@/components/wishlist/WishlistForm";
import { updateWishlistItem } from "../../actions";
import { getSeriesOptions } from "@/lib/series";

export const dynamic = "force-dynamic";

export default async function EditWishlistItemPage(props: PageProps<"/wishlist/[id]/edit">) {
  const { id } = await props.params;
  const [item, seriesOptions] = await Promise.all([
    prisma.wishlistItem.findUnique({ where: { id } }),
    getSeriesOptions(),
  ]);

  if (!item) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Edit ISO item</h1>
      <div className={`${cardClass} p-6`}>
        <WishlistForm item={item} action={updateWishlistItem} seriesOptions={seriesOptions} />
      </div>
    </div>
  );
}
