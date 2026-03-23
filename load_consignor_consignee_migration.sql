-- Migration: Add consignor and consignee support to Load table
-- This migration adds the ability to track consignors and consignees for shipments

-- Add new columns to Load table if they don't exist
ALTER TABLE "Load" 
ADD COLUMN IF NOT EXISTS "consignorId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "consigneeId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_load_consignorId ON "Load"("consignorId");
CREATE INDEX IF NOT EXISTS idx_load_consigneeId ON "Load"("consigneeId");

-- Add comment to document the columns (optional, mainly for documentation)
COMMENT ON COLUMN "Load"."consignorId" IS 'Reference to the Customer who is sending the shipment';
COMMENT ON COLUMN "Load"."consigneeId" IS 'Reference to the Customer who is receiving the shipment';
