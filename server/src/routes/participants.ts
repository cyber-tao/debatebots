import { Router } from 'express';
import ParticipantController from '../controllers/ParticipantController';

const router = Router();

// AI Participants routes
router.post('/participants', ParticipantController.createParticipant);
router.get('/participants', ParticipantController.getParticipants);
router.put('/participants/:id', ParticipantController.updateParticipant);
router.delete('/participants/:id', ParticipantController.deleteParticipant);

// Judges routes
router.post('/judges', ParticipantController.createJudge);
router.get('/judges', ParticipantController.getJudges);
router.put('/judges/:id', ParticipantController.updateJudge);
router.delete('/judges/:id', ParticipantController.deleteJudge);

export default router;