import { Router } from 'express';
import DebateController from '../controllers/DebateController';

const router = Router();

// Debate session routes
router.post('/sessions', DebateController.createSession);
router.get('/sessions', DebateController.getSessions);
router.get('/sessions/:id', DebateController.getSession);
router.post('/sessions/:id/start', DebateController.startSession);
router.post('/sessions/:id/pause', DebateController.pauseSession);
router.post('/sessions/:id/stop', DebateController.stopSession);
router.get('/sessions/:id/messages', DebateController.getMessages);
router.get('/sessions/:id/scores', DebateController.getScores);
router.get('/sessions/:id/export', DebateController.exportSession);

export default router;