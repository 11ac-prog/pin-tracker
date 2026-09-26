import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// Weighted average cost across every purchase ever recorded for a pin,
// counting only priced purchases (a gift/unknown-price purchase still adds
// to quantity but doesn't skew the average toward $0).
function weightedAveragePrice(purchases: { quantity: number; pricePaid: number | null }[]): number | null {
  let totalQty = 0;
  let totalCost = 0;
  for (const p of purchases) {
    if (p.pricePaid === null) continue;
    totalQty += p.quantity;
    totalCost += p.quantity * p.pricePaid;
  }
  return totalQty > 0 ? totalCost / totalQty : null;
}

async function recomputePricePaid(tx: Prisma.TransactionClient, pinId: string) {
  const purchases = await tx.purchase.findMany({
    where: { pinId },
    select: { quantity: true, pricePaid: true },
  });
  await tx.pin.update({
    where: { id: pinId },
    data: { pricePaid: weightedAveragePrice(purchases) },
  });
}

export async function addPurchase(
  pinId: string,
  purchase: {
    quantity: number;
    pricePaid: number | null;
    acquisitionDate: Date | null;
    acquisitionMethod: Prisma.PurchaseCreateInput["acquisitionMethod"];
    notes: string | null;
    // Links this purchase to the trade item that created it, so deleting
    // that trade can find and undo exactly this purchase.
    tradeItemId?: string;
  },
) {
  await prisma.$transaction(async (tx) => {
    await tx.purchase.create({ data: { pinId, ...purchase } });
    await tx.pin.update({
      where: { id: pinId },
      data: { quantity: { increment: purchase.quantity } },
    });
    await recomputePricePaid(tx, pinId);
  });
}

// Records a purchase for units that are already counted in Pin.quantity —
// used to backfill purchase history for pins that predate the Purchase
// model, where the existing quantity/price is real but was never logged as
// its own row. Unlike addPurchase, this never touches Pin.quantity.
export async function backfillPurchase(
  pinId: string,
  purchase: {
    quantity: number;
    pricePaid: number | null;
    acquisitionDate: Date | null;
    acquisitionMethod: Prisma.PurchaseCreateInput["acquisitionMethod"];
  },
) {
  await prisma.$transaction(async (tx) => {
    await tx.purchase.create({ data: { pinId, ...purchase, notes: null } });
    await recomputePricePaid(tx, pinId);
  });
}

export async function updatePurchase(
  purchaseId: string,
  purchase: {
    quantity: number;
    pricePaid: number | null;
    acquisitionDate: Date | null;
    acquisitionMethod: Prisma.PurchaseCreateInput["acquisitionMethod"];
    notes: string | null;
  },
) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.findUniqueOrThrow({ where: { id: purchaseId } });
    await tx.purchase.update({ where: { id: purchaseId }, data: purchase });
    await tx.pin.update({
      where: { id: existing.pinId },
      data: { quantity: { increment: purchase.quantity - existing.quantity } },
    });
    await recomputePricePaid(tx, existing.pinId);
  });
}

export async function deletePurchase(purchaseId: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.delete({ where: { id: purchaseId } });
    await tx.pin.update({
      where: { id: existing.pinId },
      data: { quantity: { decrement: existing.quantity } },
    });
    await recomputePricePaid(tx, existing.pinId);
  });
}
