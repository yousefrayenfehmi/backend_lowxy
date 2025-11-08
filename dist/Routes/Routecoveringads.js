"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutecoveringadsInstance = void 0;
const express_1 = __importDefault(require("express"));
const Controllercovringads_1 = require("../Controlleur/Controllercovringads");
const VerifierToken_1 = require("../midlleware/VerifierToken");
const router = express_1.default.Router();
class Routecoveringads {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Route pour créer une campagne publicitaire
        router.post('/create', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.paidcovering);
        // Route pour sauvegarder une campagne après paiement
        router.post('/save', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.savecovering);
        // Route pour récupérer les campagnes disponibles
        router.get('/available', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.getAvailableCampaigns);
        // Route pour qu'un taxi rejoigne une campagne
        router.post('/join/:campaignId', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.joinCampaign);
        // Route pour récupérer les campagnes d'un taxi
        router.get('/my-campaigns', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.getMyCampaigns);
        // Route pour quitter une campagne
        router.post('/leave/:campaignId', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.leaveCampaign);
        // Route pour signaler un problème
        router.post('/report/:campaignId', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.reportCampaignIssue);
        // Route pour les campagnes d'un créateur
        router.get('/creator-campaigns', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.getCampaignsByCreator);
        // Route pour déplacer les campagnes terminées vers l'historique
        // Route pour compléter automatiquement les campagnes expirées
        router.post('/complete-campaigns', VerifierToken_1.VerifierTokenInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.Capaigns_complete);
        // Route pour récupérer les campagnes disponibles
    }
}
exports.RoutecoveringadsInstance = new Routecoveringads();
