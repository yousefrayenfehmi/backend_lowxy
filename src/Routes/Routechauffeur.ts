import express, { Router, Request, Response, NextFunction }  from "express";
import { controllerchauffeurInstance } from "../Controlleur/Controllerchauffeur";
import passport from "passport";
import Fonction from "../fonction/Fonction";
import '../fonction/Strategy'
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
        router.get('/admin-reenvoyercode',controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.renvoyeruncode);
        
        //Crud avec token
        router.get('/chauffeurs', controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.getAllChauffeurs);
        router.get('/chauffeur/:id', controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.getChauffeurById);
        router.put('/chauffeur/:id', controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.updateChauffeur);
        router.delete('/chauffeur/:id', controllerchauffeurInstance.verifyToken,controllerchauffeurInstance.deleteChauffeur);
        router.get('/auth/google/chauffeur', passport.authenticate('google-chauffeur', {
            scope: ['profile', 'email'],
          }));
                  
          router.get('/auth/google/chauffeur/callback',
            passport.authenticate('google-chauffeur', { failureRedirect: '/login' }),
            (req, res) => {
              // Redirection après une authentification réussie
              res.status(200).json({succe:true}) // Rediriger vers le dashboard du chauffeur
            }
          );

        router.get('/chauffeur/auth/facebook',
                      passport.authenticate('facebook', controllerchauffeurInstance.facebookStrategy)
                  );
                  
                  router.get('/auth/facebook/callback',
                      passport.authenticate('facebook', { 
                          failureRedirect: '/login' 
                      }),
                      (req, res) => {
                          // Redirection réussie
                          res.status(201).json({ success: true });
                      }
                  )



    }

    
}

export default new Routechauffeur();