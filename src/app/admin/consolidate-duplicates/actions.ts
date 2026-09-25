"use server";

import { prisma } from "@/lib/prisma";
import { PinStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { backfillPurchase } from "@/lib/purchases";

function groupKey(name: string, series: string | null) {
  return `${name.trim().toLowerCase()}|${(series ?? "").trim().toLowerCase()}`;
}

export type DuplicateGroup = {
  key: string;
  name: string;
  series: string | null;
  imageUrl: string | null;
  totalQuantity: number;
  pinIds: string[];
};

export async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  const pins = await prisma.pin.findMany({
    where: { status: PinStatus.OWNED },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, typeof pins>();
  for (const pin of pins) {
    const key = groupKey(pin.name, pin.series);
    groups.set(key, [...(groups.get(key) ?? []), pin]);
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      name: group[0].name,
      series: group[0].series,
      imageUrl: group.find((p) => p.imageUrl)?.imageUrl ?? null,
      totalQuantity: group.reduce((sum, p) => sum + p.quantity, 0),
      pinIds: group.map((p) => p.id),
    }));
}

// Merges a group of duplicate pins (same name+series, split across rows
// because they were bought at different prices) into one pin: the earliest
// row survives as the identity, every row's quantity/price/date/method
// becomes its own Purchase on that surviving pin, and the rest are deleted.
export async function mergeDuplicateGroup(pinIds: string[]) {
  if (pinIds.length < 2) return;

  const pins = await prisma.pin.findMany({
    where: { id: { in: pinIds } },
    orderBy: { createdAt: "asc" },
  });
  if (pins.length < 2) return;

  const [primary, ...duplicates] = pins;
  const toDeleteIds = duplicates.map((p) => p.id);

  const totalQuantity = pins.reduce((sum, p) => sum + p.quantity, 0);
  const priced = pins.filter((p) => p.pricePaid !== null);
  const pricePaid =
    priced.length > 0
      ? priced.reduce((sum, p) => sum + p.quantity * (p.pricePaid ?? 0), 0) /
        priced.reduce((sum, p) => sum + p.quantity, 0)
      : null;
  const earliestDated = pins
    .filter((p) => p.acquisitionDate !== null)
    .sort((a, b) => a.acquisitionDate!.getTime() - b.acquisitionDate!.getTime())[0];

  await prisma.$transaction([
    // One Purchase per merged row, preserving each one's own price/date/method.
    ...pins.map((p) =>
      prisma.purchase.create({
        data: {
          pinId: primary.id,
          quantity: p.quantity,
          pricePaid: p.pricePaid,
          acquisitionDate: p.acquisitionDate,
          acquisitionMethod: p.acquisitionMethod,
          notes: p.id === primary.id ? null : p.notes,
        },
      }),
    ),
    // Repoint any trade history pointing at a row we're about to delete.
    prisma.tradeItem.updateMany({
      where: { pinId: { in: toDeleteIds } },
      data: { pinId: primary.id },
    }),
    prisma.pin.update({
      where: { id: primary.id },
      data: {
        quantity: totalQuantity,
        pricePaid,
        imageUrl: primary.imageUrl ?? duplicates.find((p) => p.imageUrl)?.imageUrl ?? null,
        acquisitionDate: earliestDated?.acquisitionDate ?? primary.acquisitionDate,
        acquisitionMethod: earliestDated?.acquisitionMethod ?? primary.acquisitionMethod,
      },
    }),
    prisma.pin.deleteMany({ where: { id: { in: toDeleteIds } } }),
  ]);

  revalidatePath("/pins");
  revalidatePath("/");
}

// Pins created before the Purchase model existed have no purchase rows at
// all, even though their quantity/price are real. Gives each of them exactly
// one purchase mirroring their current state, so future "+" additions
// average against real history instead of starting from nothing.
export async function backfillMissingPurchases(): Promise<void> {
  const pins = await prisma.pin.findMany({
    where: { purchases: { none: {} } },
  });

  for (const pin of pins) {
    await backfillPurchase(pin.id, {
      quantity: pin.quantity,
      pricePaid: pin.pricePaid,
      acquisitionDate: pin.acquisitionDate,
      acquisitionMethod: pin.acquisitionMethod,
    });
  }

  revalidatePath("/pins");
  revalidatePath("/");
}

// One-off: corrects "Halloween Castle" (cmuevdpai000804jy8l0mqj3v), which
// picked up a test purchase via the + button before the rest of its history
// had been backfilled, so its average briefly collapsed to just that one
// purchase's price instead of blending with the original. Safe to remove
// once run.
export async function fixHalloweenCastleTestData() {
  await backfillPurchase("cmuevdpai000804jy8l0mqj3v", {
    quantity: 1,
    pricePaid: 9.83,
    acquisitionDate: new Date("2026-09-15"),
    acquisitionMethod: "BOUGHT",
  });
  revalidatePath("/pins");
  revalidatePath("/");
}
