"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const GuideIAController_1 = require("../Controlleur/GuideIAController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Routes protégées par l'authentification
router.use(auth_1.authMiddleware);
// Routes du guide IA
router.post('/session/demarrer', GuideIAController_1.GuideIAControllerInstance.demarrerSession);
router.post('/session/terminer', GuideIAController_1.GuideIAControllerInstance.terminerSession);
router.post('/guide/live', GuideIAController_1.GuideIAControllerInstance.guideLive);
router.post('/guide/trajet', GuideIAController_1.GuideIAControllerInstance.guideTrajet);
router.put('/preferences', GuideIAController_1.GuideIAControllerInstance.mettreAJourPreferences);
router.get('/responses', GuideIAController_1.GuideIAControllerInstance.getGuideResponses);
exports.default = router;
