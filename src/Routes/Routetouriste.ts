import express, { Router, Request, Response, NextFunction }  from "express";
import { controllerclientInstance } from "../Controlleur/Controllerclient";
import passport, { Passport } from "passport";
import { controllerVilleArticleInstance } from "../Controlleur/Controllervillearticle";
import Fonction from "../fonction/Fonction";
import { VerifierTokenInstance } from "../midlleware/VerifierToken";
import { controllerchauffeurInstance } from "../Controlleur/Controllerchauffeur";
const router: Router = express.Router();
class Routetouriste {
    constructor() {
        this.initRoutes();
    }
    public getRouter(): Router {
        return router;
    }
    private initRoutes() {
        // Routes d'authentification
        router.post('/touriste/login', controllerclientInstance.login);
        router.post('/touriste/register', async (req: Request, res: Response) => {
          await controllerclientInstance.Signup(req, res);
        });
        router.post('/touriste/auth/google',controllerclientInstance.authavecgoogle)  
        router.post('/touriste/auth/facebook',controllerclientInstance.authavecfacebook)      
        router.get('/touriste-reenvoyercode',controllerclientInstance.verifyToken,controllerclientInstance.reenvoyeruncode);
        router.post('/touriste/forgetpassword', controllerclientInstance.forgetpassword);
        router.post('/touriste/resetpassword/:token', controllerclientInstance.resetpassword);
        router.post('/touriste-change-password',  controllerclientInstance.changePassword);

        router.get('/touriste/logout', controllerclientInstance.logout);
        router.post('/touriste-verifier-email',controllerclientInstance.verifyToken ,controllerclientInstance.VeriffieEmail);
        //Crud avec token
        router.get('/touriste/:id', controllerclientInstance.verifyToken, controllerclientInstance.getTouristeById);
        router.put('/touriste/:id', controllerclientInstance.verifyToken, controllerclientInstance.updateTouriste);
        router.delete('/touriste/:id', controllerclientInstance.verifyToken, controllerclientInstance.deleteTouriste);
        router.get('/touristes', controllerclientInstance.verifyToken, controllerclientInstance.getAllTouristes);
        router.get('/touristecherche/:ville',controllerVilleArticleInstance.getVilleArticleByLocalitation)
        //google authentification
        router.post('/verifyToken',controllerclientInstance.verifyToken);
        //get User by token 
        router.get('/touriste-by-token', controllerclientInstance.getTouristeByToken);
        router.post('/completertouriste',controllerclientInstance.verifyToken,controllerclientInstance.completerprofil);
        router.post('/touriste/uploadfacture', controllerclientInstance.verifyToken, controllerclientInstance.uploadfacture);
        router.post('/touriste/verifierchauffeur',controllerclientInstance.verifyToken,controllerchauffeurInstance.verifierchauffeur);
        //get User by token
        router.get('/verifyTokenTous', VerifierTokenInstance.getUser);
        router.post('/verifyTokenTouriste', controllerclientInstance.verifyToken, (req: Request, res: Response) => {
            // Retourner l'objet touriste stocké lors de la vérification du token
            res.status(200).json({ 
                success: true,
                user:'Touriste',
                message: 'Token valide',
                touriste: (req as any).touriste 
            });
        });
          
    }

    
}

export default new Routetouriste();