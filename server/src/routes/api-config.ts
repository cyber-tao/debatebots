import { Router } from 'express';
import ApiConfigController from '../controllers/ApiConfigController';

const router = Router();

// API Config routes
router.post('/configs', ApiConfigController.createConfig);
router.get('/configs', ApiConfigController.getConfigs);
router.get('/configs/:id', ApiConfigController.getConfig);
router.put('/configs/:id', ApiConfigController.updateConfig);
router.delete('/configs/:id', ApiConfigController.deleteConfig);

export default router;