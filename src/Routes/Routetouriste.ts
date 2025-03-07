import express, { Router, Request, Response, NextFunction }  from "express";
import { controllerclientInstance } from "../Controlleur/Controllerclient";
import passport, { Passport } from "passport";
import { controllerVilleArticleInstance } from "../Controlleur/Controllervillearticle";
import Fonction from "../fonction/Fonction";
import verifyToken from "../midlleware/VerifierToken";
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
        router.get('/touriste/logout', controllerclientInstance.logout);
        router.post('/touriste-verifier-email',controllerclientInstance.verifyToken ,controllerclientInstance.VeriffieEmail);
        //Crud avec token
        router.get('/touriste/:id', controllerclientInstance.verifyToken, controllerclientInstance.getTouristeById);
        router.put('/touriste/:id', controllerclientInstance.verifyToken, controllerclientInstance.updateTouriste);
        router.delete('/touriste/:id', controllerclientInstance.verifyToken, controllerclientInstance.deleteTouriste);
        router.get('/touristes', controllerclientInstance.verifyToken, controllerclientInstance.getAllTouristes);
        router.get('/touristecherche/:ville',controllerclientInstance.verifyToken,controllerVilleArticleInstance.getVilleArticleByLocalitation)
        //google authentification
        router.post('/verifyToken',verifyToken);
        //get User by token 
        router.get('/touriste-by-token', controllerclientInstance.getTouristeByToken);



          
    }

    
}

export default new Routetouriste();