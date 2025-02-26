import express, { Router, Request, Response, NextFunction }  from "express";
import { ControllerpartenairInstance} from "../Controlleur/Controllerpartenaire"; 
const router: Router = express.Router();

 class Routepartenaire{
    constructor(){
        this.initRoutes();

    }
    public getRouter(): Router{
        return router;
    }
    private initRoutes(){
        // Routes d'authentification
        router.post('/partenaire/login', ControllerpartenairInstance.login);
        router.post('/partenaire/register', ControllerpartenairInstance.Signup);
        router.post('/partenaire/forgetpassword', ControllerpartenairInstance.forgetpassword);
        router.post('/partenaire/resetpassword/:token', ControllerpartenairInstance.resetpassword);
        router.get('/partenaire/logout', ControllerpartenairInstance.logout);
        router.post('/partenaire-verifier-email',ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.VeriffieEmail);
        router.get('/admin-reenvoyercode',ControllerpartenairInstance.verifyToken,ControllerpartenairInstance.renvoyeruncode);

        //Crud avec token
        router.get('/partenaire/:id', ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.getPartenaireById);
        router.put('/partenaire/:id', ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.updatePartenaire);
        router.delete('/partenaire/:id', ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.deletePartenaire);
        router.get('/partenaires', ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.getAllPartenaires);
        

    }

}
export default new Routepartenaire();