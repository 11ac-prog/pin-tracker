"use server";

import { prisma } from "@/lib/prisma";
import { PinStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

// Splits a total (in cents) across weights, to the cent, largest remainder first.
function allocate(totalCents: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (sum > 0 ? (totalCents * w) / sum : totalCents / weights.length));
  const floors = raw.map((r) => Math.floor(r));
  let left = totalCents - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}

// One-off: the Oct 15 Christmas Cookies sales actually paid out $231.49 (PayPal)
// + $136.35 (Venmo) = $367.84 after payment fees, and $52.26 was paid on shipping.
export async function fixChristmasSale() {
  const pins = await prisma.pin.findMany({
    where: { status: PinStatus.SOLD, series: { equals: "Christmas Calendar", mode: "insensitive" } },
    orderBy: { id: "asc" },
  });
  const cents = (k: "soldPrice" | "shippingCost" | "soldFee") =>
    pins.reduce((a, p) => a + Math.round((p[k] ?? 0) * 100), 0);
  if (pins.length !== 18 || cents("soldPrice") !== 34300 || cents("shippingCost") !== 5223) {
    throw new Error(
      `Unexpected data: ${pins.length} pins, sold ${cents("soldPrice")}, shipping ${cents("shippingCost")}`,
    );
  }

  const price = allocate(36784, pins.map((p) => Math.round((p.soldPrice ?? 0) * 100)));
  const ship = allocate(5226, pins.map((p) => Math.round((p.shippingCost ?? 0) * 100)));
  for (let i = 0; i < pins.length; i++) {
    await prisma.pin.update({
      where: { id: pins[i].id },
      data: { soldPrice: price[i] / 100, shippingCost: ship[i] / 100, soldFee: null },
    });
  }
  revalidatePath("/sold");
  revalidatePath("/");
}
