"use server";

import { prisma } from "@/lib/prisma";
import { saveImageFromUrl } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

// pinandpop.com sits behind Cloudflare bot protection that blocks plain
// server-side HTTP clients (confirmed: same request succeeds from a real
// browser, 403s from Node's fetch — including from a deployed serverless
// function). So the *lookup* against pinandpop.com has to happen from a real
// browser, not from here. This module only does the part that's safe and
// fully automatable on the server: applying an already-resolved photo URL —
// downloading it and re-hosting it on our own Blob storage.

export async function listPinsNeedingPhotos() {
  const pins = await prisma.pin.findMany({
    where: { imageUrl: null },
    select: { id: true, name: true, series: true },
    orderBy: { createdAt: "asc" },
  });
  return pins;
}

export type ResolvedMatch = { pinId: string; imageUrl: string; label?: string };

export type ApplyOutcome =
  | { pinId: string; label?: string; status: "applied"; imageUrl: string }
  | { pinId: string; label?: string; status: "failed" };

export async function applyResolvedMatches(resolved: ResolvedMatch[]): Promise<ApplyOutcome[]> {
  const outcomes: ApplyOutcome[] = [];

  for (const { pinId, imageUrl, label } of resolved) {
    const blobUrl = await saveImageFromUrl(imageUrl, "pins");
    if (!blobUrl) {
      outcomes.push({ pinId, label, status: "failed" });
      continue;
    }
    await prisma.pin.update({ where: { id: pinId }, data: { imageUrl: blobUrl } });
    outcomes.push({ pinId, label, status: "applied", imageUrl: blobUrl });
  }

  revalidatePath("/pins");
  revalidatePath("/");
  return outcomes;
}
