-- Migration: Add File Upload Fields to Document Table
-- Date: 2026-02-17
-- Description: Add file storage fields for Supabase Storage integration

-- Add file-related columns to Document table
ALTER TABLE "Document" 
ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS "fileType" TEXT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Document table updated with file storage fields!';
END $$;
