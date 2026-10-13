"use server";

import { prisma } from "@/lib/prisma";
import { AcquisitionMethod } from "@/generated/prisma/client";
import { addPurchase } from "@/lib/purchases";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_PINS = 200;

// Pasted lists usually arrive as bullets ("* Dale", "- Pluto", "• Goofy") —
// keep just the name.
function cleanName(line: string): string {
  return line.replace(/^[\s*•\-–]+/, "").trim();
}

// Adds many pins at once that share a series, price, date and method (e.g. a
// whole box or calendar bought together). Each becomes its own pin with a
// single purchase, exactly as if added one at a time.
export async function bulkAddPins(formData: FormData) {
  const names = String(formData.get("names") ?? "")
    .split(/\r?\n/)
    .map(cleanName)
    .filter(Boolean);
  if (names.length === 0) throw new Error("Paste at least one pin name");
  if (names.length > MAX_PINS) throw new Error(`Too many pins at once (max ${MAX_PINS})`);

  const series = String(formData.get("series") ?? "").trim() || null;
  const priceRaw = String(formData.get("pricePaid") ?? "").trim();
  const pricePaid = priceRaw === "" || Number.isNaN(Number(priceRaw)) ? null : Number(priceRaw);
  const dateRaw = String(formData.get("acquisitionDate") ?? "").trim();
  const parsedDate = dateRaw ? new Date(dateRaw) : new Date();
  const acquisitionDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const acquisitionMethod =
    (formData.get("acquisitionMethod") as AcquisitionMethod) || AcquisitionMethod.BOUGHT;

  for (const name of names) {
    const pin = await prisma.pin.create({
      data: { name, series, acquisitionDate, acquisitionMethod, quantity: 0, pricePaid: null },
    });
    await addPurchase(pin.id, {
      quantity: 1,
      pricePaid,
      acquisitionDate,
      acquisitionMethod,
      notes: null,
    });
  }

  revalidatePath("/pins");
  revalidatePath("/");
  redirect("/pins");
}
