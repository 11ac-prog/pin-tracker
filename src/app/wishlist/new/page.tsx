import { WishlistForm } from "@/components/wishlist/WishlistForm";
import { cardClass } from "@/components/form";
import { createWishlistItem } from "../actions";
import { getSeriesOptions } from "@/lib/series";

export const dynamic = "force-dynamic";

export default async function NewWishlistItemPage() {
  const seriesOptions = await getSeriesOptions();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Add to ISO</h1>
      <div className={`${cardClass} p-6`}>
        <WishlistForm action={createWishlistItem} seriesOptions={seriesOptions} />
      </div>
    </div>
  );
}
