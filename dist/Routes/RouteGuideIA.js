"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// RouteGuideIA.ts
const express_1 = __importDefault(require("express"));
const GuideIAController_1 = require("../Controlleur/GuideIAController");
const Controllerclient_1 = require("../Controlleur/Controllerclient");
const router = express_1.default.Router();
class RouteGuideIA {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Routes du guide IA (protégées par authentification)
        router.get('/guide/responses', Controllerclient_1.controllerclientInstance.verifyToken, GuideIAController_1.GuideIAControllerInstance.getGuideResponses);
        router.post('/session/demarrer', Controllerclient_1.controllerclientInstance.verifyToken, GuideIAController_1.GuideIAControllerInstance.demarrerSession);
        router.post('/session/terminer', Controllerclient_1.controllerclientInstance.verifyToken, GuideIAController_1.GuideIAControllerInstance.terminerSession);
        router.post('/guide/live', Controllerclient_1.controllerclientInstance.verifyToken, GuideIAController_1.GuideIAControllerInstance.guideLive);
        router.post('/guide/trajet', Controllerclient_1.controllerclientInstance.verifyToken, GuideIAController_1.GuideIAControllerInstance.guideTrajet);
        router.put('/preferences', Controllerclient_1.controllerclientInstance.verifyToken, GuideIAController_1.GuideIAControllerInstance.mettreAJourPreferences);
    }
}
exports.default = new RouteGuideIA();
