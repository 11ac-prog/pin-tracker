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

export async function createTrade(formData: FormData) {
  const dateRaw = String(formData.get("date") ?? "");
  const date = dateRaw ? new Date(dateRaw) : new Date();
  const partnerName = String(formData.get("partnerName") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const itemCount = Number(formData.get("itemCount") ?? 0);

  const trade = await prisma.trade.create({
    data: { date, partnerName, notes },
  });

  for (let i = 0; i < itemCount; i++) {
    const direction = formData.get(`item-${i}-direction`) as TradeDirection | null;
    const description = String(formData.get(`item-${i}-description`) ?? "").trim();
    if (!direction || !description) continue;

    const estimatedValue = parseOptionalFloat(formData.get(`item-${i}-estimatedValue`));

    if (direction === TradeDirection.GIVEN) {
      const linkedPinId = String(formData.get(`item-${i}-pinId`) ?? "") || null;

      await prisma.tradeItem.create({
        data: {
          tradeId: trade.id,
          direction,
          description,
          estimatedValue,
          pinId: linkedPinId,
        },
      });

      if (linkedPinId) {
        await prisma.pin.delete({ where: { id: linkedPinId } }).catch(() => {});
      }
    } else {
      const addToCollection = formData.get(`item-${i}-addToCollection`) === "on";
      let newPinId: string | null = null;

      if (addToCollection) {
        const newPin = await prisma.pin.create({
          data: {
            name: description,
            acquisitionDate: date,
            acquisitionMethod: AcquisitionMethod.TRADED,
            currentValue: estimatedValue,
            notes: partnerName ? `Traded with ${partnerName}` : null,
          },
        });
        newPinId = newPin.id;
      }

      await prisma.tradeItem.create({
        data: {
          tradeId: trade.id,
          direction,
          description,
          estimatedValue,
          pinId: newPinId,
        },
      });
    }
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
