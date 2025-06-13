// RouteGuideIA.ts
import express, { Router } from 'express';
import { GuideIAControllerInstance } from '../Controlleur/GuideIAController';
import { controllerclientInstance } from '../Controlleur/Controllerclient'; 

const router: Router = express.Router();

class RouteGuideIA {
  constructor() {
    this.initRoutes();
  }

  public getRouter(): Router {
    return router;
  }

  private initRoutes(): void {
    // Routes du guide IA (protégées par authentification)
    router.get('/guide/responses', controllerclientInstance.verifyToken, GuideIAControllerInstance.getGuideResponses);

    router.post('/session/demarrer', controllerclientInstance.verifyToken, GuideIAControllerInstance.demarrerSession);
    router.post('/session/terminer', controllerclientInstance.verifyToken, GuideIAControllerInstance.terminerSession);
    router.post('/guide/live', controllerclientInstance.verifyToken, GuideIAControllerInstance.guideLive);
    router.post('/guide/trajet', controllerclientInstance.verifyToken, GuideIAControllerInstance.guideTrajet);
    router.put('/preferences', controllerclientInstance.verifyToken, GuideIAControllerInstance.mettreAJourPreferences);
  }
}

export default new RouteGuideIA();
