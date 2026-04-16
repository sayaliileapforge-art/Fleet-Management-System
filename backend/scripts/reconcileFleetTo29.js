const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatVehicleNumber = (num) => {
  const clean = String(num || '')
    .replace(/\s+/g, '')
    .toUpperCase();
  return clean.replace(/^([A-Z]{2})(\d{2})([A-Z]{2})(\d{4})$/, '$1-$2$3-$4');
};

const normalizeVehicleNumber = (num) =>
  String(num || '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();

const fleetJsonPath = path.resolve(__dirname, '../src/data/fleetVehicles2025_2026_ordered.json');

async function main() {
  const raw = fs.readFileSync(fleetJsonPath, 'utf8');
  const fleet = JSON.parse(raw);

  if (!Array.isArray(fleet) || fleet.length !== 29) {
    throw new Error(`Fleet source must contain exactly 29 rows. Found: ${Array.isArray(fleet) ? fleet.length : 'invalid'}`);
  }

  const badSequence = fleet.findIndex((row, index) => row.srNo !== index + 1);
  if (badSequence !== -1) {
    throw new Error(`Fleet SR sequence invalid at index ${badSequence}. Expected srNo ${badSequence + 1}.`);
  }

  const expectedRows = fleet.map((row) => {
    const vehicleNumber = formatVehicleNumber(row.vehicleNumber);
    return {
      srNo: row.srNo,
      vehicleNumber,
      canonical: normalizeVehicleNumber(vehicleNumber),
      model: row.model,
      vehicleType: row.vehicleType,
      fuelType: row.fuelType || 'Diesel',
      capacity: row.capacity,
      status: 'Active',
    };
  });

  const expectedCanonicalSet = new Set(expectedRows.map((row) => row.canonical));
  if (expectedCanonicalSet.size !== 29) {
    throw new Error(`Fleet source has duplicate vehicle numbers after normalization. Unique=${expectedCanonicalSet.size}`);
  }

  const existing = await prisma.vehicle.findMany({
    select: {
      id: true,
      vehicleNo: true,
      model: true,
      name: true,
      type: true,
      fuelType: true,
      capacity: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const byCanonical = new Map();
  for (const vehicle of existing) {
    const key = normalizeVehicleNumber(vehicle.vehicleNo);
    if (!byCanonical.has(key)) {
      byCanonical.set(key, []);
    }
    byCanonical.get(key).push(vehicle);
  }

  const keepIds = new Set();
  let inserted = 0;
  let updated = 0;
  let deleted = 0;

  for (const row of expectedRows) {
    const candidates = byCanonical.get(row.canonical) || [];
    let keeper = candidates.find((v) => v.vehicleNo === row.vehicleNumber);

    if (!keeper && candidates.length > 0) {
      keeper = candidates[0];
    }

    if (!keeper) {
      const created = await prisma.vehicle.create({
        data: {
          vehicleNo: row.vehicleNumber,
          name: row.model,
          model: row.model,
          type: row.vehicleType,
          fuelType: row.fuelType,
          capacity: row.capacity,
          status: row.status,
        },
      });
      keepIds.add(created.id);
      inserted += 1;
      continue;
    }

    keepIds.add(keeper.id);

    const needsUpdate =
      keeper.vehicleNo !== row.vehicleNumber ||
      keeper.name !== row.model ||
      keeper.model !== row.model ||
      keeper.type !== row.vehicleType ||
      (keeper.fuelType || 'Diesel') !== row.fuelType ||
      (keeper.capacity || '') !== row.capacity ||
      (keeper.status || 'Active') !== row.status;

    if (needsUpdate) {
      await prisma.vehicle.update({
        where: { id: keeper.id },
        data: {
          vehicleNo: row.vehicleNumber,
          name: row.model,
          model: row.model,
          type: row.vehicleType,
          fuelType: row.fuelType,
          capacity: row.capacity,
          status: row.status,
        },
      });
      updated += 1;
    }

    for (const duplicate of candidates) {
      if (duplicate.id === keeper.id) {
        continue;
      }
      await prisma.vehicle.delete({ where: { id: duplicate.id } });
      deleted += 1;
    }
  }

  const afterSync = await prisma.vehicle.findMany({
    select: {
      id: true,
      vehicleNo: true,
    },
  });

  for (const vehicle of afterSync) {
    const canonical = normalizeVehicleNumber(vehicle.vehicleNo);
    if (!expectedCanonicalSet.has(canonical) || !keepIds.has(vehicle.id)) {
      await prisma.vehicle.delete({ where: { id: vehicle.id } });
      deleted += 1;
    }
  }

  const finalVehicles = await prisma.vehicle.findMany({
    select: { vehicleNo: true },
    orderBy: { createdAt: 'asc' },
  });

  if (finalVehicles.length !== 29) {
    throw new Error(`Vehicle count mismatch after reconciliation: ${finalVehicles.length} != 29`);
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        inserted,
        updated,
        deleted,
        finalCount: finalVehicles.length,
        vehicleNos: finalVehicles.map((v) => v.vehicleNo),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
