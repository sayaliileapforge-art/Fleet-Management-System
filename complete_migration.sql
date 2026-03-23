-- Complete Migration Script for Fleet Management System
-- Run this in your Supabase SQL Editor to fix all errors
-- This script is safe to run multiple times (uses IF NOT EXISTS)

-- ============================================
-- 1. Update Customer Table
-- ============================================

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

-- ============================================
-- 2. Create Contract Table
-- ============================================

-- Create Contract table
CREATE TABLE IF NOT EXISTS "Contract" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  "customerId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE,
  budget FLOAT DEFAULT 0,
  spent FLOAT DEFAULT 0,
  description TEXT,
  "paymentTerms" TEXT,
  status TEXT DEFAULT 'Active',
  trips INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_customerId ON "Contract"("customerId");
CREATE INDEX IF NOT EXISTS idx_contract_status ON "Contract"(status);

-- Enable RLS (Row Level Security)
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations on Contract" ON "Contract";
CREATE POLICY "Allow all operations on Contract" ON "Contract"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Done! Your database is now ready.
-- ============================================
