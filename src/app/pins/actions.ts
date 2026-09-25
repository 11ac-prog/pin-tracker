"use server";

import { prisma } from "@/lib/prisma";
import { AcquisitionMethod, PinStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveImageUrl } from "@/lib/uploads";
import { addPurchase, deletePurchase, updatePurchase } from "@/lib/purchases";

function parseOptionalFloat(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  if (!value || value === "") return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePositiveInt(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.round(parsed);
}

// Fields every pin has regardless of its purchase history.
async function readPinFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  return {
    name,
    series: String(formData.get("series") ?? "").trim() || null,
    imageUrl: await resolveImageUrl(formData, "pins"),
    currentValue: parseOptionalFloat(formData.get("currentValue")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createPin(formData: FormData) {
  const data = await readPinFields(formData);
  const acquisitionDate = parseOptionalDate(formData.get("acquisitionDate"));
  const acquisitionMethod =
    (formData.get("acquisitionMethod") as AcquisitionMethod) || AcquisitionMethod.BOUGHT;
  const quantity = parsePositiveInt(formData.get("quantity"), 1);
  const pricePaid = parseOptionalFloat(formData.get("pricePaid"));

  const pin = await prisma.pin.create({
    data: { ...data, acquisitionDate, acquisitionMethod, quantity: 0, pricePaid: null },
  });
  await addPurchase(pin.id, { quantity, pricePaid, acquisitionDate, acquisitionMethod, notes: null });

  revalidatePath("/pins");
  revalidatePath("/");
  redirect("/pins");
}

export async function updatePin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing pin id");
  const data = await readPinFields(formData);
  await prisma.pin.update({ where: { id }, data });
  revalidatePath("/pins");
  revalidatePath("/");
  redirect("/pins");
}

export async function addPurchaseAction(formData: FormData) {
  const pinId = String(formData.get("pinId") ?? "");
  if (!pinId) throw new Error("Missing pin id");

  await addPurchase(pinId, {
    quantity: parsePositiveInt(formData.get("quantity"), 1),
    pricePaid: parseOptionalFloat(formData.get("pricePaid")),
    acquisitionDate: parseOptionalDate(formData.get("acquisitionDate")) ?? new Date(),
    acquisitionMethod: (formData.get("acquisitionMethod") as AcquisitionMethod) || AcquisitionMethod.BOUGHT,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  revalidatePath("/pins");
  revalidatePath("/");
}

export async function updatePurchaseAction(formData: FormData) {
  const purchaseId = String(formData.get("purchaseId") ?? "");
  if (!purchaseId) throw new Error("Missing purchase id");

  await updatePurchase(purchaseId, {
    quantity: parsePositiveInt(formData.get("quantity"), 1),
    pricePaid: parseOptionalFloat(formData.get("pricePaid")),
    acquisitionDate: parseOptionalDate(formData.get("acquisitionDate")),
    acquisitionMethod: (formData.get("acquisitionMethod") as AcquisitionMethod) || AcquisitionMethod.BOUGHT,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  revalidatePath("/pins");
  revalidatePath("/");
}

export async function deletePurchaseAction(formData: FormData) {
  const purchaseId = String(formData.get("purchaseId") ?? "");
  if (!purchaseId) throw new Error("Missing purchase id");
  await deletePurchase(purchaseId);
  revalidatePath("/pins");
  revalidatePath("/");
}

export async function deletePin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing pin id");
  await prisma.pin.delete({ where: { id } });
  revalidatePath("/pins");
  revalidatePath("/");
}

export async function sellPin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing pin id");

  const soldPrice = parseOptionalFloat(formData.get("soldPrice"));
  if (soldPrice === null) throw new Error("Sale price is required");
  const soldDate = parseOptionalDate(formData.get("soldDate")) ?? new Date();
  const shippingCost = parseOptionalFloat(formData.get("shippingCost"));

  const pin = await prisma.pin.findUnique({ where: { id } });
  if (!pin) throw new Error("Pin not found");

  const requestedQuantity = parseOptionalFloat(formData.get("soldQuantity"));
  const soldQuantity = Math.min(
    Math.max(Math.round(requestedQuantity ?? pin.quantity), 1),
    pin.quantity,
  );

  if (soldQuantity >= pin.quantity) {
    // Selling the whole line: this row just becomes the sold record.
    await prisma.pin.update({
      where: { id },
      data: { status: PinStatus.SOLD, soldPrice, soldDate, shippingCost },
    });
  } else {
    // Selling part of a multi-quantity pin: split the sold portion into its
    // own row (so the Sold page's per-row math keeps working unchanged) and
    // shrink what's left of the original. pricePaid/currentValue are per
    // pin, so they carry over unchanged to both rows — only quantity splits.
    const remainingQuantity = pin.quantity - soldQuantity;

    await prisma.$transaction([
      prisma.pin.update({
        where: { id },
        data: { quantity: remainingQuantity },
      }),
      prisma.pin.create({
        data: {
          name: pin.name,
          series: pin.series,
          imageUrl: pin.imageUrl,
          acquisitionDate: pin.acquisitionDate,
          acquisitionMethod: pin.acquisitionMethod,
          quantity: soldQuantity,
          pricePaid: pin.pricePaid,
          currentValue: pin.currentValue,
          notes: pin.notes,
          status: PinStatus.SOLD,
          soldPrice,
          soldDate,
          shippingCost,
        },
      }),
    ]);
  }

  revalidatePath("/pins");
  revalidatePath("/sold");
  revalidatePath("/");
  redirect("/sold");
}

export async function restorePin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing pin id");

  await prisma.pin.update({
    where: { id },
    data: { status: PinStatus.OWNED, soldPrice: null, soldDate: null, shippingCost: null },
  });

  revalidatePath("/pins");
  revalidatePath("/sold");
  revalidatePath("/");
}
