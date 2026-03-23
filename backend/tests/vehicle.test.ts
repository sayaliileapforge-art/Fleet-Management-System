/// <reference types="jest" />
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/database';

describe('Vehicle Controller', () => {
  beforeEach(async () => {
    // Clear database before each test
    await prisma.trip.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.vehicle.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/vehicles', () => {
    it('should create a vehicle successfully', async () => {
      const vehicleData = {
        vehicleNo: 'TRK-001',
        name: 'Test Truck',
        type: 'Heavy Truck',
        model: 'Tata Prima',
        capacity: '40 tons',
        fuelType: 'Diesel',
      };

      const response = await request(app)
        .post('/api/vehicles')
        .send(vehicleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.vehicleNo).toBe(vehicleData.vehicleNo);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send({
          vehicleNo: 'TRK-001',
          name: 'Test Truck',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 409 for duplicate vehicle number', async () => {
      const vehicleData = {
        vehicleNo: 'TRK-001',
        name: 'Test Truck',
        type: 'Heavy Truck',
        model: 'Tata Prima',
        capacity: '40 tons',
        fuelType: 'Diesel',
      };

      // Create first vehicle
      await request(app).post('/api/vehicles').send(vehicleData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/vehicles')
        .send(vehicleData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/vehicles', () => {
    it('should get all vehicles', async () => {
      const vehicleData = {
        vehicleNo: 'TRK-001',
        name: 'Test Truck',
        type: 'Heavy Truck',
        model: 'Tata Prima',
        capacity: '40 tons',
        fuelType: 'Diesel',
      };

      await request(app).post('/api/vehicles').send(vehicleData);

      const response = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicles).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter vehicles by status', async () => {
      const vehicleData = {
        vehicleNo: 'TRK-001',
        name: 'Test Truck',
        type: 'Heavy Truck',
        model: 'Tata Prima',
        capacity: '40 tons',
        fuelType: 'Diesel',
        status: 'Maintenance',
      };

      await request(app).post('/api/vehicles').send(vehicleData);

      const response = await request(app)
        .get('/api/vehicles?status=Maintenance')
        .expect(200);

      expect(response.body.data.vehicles).toHaveLength(1);
      expect(response.body.data.vehicles[0].status).toBe('Maintenance');
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('should get vehicle by id', async () => {
      const vehicleData = {
        vehicleNo: 'TRK-001',
        name: 'Test Truck',
        type: 'Heavy Truck',
        model: 'Tata Prima',
        capacity: '40 tons',
        fuelType: 'Diesel',
      };

      const createResponse = await request(app)
        .post('/api/vehicles')
        .send(vehicleData);

      const vehicleId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(vehicleId);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/vehicles/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('should update vehicle successfully', async () => {
      const vehicleData = {
        vehicleNo: 'TRK-001',
        name: 'Test Truck',
        type: 'Heavy Truck',
        model: 'Tata Prima',
        capacity: '40 tons',
        fuelType: 'Diesel',
      };

      const createResponse = await request(app)
        .post('/api/vehicles')
        .send(vehicleData);

      const vehicleId = createResponse.body.data.id;

      const updateResponse = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .send({ status: 'Maintenance', name: 'Updated Truck' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.status).toBe('Maintenance');
      expect(updateResponse.body.data.name).toBe('Updated Truck');
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('should delete vehicle successfully', async () => {
      const vehicleData = {
        vehicleNo: 'TRK-001',
        name: 'Test Truck',
        type: 'Heavy Truck',
        model: 'Tata Prima',
        capacity: '40 tons',
        fuelType: 'Diesel',
      };

      const createResponse = await request(app)
        .post('/api/vehicles')
        .send(vehicleData);

      const vehicleId = createResponse.body.data.id;

      const deleteResponse = await request(app)
        .delete(`/api/vehicles/${vehicleId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify deletion
      await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .expect(404);
    });
  });
});
