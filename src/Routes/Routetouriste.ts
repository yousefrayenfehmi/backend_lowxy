import express, { Router, Request, Response, NextFunction }  from "express";
import { controllerclientInstance } from "../Controlleur/Controllerclient";
import passport, { Passport } from "passport";
import { controllerVilleArticleInstance } from "../Controlleur/Controllervillearticle";
import Fonction from "../fonction/Fonction";
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
        router.get('/touriste-reenvoyercode',controllerclientInstance.verifyToken,controllerclientInstance.renvoyeruncode);
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
        router.get('/touristes/auth/google',
            passport.authenticate('google-touriste'));
          
          router.get('/auth/google/callback', 
            passport.authenticate('google-touriste', { failureRedirect: '/login' }),
            (req: express.Request, res: express.Response) => {
              if(req.user){
                const touriste = req.user as any
                console.log("touristes+=>"+touriste);
                
                const token = Fonction.createtokenetcookies(res, touriste._id);
                res.json({
                    message: "Authentication successful",
                    user: touriste,
                    token: token // Envoyer aussi le token si nécessaire côté client
                });
        
              }else{
                res.status(401).json({ message: 'Authentication failed' });

              }


              
            });




            router.get('/touriste/auth/facebook',
              passport.authenticate('facebook', controllerclientInstance.facebookStrategy)
          );
          
          router.get('/auth/facebook/callback',
              passport.authenticate('facebook', { 
                  failureRedirect: '/login' 
              }),
              (req, res) => {
                  // Redirection réussie
                  res.status(201).json({ success: true });
              }
          );

    }

    
}

export default new Routetouriste();