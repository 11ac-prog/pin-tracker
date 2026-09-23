import { WishlistForm } from "@/components/wishlist/WishlistForm";
import { cardClass } from "@/components/form";
import { createWishlistItem } from "../actions";

export default function NewWishlistItemPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Add to wishlist</h1>
      <div className={`${cardClass} p-6`}>
        <WishlistForm action={createWishlistItem} />
      </div>
    </div>
  );
}
