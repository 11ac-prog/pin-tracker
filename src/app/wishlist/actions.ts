"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveImageUrl } from "@/lib/uploads";

function parseOptionalFloat(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function readWishlistFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  return {
    name,
    series: String(formData.get("series") ?? "").trim() || null,
    imageUrl: await resolveImageUrl(formData, "wishlist"),
    estimatedValue: parseOptionalFloat(formData.get("estimatedValue")),
    priority: Number(formData.get("priority") ?? 2),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createWishlistItem(formData: FormData) {
  const data = await readWishlistFields(formData);
  await prisma.wishlistItem.create({ data });
  revalidatePath("/wishlist");
  redirect("/wishlist");
}

export async function updateWishlistItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing wishlist item id");
  const data = await readWishlistFields(formData);
  await prisma.wishlistItem.update({ where: { id }, data });
  revalidatePath("/wishlist");
  redirect("/wishlist");
}

export async function deleteWishlistItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing wishlist item id");
  await prisma.wishlistItem.delete({ where: { id } });
  revalidatePath("/wishlist");
}

export async function moveWishlistItemToCollection(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing wishlist item id");

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item) throw new Error("Wishlist item not found");

  await prisma.$transaction([
    prisma.pin.create({
      data: {
        name: item.name,
        series: item.series,
        imageUrl: item.imageUrl,
        acquisitionDate: new Date(),
        pricePaid: item.estimatedValue,
        currentValue: item.estimatedValue,
        notes: item.notes,
      },
    }),
    prisma.wishlistItem.delete({ where: { id } }),
  ]);

  revalidatePath("/wishlist");
  revalidatePath("/pins");
  revalidatePath("/");
}
