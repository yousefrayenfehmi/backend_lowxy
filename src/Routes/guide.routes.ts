import express from 'express';
import { GuideIAControllerInstance } from '../Controlleur/GuideIAController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Routes protégées par l'authentification
router.use(authMiddleware);

// Routes du guide IA
router.post('/session/demarrer', GuideIAControllerInstance.demarrerSession);
router.post('/session/terminer', GuideIAControllerInstance.terminerSession);
router.post('/guide/live', GuideIAControllerInstance.guideLive);
router.post('/guide/trajet', GuideIAControllerInstance.guideTrajet);
router.put('/preferences', GuideIAControllerInstance.mettreAJourPreferences);
router.get('/responses', GuideIAControllerInstance.getGuideResponses);

export default router; 