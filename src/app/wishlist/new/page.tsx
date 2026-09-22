import { WishlistForm } from "@/components/wishlist/WishlistForm";
import { createWishlistItem } from "../actions";

export default function NewWishlistItemPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add to wishlist</h1>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <WishlistForm action={createWishlistItem} />
      </div>
    </div>
  );
}
