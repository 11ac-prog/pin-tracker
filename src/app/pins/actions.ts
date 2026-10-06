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
  const soldFee = parseOptionalFloat(formData.get("soldFee"));

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
      data: { status: PinStatus.SOLD, soldPrice, soldDate, shippingCost, soldFee },
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
          soldFee,
        },
      }),
    ]);
  }

  revalidatePath("/pins");
  revalidatePath("/sold");
  revalidatePath("/");
  redirect("/sold");
}

// Splits a total across lines in proportion to `weights`, to the cent, with
// any rounding leftover landing on the last line so the parts add back up.
function allocate(total: number | null, weights: number[]): (number | null)[] {
  if (total === null) return weights.map(() => null);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const totalCents = Math.round(total * 100);
  let allocated = 0;
  return weights.map((w, i) => {
    const cents =
      i === weights.length - 1
        ? totalCents - allocated
        : Math.round((totalCents * (weightSum > 0 ? w / weightSum : 1 / weights.length)));
    allocated += cents;
    return cents / 100;
  });
}

// Sells several pins as one sale: one price, one fee, one shipping cost for
// the whole set. Each pin's row records its share (proportional to what you
// paid for the units sold, or an even split per unit if any has no cost), so
// the Sold page's per-row math keeps working and the shares sum to exactly
// what you entered.
export async function sellPins(formData: FormData) {
  const soldPrice = parseOptionalFloat(formData.get("soldPrice"));
  if (soldPrice === null) throw new Error("Sale price is required");
  const soldDate = parseOptionalDate(formData.get("soldDate")) ?? new Date();
  const shippingCost = parseOptionalFloat(formData.get("shippingCost"));
  const soldFee = parseOptionalFloat(formData.get("soldFee"));

  const ids = formData.getAll("pinId").map(String);
  const requested = formData.getAll("qty").map((q) => Number(q));
  const wanted = new Map<string, number>();
  ids.forEach((id, i) => {
    if (id && !wanted.has(id)) wanted.set(id, requested[i]);
  });
  if (wanted.size === 0) throw new Error("Pick at least one pin to sell");

  const pins = await prisma.pin.findMany({
    where: { id: { in: Array.from(wanted.keys()) }, status: PinStatus.OWNED },
  });
  if (pins.length === 0) throw new Error("None of those pins are available to sell");

  const lines = pins.map((pin) => {
    const asked = wanted.get(pin.id) ?? pin.quantity;
    const soldQuantity = Math.min(Math.max(Math.round(Number.isFinite(asked) ? asked : pin.quantity), 1), pin.quantity);
    return { pin, soldQuantity };
  });

  const allCosted = lines.every(({ pin }) => (pin.pricePaid ?? 0) > 0);
  const weights = lines.map(({ pin, soldQuantity }) =>
    allCosted ? (pin.pricePaid ?? 0) * soldQuantity : soldQuantity,
  );
  const prices = allocate(soldPrice, weights);
  const fees = allocate(soldFee, weights);
  const shippings = allocate(shippingCost, weights);

  const operations = lines.flatMap(({ pin, soldQuantity }, i) => {
    const sale = { soldPrice: prices[i], soldDate, shippingCost: shippings[i], soldFee: fees[i] };
    if (soldQuantity >= pin.quantity) {
      return [prisma.pin.update({ where: { id: pin.id }, data: { status: PinStatus.SOLD, ...sale } })];
    }
    return [
      prisma.pin.update({ where: { id: pin.id }, data: { quantity: pin.quantity - soldQuantity } }),
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
          ...sale,
        },
      }),
    ];
  });
  await prisma.$transaction(operations);

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
    data: { status: PinStatus.OWNED, soldPrice: null, soldDate: null, shippingCost: null, soldFee: null },
  });

  revalidatePath("/pins");
  revalidatePath("/sold");
  revalidatePath("/");
}
