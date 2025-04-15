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
        router.get('/partenaire-reenvoyercode',ControllerpartenairInstance.verifyToken,ControllerpartenairInstance.renvoyeruncode);
        router.post('/partenaire-change-password',  ControllerpartenairInstance.changePassword);
        router.post('/partenaire/publicite/:nom_societe',ControllerpartenairInstance.verifyToken,ControllerpartenairInstance.createPubliciteetpay)
        //Crud avec token
        router.get('/partenaire/:id', ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.getPartenaireById);
        router.put('/partenaire/:id', ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.updatePartenaire);
        router.delete('/partenaire/:id', ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.deletePartenaire);
        router.get('/partenaires', ControllerpartenairInstance.verifyToken, ControllerpartenairInstance.getAllPartenaires);
        router.post('/completerpartenaire/:id',ControllerpartenairInstance.completerprofil);
        router.get('/partenaire/publicitaire/:id',ControllerpartenairInstance.verifyToken,ControllerpartenairInstance.pubetatchanger);

        router.post('/partenaire/publicite',ControllerpartenairInstance.verifyToken,ControllerpartenairInstance.Pubsauvgarde);

        //get User by token 
        router.get('/partenaire-by-token', ControllerpartenairInstance.getPartenaireByToken);


        router.post('/verifyTokenPartenaire', ControllerpartenairInstance.verifyToken, (req, res) => {
            console.log("verified")
            res.status(200).json({ message: 'Token valide' });
          });
    }

}
export default new Routepartenaire();