"use server";

import { prisma } from "@/lib/prisma";
import { TradeDirection, AcquisitionMethod } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  estimatedValue: number | null;
  quantity: number;
  pinId: string | null;
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
      // For a given item, the "value" is what you originally paid for it — filled in
      // below from the linked pin, never asked for on the form. For a received item,
      // it's the worth you entered for the incoming pin(s).
      estimatedValue:
        direction === TradeDirection.RECEIVED
          ? parseOptionalFloat(formData.get(`item-${i}-estimatedValue`))
          : null,
      quantity: parsePositiveInt(formData.get(`item-${i}-quantity`), 1),
      pinId:
        direction === TradeDirection.GIVEN
          ? String(formData.get(`item-${i}-pinId`) ?? "") || null
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
    const pricePerUnit = linkedPin?.pricePaid != null ? linkedPin.pricePaid / linkedPin.quantity : null;
    const cost = pricePerUnit !== null ? pricePerUnit * item.quantity : null;
    item.estimatedValue = cost;
    if (cost !== null) {
      totalCostBasis += cost;
      hasCostBasis = true;
    }
  }

  const receivedToCollection = receivedItems.filter((item) => item.addToCollection);
  const totalReceivedValue = receivedToCollection.reduce(
    (sum, item) => sum + (item.estimatedValue ?? 0),
    0,
  );

  function costBasisFor(item: ParsedItem): number | null {
    if (!hasCostBasis || receivedToCollection.length === 0) return null;
    if (receivedToCollection.length === 1) return totalCostBasis;
    if (totalReceivedValue > 0) {
      return totalCostBasis * ((item.estimatedValue ?? 0) / totalReceivedValue);
    }
    return totalCostBasis / receivedToCollection.length;
  }

  const trade = await prisma.trade.create({
    data: { date, partnerName, notes, shippingCost },
  });

  for (const item of givenItems) {
    const linkedPin = item.pinId ? linkedPinById.get(item.pinId) : undefined;

    await prisma.tradeItem.create({
      data: {
        tradeId: trade.id,
        direction: item.direction,
        description: item.description,
        // Snapshot the photo now, since a fully-given-away pin's row (and its
        // image) gets deleted right after — this is what lets a pin's detail
        // page show pictures of what was traded away for it, later.
        imageUrl: linkedPin?.imageUrl ?? null,
        estimatedValue: item.estimatedValue,
        quantity: item.quantity,
        pinId: item.pinId,
      },
    });

    if (linkedPin) {
      if (item.quantity >= linkedPin.quantity) {
        await prisma.pin.delete({ where: { id: linkedPin.id } }).catch(() => {});
      } else {
        // Giving away part of a multi-quantity pin: shrink what's left,
        // proportioning cost/worth by unit rather than deleting the row.
        const remainingQuantity = linkedPin.quantity - item.quantity;
        const pricePerUnit =
          linkedPin.pricePaid !== null ? linkedPin.pricePaid / linkedPin.quantity : null;
        const worthPerUnit =
          linkedPin.currentValue !== null ? linkedPin.currentValue / linkedPin.quantity : null;

        await prisma.pin.update({
          where: { id: linkedPin.id },
          data: {
            quantity: remainingQuantity,
            pricePaid: pricePerUnit !== null ? pricePerUnit * remainingQuantity : null,
            currentValue: worthPerUnit !== null ? worthPerUnit * remainingQuantity : null,
          },
        });
      }
    }
  }

  for (const item of receivedItems) {
    let newPinId: string | null = null;

    if (item.addToCollection) {
      const newPin = await prisma.pin.create({
        data: {
          name: item.description,
          acquisitionDate: date,
          acquisitionMethod: AcquisitionMethod.TRADED,
          quantity: item.quantity,
          pricePaid: costBasisFor(item),
          currentValue: item.estimatedValue,
          notes: partnerName ? `Traded with ${partnerName}` : null,
        },
      });
      newPinId = newPin.id;
    }

    await prisma.tradeItem.create({
      data: {
        tradeId: trade.id,
        direction: item.direction,
        description: item.description,
        estimatedValue: item.estimatedValue,
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

export async function deleteTrade(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trade id");
  await prisma.trade.delete({ where: { id } });
  revalidatePath("/trades");
}
