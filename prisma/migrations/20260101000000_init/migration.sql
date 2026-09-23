
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AcquisitionMethod" AS ENUM ('BOUGHT', 'TRADED', 'GIFTED', 'OTHER');

-- CreateEnum
CREATE TYPE "TradeDirection" AS ENUM ('GIVEN', 'RECEIVED');

-- CreateEnum
CREATE TYPE "PinStatus" AS ENUM ('OWNED', 'SOLD');

-- CreateTable
CREATE TABLE "Pin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" TEXT,
    "imageUrl" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "acquisitionMethod" "AcquisitionMethod" NOT NULL DEFAULT 'BOUGHT',
    "pricePaid" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "notes" TEXT,
    "status" "PinStatus" NOT NULL DEFAULT 'OWNED',
    "soldPrice" DOUBLE PRECISION,
    "soldDate" TIMESTAMP(3),
    "shippingCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" TEXT,
    "imageUrl" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerName" TEXT,
    "notes" TEXT,
    "shippingCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeItem" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "direction" "TradeDirection" NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "pinId" TEXT,

    CONSTRAINT "TradeItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TradeItem" ADD CONSTRAINT "TradeItem_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeItem" ADD CONSTRAINT "TradeItem_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

