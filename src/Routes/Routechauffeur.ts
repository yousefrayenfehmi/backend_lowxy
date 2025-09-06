import express, { Router, Request, Response, NextFunction }  from "express";
import { controllerchauffeurInstance } from "../Controlleur/Controllerchauffeur";
import passport from "passport";
import Fonction from "../fonction/Fonction";
import { chauffeurDocumentController } from "../Controlleur/ChauffeurDocumentController";
import { controllerclientInstance } from "../Controlleur/Controllerclient";
const router: Router = express.Router();

class Routechauffeur {
    constructor() {
        this.initRoutes();
    }
    public getRouter(): Router {
        return router;
    }

    private initRoutes() {
        // Routes d'authentification
        router.post('/chauffeur/login', controllerchauffeurInstance.login);
        router.post('/chauffeur/register', controllerchauffeurInstance.Signup);
        router.post('/chauffeur/forgetpassword', controllerchauffeurInstance.forgetpassword);
        router.post('/chauffeur/resetpassword/:token', controllerchauffeurInstance.resetpassword);
        router.get('/chauffeur/logout', controllerchauffeurInstance.logout);
        router.post('/chauffeur-verifier-email',controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.VeriffieEmail);
        router.get('/chauffeur-reenvoyercode',controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.renvoyeruncode);
        router.post('/chauffeur/auth/google',controllerchauffeurInstance.authavecgoogle)        
        router.post('/chauffeur/auth/facebook',controllerchauffeurInstance.authavecfacebook)
        router.post('/chauffeur-change-password',  controllerchauffeurInstance.changePassword);
        router.get('/chauffeur-get-all-touriste',controllerchauffeurInstance.verifyToken,controllerclientInstance.getAllTouristes);
        //Crud avec token
        router.get('/chauffeurs', controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.getAllChauffeurs);
        router.get('/chauffeur/:id', controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.getChauffeurById);
        router.put('/chauffeur/:id', controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.updateChauffeur);
        router.delete('/chauffeur/:id', controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.deleteChauffeur);
        router.post('/completerchauffeur',controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.completerprofil);

         //get User by token 
         router.get('/chauffeur-by-token', controllerchauffeurInstance.getChauffeurByToken);

        router.get('/chauffeur-statestique',controllerchauffeurInstance.verifyToken,controllerclientInstance.getTouristebymoth);         

         router.post('/verifyTokenChauffeur', controllerchauffeurInstance.verifyToken, (req, res) => {
            console.log("verified")
            res.status(200).json({ message: 'Token valide' });
          });
         
          
        router.post('/chauffeur/:id/documents/permis', 
        controllerchauffeurInstance.verifyToken, 
        chauffeurDocumentController.uploadDocument('permis')
        );
        router.post('/chauffeur/:id/documents/assurance', 
            controllerchauffeurInstance.verifyToken, 
            chauffeurDocumentController.uploadDocument('assurance')
        );
        router.post('/chauffeur/:id/documents/carte_taxi', 
            controllerchauffeurInstance.verifyToken, 
            chauffeurDocumentController.uploadDocument('carte_taxi')
        );

        // Récupérer un document
        router.get('/chauffeur/:id/documents/:docType', 
            controllerchauffeurInstance.verifyToken, 
            chauffeurDocumentController.getDocument
        );

        // Supprimer un document
        router.delete('/chauffeur/:id/documents/:docType', 
            controllerchauffeurInstance.verifyToken, 
            chauffeurDocumentController.removeDocument
        );


    }

    
}

export default new Routechauffeur();