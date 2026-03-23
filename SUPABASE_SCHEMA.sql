-- Fleet Management System - Supabase Database Schema

-- Vehicle Table
CREATE TABLE IF NOT EXISTS "Vehicle" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "vehicleNo" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  model TEXT NOT NULL,
  capacity TEXT,
  "fuelType" TEXT,
  status TEXT DEFAULT 'Active',
  "licenseExpiry" TIMESTAMP WITH TIME ZONE,
  "insuranceExpiry" TIMESTAMP WITH TIME ZONE,
  "totalTrips" INTEGER DEFAULT 0,
  "totalRevenue" FLOAT DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_status ON "Vehicle"(status);
CREATE INDEX idx_vehicle_vehicleNo ON "Vehicle"("vehicleNo");

-- Driver Table
CREATE TABLE IF NOT EXISTS "Driver" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  license TEXT UNIQUE,
  "licenseExpiry" TIMESTAMP WITH TIME ZONE,
  experience TEXT,
  status TEXT DEFAULT 'Active',
  "totalTrips" INTEGER DEFAULT 0,
  rating FLOAT DEFAULT 4.5,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_driver_status ON "Driver"(status);
CREATE INDEX idx_driver_name ON "Driver"(name);

-- Customer Table
CREATE TABLE IF NOT EXISTS "Customer" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Customer',
  "contactPerson" TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  "gstNumber" TEXT,
  "panNumber" TEXT,
  notes TEXT,
  "totalRevenue" FLOAT DEFAULT 0,
  outstanding FLOAT DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_name ON "Customer"(name);
CREATE INDEX idx_customer_type ON "Customer"(type);

-- Contract Table
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

CREATE INDEX idx_contract_customerId ON "Contract"("customerId");
CREATE INDEX idx_contract_status ON "Contract"(status);

-- Trip Table
CREATE TABLE IF NOT EXISTS "Trip" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"(id) ON DELETE CASCADE,
  "driverId" TEXT NOT NULL REFERENCES "Driver"(id) ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL,
  "routeId" TEXT REFERENCES "Route"(id) ON DELETE SET NULL,
  route TEXT,
  distance TEXT,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Planned',
  revenue FLOAT DEFAULT 0,
  expense FLOAT DEFAULT 0,
  profit FLOAT DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_status ON "Trip"(status);
CREATE INDEX idx_trip_vehicleId ON "Trip"("vehicleId");
CREATE INDEX idx_trip_driverId ON "Trip"("driverId");
CREATE INDEX idx_trip_customerId ON "Trip"("customerId");
CREATE INDEX idx_trip_routeId ON "Trip"("routeId");

-- Expense Table
CREATE TABLE IF NOT EXISTS "Expense" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"(id) ON DELETE CASCADE,
  "tripId" TEXT REFERENCES "Trip"(id) ON DELETE SET NULL,
  "customerId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount FLOAT NOT NULL,
  "paymentMethod" TEXT DEFAULT 'Cash',
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_vehicleId ON "Expense"("vehicleId");
CREATE INDEX idx_expense_tripId ON "Expense"("tripId");
CREATE INDEX idx_expense_customerId ON "Expense"("customerId");
CREATE INDEX idx_expense_category ON "Expense"(category);

-- Enable RLS (Row Level Security)
ALTER TABLE "Vehicle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations on Vehicle" ON "Vehicle"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on Driver" ON "Driver"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on Customer" ON "Customer"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on Contract" ON "Contract"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on Trip" ON "Trip"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on Expense" ON "Expense"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- Load Table (for Loads & Shipments)
CREATE TABLE IF NOT EXISTS "Load" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tripId" TEXT REFERENCES "Trip"(id) ON DELETE SET NULL,
  "consignorId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL,
  "consigneeId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL,
  material TEXT NOT NULL,
  weight TEXT,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  pod TEXT DEFAULT 'Pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_load_tripId ON "Load"("tripId");
CREATE INDEX idx_load_consignorId ON "Load"("consignorId");
CREATE INDEX idx_load_consigneeId ON "Load"("consigneeId");
CREATE INDEX idx_load_status ON "Load"(status);

ALTER TABLE "Load" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on Load" ON "Load"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- Document Table
CREATE TABLE IF NOT EXISTS "Document" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  "linkedType" TEXT,
  "linkedTo" TEXT,
  "uploadDate" TEXT,
  expiry TEXT,
  status TEXT DEFAULT 'Valid',
  "fileUrl" TEXT,
  "fileName" TEXT,
  "fileType" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_category ON "Document"(category);
CREATE INDEX idx_document_status ON "Document"(status);

ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on Document" ON "Document"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- Route Table
CREATE TABLE IF NOT EXISTS "Route" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  distance TEXT,
  "avgTime" TEXT,
  "totalTrips" INTEGER DEFAULT 0,
  frequency TEXT DEFAULT 'Medium',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_route_frequency ON "Route"(frequency);

ALTER TABLE "Route" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on Route" ON "Route"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- FuelEntry Table
CREATE TABLE IF NOT EXISTS "FuelEntry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  date TEXT NOT NULL,
  "vehicleId" TEXT REFERENCES "Vehicle"(id) ON DELETE SET NULL,
  vehicle TEXT,
  liters FLOAT NOT NULL,
  "pricePerLiter" FLOAT NOT NULL,
  "totalCost" FLOAT NOT NULL,
  odometer FLOAT,
  efficiency FLOAT DEFAULT 0,
  vendor TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fuelentry_vehicleId ON "FuelEntry"("vehicleId");
CREATE INDEX idx_fuelentry_date ON "FuelEntry"(date);

ALTER TABLE "FuelEntry" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on FuelEntry" ON "FuelEntry"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- Invoice Table
CREATE TABLE IF NOT EXISTS "Invoice" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "customerId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL,
  "customerName" TEXT,
  "tripId" TEXT REFERENCES "Trip"(id) ON DELETE SET NULL,
  "tripRoute" TEXT,
  "invoiceDate" TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  amount FLOAT NOT NULL DEFAULT 0,
  "paidAmount" FLOAT DEFAULT 0,
  status TEXT DEFAULT 'Unpaid',
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_customerId ON "Invoice"("customerId");
CREATE INDEX idx_invoice_status ON "Invoice"(status);
CREATE INDEX idx_invoice_date ON "Invoice"("invoiceDate");

ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on Invoice" ON "Invoice"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- CompetitorPricing Table
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

CREATE INDEX idx_competitorpricing_companyName ON "CompetitorPricing"("companyName");
CREATE INDEX idx_competitorpricing_date ON "CompetitorPricing"(date);

ALTER TABLE "CompetitorPricing" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on CompetitorPricing" ON "CompetitorPricing"
  AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
