-- AlterTable
ALTER TABLE "TradeItem" ADD COLUMN     "wasLinkedToPin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "givenSeries" TEXT,
ADD COLUMN     "givenAcquisitionDate" TIMESTAMP(3),
ADD COLUMN     "givenAcquisitionMethod" "AcquisitionMethod",
ADD COLUMN     "givenNotes" TEXT;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "tradeItemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_tradeItemId_key" ON "Purchase"("tradeItemId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_tradeItemId_fkey" FOREIGN KEY ("tradeItemId") REFERENCES "TradeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
