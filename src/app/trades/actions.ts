"use server";

import { prisma } from "@/lib/prisma";
import { TradeDirection, AcquisitionMethod } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addPurchase, deletePurchase } from "@/lib/purchases";

function parseOptionalFloat(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parsePositiveInt(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.round(parsed);
}

type ParsedItem = {
  direction: TradeDirection;
  description: string;
  series: string | null;
  // Per pin, not the total for the line — matches how Pin.pricePaid /
  // Pin.currentValue are stored, so no conversion is needed going either way.
  valuePerUnit: number | null;
  quantity: number;
  pinId: string | null;
  // A received item can be matched to a pin already in the collection —
  // that pin gets a new purchase instead of a duplicate card.
  matchPinId: string | null;
  addToCollection: boolean;
};

export async function createTrade(formData: FormData) {
  const dateRaw = String(formData.get("date") ?? "");
  const date = dateRaw ? new Date(dateRaw) : new Date();
  const partnerName = String(formData.get("partnerName") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const shippingCost = parseOptionalFloat(formData.get("shippingCost"));
  const itemCount = Number(formData.get("itemCount") ?? 0);

  const items: ParsedItem[] = [];
  for (let i = 0; i < itemCount; i++) {
    const direction = formData.get(`item-${i}-direction`) as TradeDirection | null;
    const description = String(formData.get(`item-${i}-description`) ?? "").trim();
    if (!direction || !description) continue;

    items.push({
      direction,
      description,
      series:
        direction === TradeDirection.RECEIVED
          ? String(formData.get(`item-${i}-series`) ?? "").trim() || null
          : null,
      // For a given item, this is filled in below from the linked pin's own
      // price paid — never asked for on the form. For a received item, it's
      // the per-pin worth you entered for the incoming pin(s).
      valuePerUnit:
        direction === TradeDirection.RECEIVED
          ? parseOptionalFloat(formData.get(`item-${i}-estimatedValue`))
          : null,
      quantity: parsePositiveInt(formData.get(`item-${i}-quantity`), 1),
      pinId:
        direction === TradeDirection.GIVEN
          ? String(formData.get(`item-${i}-pinId`) ?? "") || null
          : null,
      matchPinId:
        direction === TradeDirection.RECEIVED
          ? String(formData.get(`item-${i}-matchPinId`) ?? "") || null
          : null,
      addToCollection:
        direction === TradeDirection.RECEIVED &&
        formData.get(`item-${i}-addToCollection`) === "on",
    });
  }

  const givenItems = items.filter((item) => item.direction === TradeDirection.GIVEN);
  const receivedItems = items.filter((item) => item.direction === TradeDirection.RECEIVED);

  // What you originally paid for the pins you're giving up carries over to what you get
  // back, so "paid" keeps tracking your real out-of-pocket cost across trades.
  const linkedPins = await prisma.pin.findMany({
    where: { id: { in: givenItems.map((item) => item.pinId).filter((id): id is string => !!id) } },
  });
  const linkedPinById = new Map(linkedPins.map((pin) => [pin.id, pin]));

  let totalCostBasis = 0;
  let hasCostBasis = false;
  for (const item of givenItems) {
    const linkedPin = item.pinId ? linkedPinById.get(item.pinId) : undefined;
    // Clamp to what's actually available, and price just the portion given away.
    item.quantity = linkedPin ? Math.min(item.quantity, linkedPin.quantity) : 1;
    item.valuePerUnit = linkedPin?.pricePaid ?? null;
    if (item.valuePerUnit !== null) {
      totalCostBasis += item.valuePerUnit * item.quantity;
      hasCostBasis = true;
    }
  }

  const receivedToCollection = receivedItems.filter((item) => item.addToCollection || item.matchPinId);
  const totalReceivedValue = receivedToCollection.reduce(
    (sum, item) => sum + (item.valuePerUnit ?? 0) * item.quantity,
    0,
  );

  // Total cost basis (from what was given up) allocated to one received line,
  // proportional to that line's own total worth among the received lines.
  function costBasisTotalFor(item: ParsedItem): number | null {
    if (!hasCostBasis || receivedToCollection.length === 0) return null;
    if (receivedToCollection.length === 1) return totalCostBasis;
    const lineValue = (item.valuePerUnit ?? 0) * item.quantity;
    if (totalReceivedValue > 0) {
      return totalCostBasis * (lineValue / totalReceivedValue);
    }
    return totalCostBasis / receivedToCollection.length;
  }

  const trade = await prisma.trade.create({
    data: { date, partnerName, notes, shippingCost },
  });

  for (const item of givenItems) {
    const linkedPin = item.pinId ? linkedPinById.get(item.pinId) : undefined;
    const lineTotal = item.valuePerUnit !== null ? item.valuePerUnit * item.quantity : null;

    await prisma.tradeItem.create({
      data: {
        tradeId: trade.id,
        direction: item.direction,
        description: item.description,
        // Snapshot the photo (and, below, a few other fields) now, since a
        // fully-given-away pin's row gets deleted right after — this is what
        // lets a pin's detail page show pictures of what was traded away for
        // it, and lets deleting this trade later recreate the pin faithfully.
        imageUrl: linkedPin?.imageUrl ?? null,
        estimatedValue: lineTotal,
        quantity: item.quantity,
        pinId: item.pinId,
        wasLinkedToPin: item.pinId !== null,
        givenSeries: linkedPin?.series ?? null,
        givenAcquisitionDate: linkedPin?.acquisitionDate ?? null,
        givenAcquisitionMethod: linkedPin?.acquisitionMethod ?? null,
        givenNotes: linkedPin?.notes ?? null,
      },
    });

    if (linkedPin) {
      if (item.quantity >= linkedPin.quantity) {
        await prisma.pin.delete({ where: { id: linkedPin.id } }).catch(() => {});
      } else {
        // Giving away part of a multi-quantity pin: shrink what's left.
        // pricePaid/currentValue are per pin, so they're unaffected — only
        // quantity splits.
        await prisma.pin.update({
          where: { id: linkedPin.id },
          data: { quantity: linkedPin.quantity - item.quantity },
        });
      }
    }
  }

  for (const item of receivedItems) {
    let newPinId: string | null = null;
    const lineTotal = item.valuePerUnit !== null ? item.valuePerUnit * item.quantity : null;

    // A new pin needs to exist before the trade item can point at it, and the
    // trade item needs to exist before the purchase can link back to it —
    // hence pin, then trade item, then purchase.
    if (item.matchPinId) {
      newPinId = item.matchPinId;
    } else if (item.addToCollection) {
      const newPin = await prisma.pin.create({
        data: {
          name: item.description,
          series: item.series,
          acquisitionDate: date,
          acquisitionMethod: AcquisitionMethod.TRADED,
          quantity: 0,
          pricePaid: null,
          currentValue: item.valuePerUnit,
          notes: partnerName ? `Traded with ${partnerName}` : null,
        },
      });
      newPinId = newPin.id;
    }

    const tradeItem = await prisma.tradeItem.create({
      data: {
        tradeId: trade.id,
        direction: item.direction,
        description: item.description,
        estimatedValue: lineTotal,
        quantity: item.quantity,
        pinId: newPinId,
      },
    });

    if (newPinId) {
      const costBasisTotal = costBasisTotalFor(item);
      const pricePaid = costBasisTotal !== null ? costBasisTotal / item.quantity : null;
      await addPurchase(newPinId, {
        quantity: item.quantity,
        pricePaid,
        acquisitionDate: date,
        acquisitionMethod: AcquisitionMethod.TRADED,
        notes: partnerName ? `Traded with ${partnerName}` : null,
        tradeItemId: tradeItem.id,
      });
      if (item.matchPinId && item.valuePerUnit !== null) {
        await prisma.pin.update({
          where: { id: item.matchPinId },
          data: { currentValue: item.valuePerUnit },
        });
      }
    }
  }

  revalidatePath("/trades");
  revalidatePath("/pins");
  revalidatePath("/");
  redirect("/trades");
}

// Editing a trade only touches the trade record and its items' own fields
// (description, value) — never which pins are linked or their quantities.
// Those already drove one-time, hard-to-reverse changes when the trade was
// created (a given pin was deleted or shrunk, a received pin was added), so
// re-deriving them from an edited form would risk double-applying or losing
// that history. Fixing a typo or a wrong value is safe; changing what was
// actually traded means deleting this trade and logging it again.
export async function updateTrade(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trade id");

  const dateRaw = String(formData.get("date") ?? "");
  const date = dateRaw ? new Date(dateRaw) : new Date();
  const partnerName = String(formData.get("partnerName") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const shippingCost = parseOptionalFloat(formData.get("shippingCost"));

  const itemIds = String(formData.get("itemIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.trade.update({ where: { id }, data: { date, partnerName, notes, shippingCost } }),
    ...itemIds.map((itemId) =>
      prisma.tradeItem.update({
        where: { id: itemId },
        data: {
          description: String(formData.get(`item-${itemId}-description`) ?? "").trim(),
          estimatedValue: parseOptionalFloat(formData.get(`item-${itemId}-estimatedValue`)),
        },
      }),
    ),
  ]);

  revalidatePath("/trades");
  redirect("/trades");
}

// Undoes what this trade did to the collection, then deletes it:
// - A given item whose pin still exists (only partially given away) gets its
//   quantity back.
// - A given item whose pin was fully given away (and hard-deleted) is
//   recreated from the snapshot taken at trade time — a new pin, since the
//   original id is gone, but the same name/photo/series/price/quantity.
// - A received item's purchase is removed (via the normal purchase-delete
//   path, so quantity/average recompute correctly); if that leaves the pin
//   with no purchases at all, the pin was created solely by this trade and
//   is removed too.
export async function deleteTrade(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trade id");

  const trade = await prisma.trade.findUnique({ where: { id }, include: { items: true } });
  if (!trade) return;

  for (const item of trade.items) {
    if (item.direction === TradeDirection.GIVEN) {
      if (item.pinId) {
        await prisma.pin.update({
          where: { id: item.pinId },
          data: { quantity: { increment: item.quantity } },
        });
      } else if (item.wasLinkedToPin) {
        const pricePaid = item.estimatedValue !== null ? item.estimatedValue / item.quantity : null;
        const restoredPin = await prisma.pin.create({
          data: {
            name: item.description,
            series: item.givenSeries,
            imageUrl: item.imageUrl,
            acquisitionDate: item.givenAcquisitionDate,
            acquisitionMethod: item.givenAcquisitionMethod ?? AcquisitionMethod.BOUGHT,
            notes: item.givenNotes,
            quantity: 0,
            pricePaid: null,
          },
        });
        await addPurchase(restoredPin.id, {
          quantity: item.quantity,
          pricePaid,
          acquisitionDate: item.givenAcquisitionDate,
          acquisitionMethod: item.givenAcquisitionMethod ?? AcquisitionMethod.BOUGHT,
          notes: "Restored after deleting a trade",
        });
      }
    } else {
      const purchase = await prisma.purchase.findUnique({ where: { tradeItemId: item.id } });
      if (purchase) {
        await deletePurchase(purchase.id);
        const remaining = await prisma.purchase.count({ where: { pinId: purchase.pinId } });
        if (remaining === 0) {
          await prisma.pin.delete({ where: { id: purchase.pinId } }).catch(() => {});
        }
      }
    }
  }

  await prisma.trade.delete({ where: { id } });
  revalidatePath("/trades");
  revalidatePath("/pins");
  revalidatePath("/");
}
