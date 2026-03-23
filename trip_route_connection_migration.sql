-- Migration: Connect Trips to Routes
-- This migration adds the ability to link trips to predefined routes

-- Add new column to Trip table to reference Route table
ALTER TABLE "Trip" 
ADD COLUMN IF NOT EXISTS "routeId" TEXT REFERENCES "Route"(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_routeId ON "Trip"("routeId");

-- Add comment to document the column
COMMENT ON COLUMN "Trip"."routeId" IS 'Reference to the Route table for predefined routes. The route text field is kept for backward compatibility and custom routes.';

-- Note: The existing 'route' TEXT field is retained for:
-- 1. Backward compatibility with existing trips
-- 2. Custom routes that aren't in the Route table
-- 3. Displaying the route description even when linked to a Route record
