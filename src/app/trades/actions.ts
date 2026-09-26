"use server";

import { prisma } from "@/lib/prisma";
import { TradeDirection, AcquisitionMethod } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addPurchase } from "@/lib/purchases";

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
        // Snapshot the photo now, since a fully-given-away pin's row (and its
        // image) gets deleted right after — this is what lets a pin's detail
        // page show pictures of what was traded away for it, later.
        imageUrl: linkedPin?.imageUrl ?? null,
        estimatedValue: lineTotal,
        quantity: item.quantity,
        pinId: item.pinId,
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

    if (item.matchPinId) {
      // Already in the collection: add a purchase to that pin instead of
      // creating a duplicate card.
      const costBasisTotal = costBasisTotalFor(item);
      const pricePaid = costBasisTotal !== null ? costBasisTotal / item.quantity : null;
      await addPurchase(item.matchPinId, {
        quantity: item.quantity,
        pricePaid,
        acquisitionDate: date,
        acquisitionMethod: AcquisitionMethod.TRADED,
        notes: partnerName ? `Traded with ${partnerName}` : null,
      });
      if (item.valuePerUnit !== null) {
        await prisma.pin.update({
          where: { id: item.matchPinId },
          data: { currentValue: item.valuePerUnit },
        });
      }
      newPinId = item.matchPinId;
    } else if (item.addToCollection) {
      const costBasisTotal = costBasisTotalFor(item);
      const pricePaid = costBasisTotal !== null ? costBasisTotal / item.quantity : null;
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
      await addPurchase(newPin.id, {
        quantity: item.quantity,
        pricePaid,
        acquisitionDate: date,
        acquisitionMethod: AcquisitionMethod.TRADED,
        notes: partnerName ? `Traded with ${partnerName}` : null,
      });
      newPinId = newPin.id;
    }

    await prisma.tradeItem.create({
      data: {
        tradeId: trade.id,
        direction: item.direction,
        description: item.description,
        estimatedValue: lineTotal,
        quantity: item.quantity,
        pinId: newPinId,
      },
    });
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

export async function deleteTrade(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trade id");
  await prisma.trade.delete({ where: { id } });
  revalidatePath("/trades");
}
