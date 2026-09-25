-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "pinId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pricePaid" DOUBLE PRECISION,
    "acquisitionDate" TIMESTAMP(3),
    "acquisitionMethod" "AcquisitionMethod" NOT NULL DEFAULT 'BOUGHT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
