import express, { Router, Request, Response } from 'express';
import { tourControllerInstance } from '../Controlleur/tourController';
import { ControllerpartenairInstance } from '../Controlleur/Controllerpartenaire';

const router: Router = express.Router();

class RouteTour {
  constructor() {
    this.initRoutes();
  }

  public getRouter(): Router {
    return router;
  }

  private initRoutes(): void {
    const verifyToken = ControllerpartenairInstance.verifyToken;

    // Routes pour les partenaires (nécessitent authentification)
    router.post('/tours', verifyToken, tourControllerInstance.creerTour.bind(tourControllerInstance));
    router.get('/mes-tours', verifyToken, tourControllerInstance.getMesTours.bind(tourControllerInstance));
    router.get('/mes-tours/:tourId', verifyToken, tourControllerInstance.getMonTourById.bind(tourControllerInstance));
    router.put('/tours/:tourId', verifyToken, tourControllerInstance.updateTour.bind(tourControllerInstance));
    router.delete('/tours/:tourId', verifyToken, tourControllerInstance.deleteTour.bind(tourControllerInstance));

    // Routes publiques (sans authentification)
    router.get('/tours', tourControllerInstance.getAllTours.bind(tourControllerInstance));
    router.get('/tours/:tourId', tourControllerInstance.getTourById.bind(tourControllerInstance));
    router.get('/tours/ville/:ville', tourControllerInstance.getToursByVille.bind(tourControllerInstance));

    // Routes pour la gestion des images
    router.post('/tours/:tourId/images', 
    verifyToken, 
    tourControllerInstance.uploadTourImage.bind(tourControllerInstance)
    );

    router.delete('/tours/:tourId/images', 
    verifyToken, 
    tourControllerInstance.deleteTourImage.bind(tourControllerInstance)
    );
  }
}

export default new RouteTour();
