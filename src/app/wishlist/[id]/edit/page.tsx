import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WishlistForm } from "@/components/wishlist/WishlistForm";
import { updateWishlistItem } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditWishlistItemPage(props: PageProps<"/wishlist/[id]/edit">) {
  const { id } = await props.params;
  const item = await prisma.wishlistItem.findUnique({ where: { id } });

  if (!item) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit wishlist item</h1>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <WishlistForm item={item} action={updateWishlistItem} />
      </div>
    </div>
  );
}
