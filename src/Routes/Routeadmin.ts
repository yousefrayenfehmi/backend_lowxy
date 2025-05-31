import express, { Router, Request, Response, NextFunction }  from "express";
import { controllerAdminInstance } from "../Controlleur/Controlleradmin"; 
import { VerifierTokenInstance } from "../midlleware/VerifierToken";
import { controllerclientInstance } from "../Controlleur/Controllerclient";
import { ControllerpartenairInstance } from "../Controlleur/Controllerpartenaire";
import { controllerchauffeurInstance } from "../Controlleur/Controllerchauffeur";
import { controllerVilleArticleInstance } from "../Controlleur/Controllervillearticle";
import { ControllerquestionBankInstance } from "../Controlleur/Controllerquestionquize";
import { ControllerMargeInstance } from "../Controlleur/ControllerMarge";
import { Controllercovringads, ControllercovringadsInstance } from "../Controlleur/Controllercovringads";
import { ControllerConfigpubliciteInstance } from "../Controlleur/ControllerConfigpublicite";
const router: Router = express.Router();
class Routeadmin {
    constructor() {
        this.initRoutes();
    }
    public getRouter(): Router {
        return router;
    }
    
    initRoutes() {
        // Routes pour la gestion des admins
        router.post('/admin/singup', controllerAdminInstance.Signup);
        router.post('/admin-login', controllerAdminInstance.login);
        router.post('/admin-verifier-email',controllerAdminInstance.verifyToken,controllerAdminInstance.VeriffieEmail)
        router.post('/admin/passwordoublier',controllerAdminInstance.forgetpassword)
        router.get("/admin/reset-password/:token", controllerAdminInstance.resetpassword);
        router.get("admin/logout", controllerAdminInstance.logout);
        router.get('/admin-reenvoyercode',controllerclientInstance.verifyToken,controllerAdminInstance.renvoyeruncode);
        router.post('/admin/validecovering/:id',controllerAdminInstance.verifyToken,controllerAdminInstance.validecovering);
        //CrudcreateAdmin
        router.post('/admin-create',controllerAdminInstance.createAdmin);

        router.get('/admins/:id',controllerAdminInstance.verifyToken ,controllerAdminInstance.getAdminById);
        router.put('/admins/:id', controllerAdminInstance.verifyToken,controllerAdminInstance.updateAdmin);
        router.delete('/admins/:id',controllerAdminInstance.verifyToken ,controllerAdminInstance.deleteAdmin);
        router.get('/admins', controllerAdminInstance.verifyToken,controllerAdminInstance.getAllAdmins);
        //crud client
        router.get('/admins-clients', controllerAdminInstance.verifyToken,controllerclientInstance.getAllTouristes);
        router.get('admins/client/:id', controllerAdminInstance.verifyToken,controllerclientInstance.getTouristeById);
        router.put('admins/client/:id', controllerAdminInstance.verifyToken,controllerclientInstance.updateTouriste);
        router.delete('/admins/client/:id', controllerAdminInstance.verifyToken,controllerclientInstance.deleteTouriste);
        //crud chauffeur
        router.get('/admins-chauffeurs', controllerAdminInstance.verifyToken,controllerchauffeurInstance.getAllChauffeurs);
        router.get('admin/chauffeur/:id', controllerAdminInstance.verifyToken,controllerchauffeurInstance.getChauffeurById);
        router.put('admin/chauffeur/:id', controllerAdminInstance.verifyToken,controllerchauffeurInstance.updateChauffeur);
        router.delete('/admins/chauffeur/:id', controllerAdminInstance.verifyToken,controllerchauffeurInstance.deleteChauffeur);
        //crud touriste
        router.get('/admins/touristes', controllerAdminInstance.verifyToken,controllerclientInstance.getAllTouristes);
        router.get('/admins/touriste/:id', controllerAdminInstance.verifyToken,controllerclientInstance.getTouristeById);
        router.put('/admins/touriste/:id', controllerAdminInstance.verifyToken,controllerclientInstance.updateTouriste);
        router.delete('/admins/touriste/:id', controllerAdminInstance.verifyToken,controllerclientInstance.deleteTouriste);
        //crud partenaire
        router.get('/admins-partenaires', controllerAdminInstance.verifyToken,ControllerpartenairInstance.getAllPartenaires);
        router.get('/admins/partenaire/:id', controllerAdminInstance.verifyToken,ControllerpartenairInstance.getPartenaireById);
        router.put('/admins/partenaire/:id', controllerAdminInstance.verifyToken,ControllerpartenairInstance.updatePartenaire);
        router.delete('/admins/partenaire/:id', controllerAdminInstance.verifyToken,ControllerpartenairInstance.deletePartenaire);
        //crud villeArticle sans token
        router.post('/admins/villeArticle',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.createVilleArticle);
        router.get('/admin/villeArticle/:id',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.getVilleArticleById);
        router.get('/admins-villeArticle/:id',controllerVilleArticleInstance.getVilleArticleById);
        router.put('/admin/villeArticle/:id',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.updateVilleArticle);
        router.put('/admine/villeArticle',controllerVilleArticleInstance.updateVilleArticle);
        router.delete('/admin/villeArticle/:id',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.deleteVilleArticle);
        router.delete('/admine/villeArticle/:id',controllerVilleArticleInstance.deleteVilleArticle);
        router.get('/admine-partenaire/pub-quiz/:id',controllerAdminInstance.verifyToken,ControllerpartenairInstance.pubetatchanger);
        router.delete('/admine-partenaire/pub-quiz/:id',controllerAdminInstance.verifyToken,ControllerpartenairInstance.deletepubquiz);
        //crud marge
        // Routes des marges - Sans token pour test
        router.get('/admins/marges/stats', controllerAdminInstance.verifyToken, ControllerMargeInstance.getMargeStats);
        router.get('/admin-marge',controllerAdminInstance.verifyToken,ControllerMargeInstance.getAllMarges);
        // Routes des marges avec token
        router.get('/admins/marges/tour/:tourId', controllerAdminInstance.verifyToken, ControllerMargeInstance.getMargesByTourId);
        router.post('/admins/marges', controllerAdminInstance.verifyToken, ControllerMargeInstance.createMarge);
        router.put('/admins/marges/:id', controllerAdminInstance.verifyToken, ControllerMargeInstance.updateMarge);
        router.patch('/admins/marges/:id/status', controllerAdminInstance.verifyToken, ControllerMargeInstance.toggleMargeStatus);
        router.delete('/admin-marges/:id', controllerAdminInstance.verifyToken, ControllerMargeInstance.deleteMarge);
        router.post('/admins-marges/global', controllerAdminInstance.verifyToken, ControllerMargeInstance.applyGlobalMarge);

        router.post('/admine/villeArticle',controllerVilleArticleInstance.createVilleArticle);
        router.get('/admine/villeArticles',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.getAllVilleArticles);
        //crud question
        router.post('/admin/question',ControllerquestionBankInstance.createQuestion);
        router.get('/question',ControllerquestionBankInstance.getAllQuestions);
        router.get('/admin/question/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.getQuestionById);
        router.put('/admin/question/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.updateQuestion);
        router.delete('/admin/question/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.deleteQuestion);
        router.post('/admin/question',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.createQuestion);
        router.get('/admin-all-questions',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.getAllQuestions);
        router.get('/adminGetQuestion/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.getQuestionById);
        router.put('/adminUpdateQuestion/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.updateQuestion);
        router.delete('/adminDeleteQuestion/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.deleteQuestion);


        router.post('/admin-verifyToken',controllerAdminInstance.verifyAdminToken);


        // Ajout des routes pour S3
        router.post('/admine/villeArticle/s3', controllerVilleArticleInstance.createVilleArticleS3);
        router.put('/admine/villeArticle/s3', controllerVilleArticleInstance.updateVilleArticleS3);

        //covering
        router.get('/covering-admine/:id',controllerAdminInstance.verifyToken,ControllercovringadsInstance.getcoveringadsById)
        router.put('/covering-admine/active/:id',controllerAdminInstance.verifyToken,ControllercovringadsInstance.ActiveCampaign)
        router.delete('/covering-admine/:id',controllerAdminInstance.verifyToken,ControllercovringadsInstance.deleteCampaign)
        router.get('/tour-admine/:id',controllerAdminInstance.verifyToken,ControllerpartenairInstance.tourbypartenaire)
        router.delete('/tour-admine/:id',controllerAdminInstance.verifyToken,ControllerpartenairInstance.deleteTour)
        //config publicite
        router.post('/admin-config-publicite',controllerAdminInstance.verifyToken,ControllerConfigpubliciteInstance.creerConfiguration)
        router.get('/admin-config-publicite',controllerAdminInstance.verifyToken,ControllerConfigpubliciteInstance.getConfiguration)
        router.get('/touriste-number-by-matricule/:matricule',controllerAdminInstance.verifyToken,controllerAdminInstance.getTouristeNumberbyMatricule)
    }
}

export default new Routeadmin();