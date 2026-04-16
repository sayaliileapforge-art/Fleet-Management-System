export interface FleetVehicle {
  vehicleNumber: string;
  model: string;
  vehicleType: string;
  fuelType: string;
  capacity: string;
  status: string;
}

export interface FleetVehicleParseError {
  index: number;
  reason: string;
  raw: unknown;
}

export interface FleetVehicleParseResult {
  vehicles: FleetVehicle[];
  invalidEntries: FleetVehicleParseError[];
}

export interface RawFleetRow {
  vehicleNumber?: unknown;
  vehicleNo?: unknown;
  rcNo?: unknown;
  rc_no?: unknown;
  ['RC NO']?: unknown;
  model?: unknown;
  asset?: unknown;
  ['ASSET']?: unknown;
  type?: unknown;
  vehicleType?: unknown;
  bodyType?: unknown;
  ['BODY TYPE']?: unknown;
  fuelType?: unknown;
  fuelMarker?: unknown;
  capacity?: unknown;
  status?: unknown;
}

const sanitize = (value: unknown): string => String(value ?? '').trim().replace(/\s+/g, ' ');

const toProperText = (value: string): string => {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => {
      if (/^[0-9]+$/.test(part)) {
        return part;
      }

      if (/^[A-Z]{1,3}[0-9]*$/.test(part)) {
        return part.toUpperCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
};

export const normalizeVehicleNumber = (value: unknown): string =>
  sanitize(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const mapVehicleType = (value: unknown): string => {
  const bodyType = sanitize(value).toUpperCase();

  if (bodyType === 'GOODS') {
    return 'Heavy Truck';
  }

  if (bodyType === 'MACHINE') {
    return 'Machine';
  }

  return sanitize(value);
};

const resolveFuelType = (rawVehicleNo: string, rawFuelType: string, rawFuelMarker: string): string => {
  const combinedForElectric = `${rawVehicleNo} ${rawFuelType}`.toUpperCase();

  if (combinedForElectric.includes('ELECTRICAL VEHICLES')) {
    return 'Electric';
  }

  if (combinedForElectric.includes('BATTERY FORKLIFT')) {
    return 'Electric';
  }

  if (rawFuelMarker.toUpperCase() === 'D') {
    return 'Diesel';
  }

  if (rawFuelType) {
    return toProperText(rawFuelType);
  }

  return 'Unknown';
};

const resolveCapacity = (vehicleType: string, rawCapacity: string): string => {
  if (rawCapacity) {
    return rawCapacity;
  }

  if (vehicleType === 'Heavy Truck') {
    return '40 tons';
  }

  if (vehicleType === 'Machine') {
    return 'N/A';
  }

  return 'N/A';
};

export const mapRawFleetRowToVehicle = (row: RawFleetRow): { vehicle?: FleetVehicle; reason?: string } => {
  const rawVehicleNo = sanitize(row.vehicleNumber ?? row.vehicleNo ?? row.rcNo ?? row.rc_no ?? row['RC NO']);
  const rawModel = toProperText(sanitize(row.model ?? row.asset ?? row['ASSET']));
  const rawBodyType = sanitize(row.vehicleType ?? row.type ?? row.bodyType ?? row['BODY TYPE']);
  const rawFuelType = sanitize(row.fuelType);
  const rawFuelMarker = sanitize(row.fuelMarker);

  const vehicleNumber = normalizeVehicleNumber(rawVehicleNo);
  const vehicleType = mapVehicleType(rawBodyType);
  const fuelType = resolveFuelType(rawVehicleNo, rawFuelType, rawFuelMarker);
  const capacity = resolveCapacity(vehicleType, sanitize(row.capacity));
  const status = sanitize(row.status) || 'Active';

  if (!vehicleNumber) {
    return { reason: 'Missing or invalid RC NO/vehicle number' };
  }

  if (!rawModel) {
    return { reason: 'Missing model/ASSET' };
  }

  if (vehicleType !== 'Heavy Truck' && vehicleType !== 'Machine') {
    return { reason: `Unsupported BODY TYPE: ${rawBodyType || 'empty'}` };
  }

  return {
    vehicle: {
      vehicleNumber,
      model: rawModel,
      vehicleType,
      fuelType,
      capacity,
      status,
    },
  };
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const escapedQuote = inQuotes && line[i + 1] === '"';
      if (escapedQuote) {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

export const convertRawTextOrCsvToFleetVehicles = (rawText: string): FleetVehicleParseResult => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      vehicles: [],
      invalidEntries: [
        {
          index: 0,
          reason: 'Raw text/CSV must include header row and at least one data row',
          raw: rawText,
        },
      ],
    };
  }

  const headers = parseCsvLine(lines[0]);
  const vehicles: FleetVehicle[] = [];
  const invalidEntries: FleetVehicleParseError[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const rowValues = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = rowValues[index] ?? '';
    });

    const { vehicle, reason } = mapRawFleetRowToVehicle(row);

    if (!vehicle) {
      invalidEntries.push({
        index: i,
        reason: reason || 'Invalid row',
        raw: row,
      });
      continue;
    }

    vehicles.push(vehicle);
  }

  return { vehicles, invalidEntries };
};
