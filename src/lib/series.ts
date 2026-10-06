import { prisma } from "@/lib/prisma";

// Every series name already used on a pin or wishlist item, so forms can
// offer them as suggestions (the field stays free text for new ones).
export async function getSeriesOptions(): Promise<string[]> {
  const [pins, wishlist] = await Promise.all([
    prisma.pin.findMany({ where: { series: { not: null } }, select: { series: true }, distinct: ["series"] }),
    prisma.wishlistItem.findMany({ where: { series: { not: null } }, select: { series: true }, distinct: ["series"] }),
  ]);

  const unique = new Map<string, string>();
  for (const { series } of [...pins, ...wishlist]) {
    const trimmed = series?.trim();
    if (trimmed && !unique.has(trimmed.toLowerCase())) unique.set(trimmed.toLowerCase(), trimmed);
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
}
