/// <reference types="jest" />
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/database';

describe('Trip Controller', () => {
  let vehicleId: string;
  let driverId: string;
  let customerId: string;

  beforeEach(async () => {
    // Clear database
    await prisma.trip.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.customer.deleteMany();

    // Create test data
    const vehicleRes = await request(app)
      .post('/api/vehicles')
      .send({
        vehicleNo: 'TRK-001',
        name: 'Test Truck',
        type: 'Heavy Truck',
        model: 'Tata Prima',
        capacity: '40 tons',
        fuelType: 'Diesel',
      });
    vehicleId = vehicleRes.body.data.id;

    const driverRes = await request(app)
      .post('/api/drivers')
      .send({
        name: 'John Doe',
        phone: '+91 98765 43210',
        license: 'DL-1234567890',
      });
    driverId = driverRes.body.data.id;

    const customerRes = await request(app)
      .post('/api/customers')
      .send({
        name: 'ABC Corp',
        email: 'abc@example.com',
      });
    customerId = customerRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/trips', () => {
    it('should create a trip successfully', async () => {
      const tripData = {
        vehicleId,
        driverId,
        customerId,
        route: 'Mumbai → Delhi',
        distance: '1400 km',
        startDate: new Date().toISOString(),
        revenue: 25000,
        expense: 16500,
      };

      const response = await request(app)
        .post('/api/trips')
        .send(tripData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('Planned');
      expect(response.body.data.profit).toBe(8500);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/trips')
        .send({
          vehicleId,
          driverId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .post('/api/trips')
        .send({
          vehicleId: 'non-existent',
          driverId,
          startDate: new Date().toISOString(),
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/trips', () => {
    it('should get all trips', async () => {
      const tripData = {
        vehicleId,
        driverId,
        startDate: new Date().toISOString(),
      };

      await request(app).post('/api/trips').send(tripData);

      const response = await request(app)
        .get('/api/trips')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trips.length).toBeGreaterThan(0);
    });

    it('should filter trips by status', async () => {
      const tripData = {
        vehicleId,
        driverId,
        startDate: new Date().toISOString(),
        status: 'Completed',
      };

      await request(app).post('/api/trips').send(tripData);

      const response = await request(app)
        .get('/api/trips?status=Completed')
        .expect(200);

      expect(response.body.data.trips[0].status).toBe('Completed');
    });
  });

  describe('PUT /api/trips/:id', () => {
    it('should update trip successfully', async () => {
      const tripData = {
        vehicleId,
        driverId,
        startDate: new Date().toISOString(),
      };

      const createRes = await request(app)
        .post('/api/trips')
        .send(tripData);

      const tripId = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/trips/${tripId}`)
        .send({ status: 'Running', revenue: 30000 })
        .expect(200);

      expect(updateRes.body.data.status).toBe('Running');
      expect(updateRes.body.data.revenue).toBe(30000);
    });
  });

  describe('DELETE /api/trips/:id', () => {
    it('should delete trip successfully', async () => {
      const tripData = {
        vehicleId,
        driverId,
        startDate: new Date().toISOString(),
      };

      const createRes = await request(app)
        .post('/api/trips')
        .send(tripData);

      const tripId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/trips/${tripId}`)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);
    });
  });
});
