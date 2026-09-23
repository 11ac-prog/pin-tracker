"use server";

import { prisma } from "@/lib/prisma";
import { AcquisitionMethod, PinStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveImageUrl } from "@/lib/uploads";

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

async function readPinFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  return {
    name,
    series: String(formData.get("series") ?? "").trim() || null,
    imageUrl: await resolveImageUrl(formData, "pins"),
    acquisitionDate: parseOptionalDate(formData.get("acquisitionDate")),
    acquisitionMethod: (formData.get("acquisitionMethod") as AcquisitionMethod) || AcquisitionMethod.BOUGHT,
    pricePaid: parseOptionalFloat(formData.get("pricePaid")),
    currentValue: parseOptionalFloat(formData.get("currentValue")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createPin(formData: FormData) {
  const data = await readPinFields(formData);
  await prisma.pin.create({ data });
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

  await prisma.pin.update({
    where: { id },
    data: { status: PinStatus.SOLD, soldPrice, soldDate, shippingCost },
  });

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
