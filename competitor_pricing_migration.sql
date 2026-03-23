-- Migration: Add CompetitorPricing Table
-- Date: 2026-02-17
-- Description: Store competitive pricing analysis data in Supabase database

-- Create CompetitorPricing Table
CREATE TABLE IF NOT EXISTS "CompetitorPricing" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyName" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL,
  capacity TEXT NOT NULL,
  route TEXT NOT NULL,
  price FLOAT NOT NULL,
  "ourPrice" FLOAT NOT NULL,
  "priceDifference" FLOAT DEFAULT 0,
  "isBestPrice" BOOLEAN DEFAULT false,
  "marketRank" INTEGER DEFAULT 5,
  date TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_competitorpricing_companyName ON "CompetitorPricing"("companyName");
CREATE INDEX idx_competitorpricing_date ON "CompetitorPricing"(date);

-- Enable Row Level Security
ALTER TABLE "CompetitorPricing" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy (allow all operations for now)
CREATE POLICY "Allow all operations on CompetitorPricing" ON "CompetitorPricing"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'CompetitorPricing table created successfully!';
END $$;
