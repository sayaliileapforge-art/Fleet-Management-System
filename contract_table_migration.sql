-- Migration script to create Contract table
-- Run this in your Supabase SQL editor

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
CREATE POLICY "Allow all operations on Contract" ON "Contract"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
