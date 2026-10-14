-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "shippingInPinCost" BOOLEAN NOT NULL DEFAULT false;

-- The Valeira CA trade's $4.38 shipping was already divided into the received
-- sets' prices ($29.50 each), so don't count it twice in total paid.
UPDATE "Trade" SET "shippingInPinCost" = true WHERE "partnerName" = 'Valeira CA' AND "shippingCost" IS NOT NULL;
