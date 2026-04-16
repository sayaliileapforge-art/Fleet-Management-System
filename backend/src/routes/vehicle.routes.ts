import { Router } from 'express';
import {
  createVehicle,
  createVehiclesBulk,
  importFleetVehicles2025To2026,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicle.controller';

const router = Router();

router.post('/', createVehicle);
router.post('/bulk', createVehiclesBulk);
router.post('/bulk/fleet-2025-2026', importFleetVehicles2025To2026);
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
