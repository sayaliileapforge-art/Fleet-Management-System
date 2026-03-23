/// <reference types="jest" />
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/database';

describe('Expense Controller', () => {
  let vehicleId: string;
  let tripId: string;

  beforeEach(async () => {
    // Clear database
    await prisma.expense.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.vehicle.deleteMany();

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
    const driverId = driverRes.body.data.id;

    const tripRes = await request(app)
      .post('/api/trips')
      .send({
        vehicleId,
        driverId,
        startDate: new Date().toISOString(),
      });
    tripId = tripRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/expenses', () => {
    it('should create an expense successfully', async () => {
      const expenseData = {
        vehicleId,
        tripId,
        category: 'Fuel',
        amount: 5000,
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.category).toBe('Fuel');
      expect(response.body.data.amount).toBe(5000);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          vehicleId,
          category: 'Fuel',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          vehicleId: 'non-existent',
          category: 'Fuel',
          amount: 5000,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/expenses', () => {
    it('should get all expenses', async () => {
      const expenseData = {
        vehicleId,
        category: 'Fuel',
        amount: 5000,
      };

      await request(app).post('/api/expenses').send(expenseData);

      const response = await request(app)
        .get('/api/expenses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expenses.length).toBeGreaterThan(0);
    });

    it('should filter expenses by category', async () => {
      const expenseData = {
        vehicleId,
        category: 'Maintenance',
        amount: 8000,
      };

      await request(app).post('/api/expenses').send(expenseData);

      const response = await request(app)
        .get('/api/expenses?category=Maintenance')
        .expect(200);

      expect(response.body.data.expenses[0].category).toBe('Maintenance');
    });
  });

  describe('PUT /api/expenses/:id', () => {
    it('should update expense successfully', async () => {
      const expenseData = {
        vehicleId,
        category: 'Fuel',
        amount: 5000,
      };

      const createRes = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      const expenseId = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .send({ amount: 6000 })
        .expect(200);

      expect(updateRes.body.data.amount).toBe(6000);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    it('should delete expense successfully', async () => {
      const expenseData = {
        vehicleId,
        category: 'Fuel',
        amount: 5000,
      };

      const createRes = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      const expenseId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);
    });
  });
});
