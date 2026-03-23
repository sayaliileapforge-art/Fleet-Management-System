-- Migration script to add missing columns to Customer table
-- Run this in your Supabase SQL editor

-- Add missing columns to Customer table
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Customer';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "gstNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "panNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "totalRevenue" FLOAT DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS outstanding FLOAT DEFAULT 0;

-- Create index on type column for better performance
CREATE INDEX IF NOT EXISTS idx_customer_type ON "Customer"(type);

-- Update existing records to have default type if NULL
UPDATE "Customer" SET type = 'Customer' WHERE type IS NULL;
