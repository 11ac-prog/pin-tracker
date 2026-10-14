import { prisma } from "@/lib/prisma";
import { TradeDirection } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

// Temporary audit: received trade items with no linked pin (either never added
// to the collection, or the pin was later given away / deleted).
export default async function TradeAuditPage() {
  const items = await prisma.tradeItem.findMany({
    where: { direction: TradeDirection.RECEIVED, pinId: null },
    include: { trade: true },
    orderBy: { trade: { date: "asc" } },
  });
  const given = await prisma.tradeItem.findMany({
    where: { direction: TradeDirection.GIVEN },
    include: { trade: true },
  });
  const norm = (s: string) => s.trim().toLowerCase();
  return (
    <pre data-audit>
      {items
        .map((i) => {
          const later = given.filter(
            (g) => norm(g.description) === norm(i.description) && g.trade.date >= i.trade.date,
          );
          return `${i.trade.date.toISOString().slice(0, 10)} | ${i.trade.partnerName ?? "-"} | ${i.description} x${i.quantity} | later given away: ${later.length ? later.map((g) => g.trade.date.toISOString().slice(0, 10)).join(",") : "no"}`;
        })
        .join("\n") || "none"}
    </pre>
  );
}
