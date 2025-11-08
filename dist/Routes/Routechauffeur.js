"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Controllerchauffeur_1 = require("../Controlleur/Controllerchauffeur");
const ChauffeurDocumentController_1 = require("../Controlleur/ChauffeurDocumentController");
const Controllerclient_1 = require("../Controlleur/Controllerclient");
const router = express_1.default.Router();
class Routechauffeur {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Routes d'authentification
        router.post('/chauffeur/login', Controllerchauffeur_1.controllerchauffeurInstance.login);
        router.post('/chauffeur/register', Controllerchauffeur_1.controllerchauffeurInstance.Signup);
        router.post('/chauffeur/forgetpassword', Controllerchauffeur_1.controllerchauffeurInstance.forgetpassword);
        router.post('/chauffeur/resetpassword/:token', Controllerchauffeur_1.controllerchauffeurInstance.resetpassword);
        router.get('/chauffeur/logout', Controllerchauffeur_1.controllerchauffeurInstance.logout);
        router.post('/chauffeur-verifier-email', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.VeriffieEmail);
        router.get('/chauffeur-reenvoyercode', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.renvoyeruncode);
        router.post('/chauffeur/auth/google', Controllerchauffeur_1.controllerchauffeurInstance.authavecgoogle);
        router.post('/chauffeur/auth/facebook', Controllerchauffeur_1.controllerchauffeurInstance.authavecfacebook);
        router.post('/chauffeur-change-password', Controllerchauffeur_1.controllerchauffeurInstance.changePassword);
        router.get('/chauffeur-get-all-touriste', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerclient_1.controllerclientInstance.getAllTouristes);
        //Crud avec token
        router.get('/chauffeurs', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.getAllChauffeurs);
        router.get('/chauffeur/:id', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.getChauffeurById);
        router.put('/chauffeur/:id', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.updateChauffeur);
        router.delete('/chauffeur/:id', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.deleteChauffeur);
        router.post('/completerchauffeur', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.completerprofil);
        //get User by token 
        router.get('/chauffeur-by-token', Controllerchauffeur_1.controllerchauffeurInstance.getChauffeurByToken);
        router.get('/chauffeur-statestique', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, Controllerclient_1.controllerclientInstance.getTouristebymoth);
        router.post('/verifyTokenChauffeur', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, (req, res) => {
            console.log("verified");
            res.status(200).json({ message: 'Token valide' });
        });
        router.post('/chauffeur/:id/documents/permis', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, ChauffeurDocumentController_1.chauffeurDocumentController.uploadDocument('permis'));
        router.post('/chauffeur/:id/documents/assurance', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, ChauffeurDocumentController_1.chauffeurDocumentController.uploadDocument('assurance'));
        router.post('/chauffeur/:id/documents/carte_taxi', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, ChauffeurDocumentController_1.chauffeurDocumentController.uploadDocument('carte_taxi'));
        // Récupérer un document
        router.get('/chauffeur/:id/documents/:docType', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, ChauffeurDocumentController_1.chauffeurDocumentController.getDocument);
        // Supprimer un document
        router.delete('/chauffeur/:id/documents/:docType', Controllerchauffeur_1.controllerchauffeurInstance.verifyToken, ChauffeurDocumentController_1.chauffeurDocumentController.removeDocument);
    }
}
exports.default = new Routechauffeur();
