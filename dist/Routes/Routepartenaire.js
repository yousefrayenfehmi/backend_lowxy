"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Controllerpartenaire_1 = require("../Controlleur/Controllerpartenaire");
const ControllerConfigpublicite_1 = require("../Controlleur/ControllerConfigpublicite");
const router = express_1.default.Router();
class Routepartenaire {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Routes d'authentification
        router.post('/partenaire/login', Controllerpartenaire_1.ControllerpartenairInstance.login);
        router.post('/partenaire/register', Controllerpartenaire_1.ControllerpartenairInstance.Signup);
        router.post('/partenaire/forgetpassword', Controllerpartenaire_1.ControllerpartenairInstance.forgetpassword);
        router.post('/partenaire/resetpassword/:token', Controllerpartenaire_1.ControllerpartenairInstance.resetpassword);
        router.get('/partenaire/logout', Controllerpartenaire_1.ControllerpartenairInstance.logout);
        router.post('/partenaire-verifier-email', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.VeriffieEmail);
        router.get('/partenaire-reenvoyercode', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.renvoyeruncode);
        router.post('/partenaire-change-password', Controllerpartenaire_1.ControllerpartenairInstance.changePassword);
        router.post('/partenaire/campagne/:nom_societe', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.createPubliciteetpay);
        //Crud avec token
        router.get('/partenaire/:id', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.getPartenaireById);
        router.put('/partenaire/:id', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.updatePartenaire);
        router.delete('/partenaire/:id', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.deletePartenaire);
        router.get('/partenaires', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.getAllPartenaires);
        router.post('/completerpartenaire', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.completerprofil);
        router.get('/partenaire/publicitaire/:id', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.pubetatchanger);
        router.post('/partenaire/publicite', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.Pubsauvgarde);
        router.post('/partenaire/covering_ads/:nom_societe', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.createcovering);
        //get User by token 
        router.get('/partenaire-by-token', Controllerpartenaire_1.ControllerpartenairInstance.getPartenaireByToken);
        router.post('/partenaire/coveringsaved', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.covringsave);
        router.get('/partenaire/quizzes/active', Controllerpartenaire_1.ControllerpartenairInstance.getpubAllquizvalide);
        router.post('/verifyTokenPartenaire', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, (req, res) => {
            console.log("verified");
            res.status(200).json({ message: 'Token valide' });
        });
        router.post('/partenaire/statistiques', Controllerpartenaire_1.ControllerpartenairInstance.enregisterstatistiques);
        router.get('/partenaire-config-publicite', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, ControllerConfigpublicite_1.ControllerConfigpubliciteInstance.getConfiguration);
    }
}
exports.default = new Routepartenaire();
