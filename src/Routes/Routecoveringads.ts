import express, { Router, Request, Response, NextFunction } from "express";
import { ControllercovringadsInstance } from "../Controlleur/Controllercovringads";
import { VerifierTokenInstance } from "../midlleware/VerifierToken";

const router: Router = express.Router();

class Routecoveringads {
    constructor() {
        this.initRoutes();
    }

    public getRouter(): Router {
        return router;
    }

    private initRoutes() {
        // Route pour créer une campagne publicitaire
        router.post('/create', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.paidcovering);

        // Route pour sauvegarder une campagne après paiement
        router.post('/save', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.savecovering);

        // Route pour récupérer les campagnes disponibles
        router.get('/available', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.getAvailableCampaigns);

        // Route pour qu'un taxi rejoigne une campagne
        router.post('/join/:campaignId', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.joinCampaign);

        // Route pour récupérer les campagnes d'un taxi
        router.get('/my-campaigns', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.getMyCampaigns);

        // Route pour quitter une campagne
        router.post('/leave/:campaignId', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.leaveCampaign);

        // Route pour signaler un problème
        router.post('/report/:campaignId', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.reportCampaignIssue);
        
        // Route pour les campagnes d'un créateur
        router.get('/creator-campaigns', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.getCampaignsByCreator);
        
        // Route pour déplacer les campagnes terminées vers l'historique
           // Route pour compléter automatiquement les campagnes expirées
   router.post('/complete-campaigns', VerifierTokenInstance.verifyToken, ControllercovringadsInstance.Capaigns_complete);

   // Route pour récupérer les campagnes disponibles
    }
}

export const RoutecoveringadsInstance = new Routecoveringads(); 