import express, { Router, Request, Response, NextFunction }  from "express";
import { controllerAdminInstance } from "../Controlleur/Controlleradmin"; 
import verifyToken from "../midlleware/VerifierToken";
import { controllerclientInstance } from "../Controlleur/Controllerclient";
import { ControllerpartenairInstance } from "../Controlleur/Controllerpartenaire";
import { controllerchauffeurInstance } from "../Controlleur/Controllerchauffeur";
import { controllerVilleArticleInstance } from "../Controlleur/Controllervillearticle";
import { ControllerquestionBankInstance } from "../Controlleur/Controllerquestionquize";
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
        router.post('/admin/login', controllerAdminInstance.login);
        router.post('/admin-verifier-email',controllerAdminInstance.verifyToken,controllerAdminInstance.VeriffieEmail)
        router.post('/admin/passwordoublier',controllerAdminInstance.forgetpassword)
        router.get("/admin/reset-password/:token", controllerAdminInstance.resetpassword);
        router.get("admin/logout", controllerAdminInstance.logout);
        router.get('/admin-reenvoyercode',controllerclientInstance.verifyToken,controllerAdminInstance.renvoyeruncode);
        
        //Crud
        router.get('/admin/:id',controllerAdminInstance.verifyToken ,controllerAdminInstance.getAdminById);
        router.put('/admin/:id', controllerAdminInstance.verifyToken,controllerAdminInstance.updateAdmin);
        router.delete('/admin/:id',controllerAdminInstance.verifyToken ,controllerAdminInstance.deleteAdmin);
        router.get('/admins', controllerAdminInstance.verifyToken,controllerAdminInstance.getAllAdmins);
        //crud client
        router.get('admin/clients', controllerAdminInstance.verifyToken,controllerclientInstance.getAllTouristes);
        router.get('admin/client/:id', controllerAdminInstance.verifyToken,controllerclientInstance.getTouristeById);
        router.put('admin/client/:id', controllerAdminInstance.verifyToken,controllerclientInstance.updateTouriste);
        router.delete('admin/client/:id', controllerAdminInstance.verifyToken,controllerclientInstance.deleteTouriste);
        //crud chauffeur
        router.get('admin/chauffeurs', controllerAdminInstance.verifyToken,controllerchauffeurInstance.getAllChauffeurs);
        router.get('admin/chauffeur/:id', controllerAdminInstance.verifyToken,controllerchauffeurInstance.getChauffeurById);
        router.put('admin/chauffeur/:id', controllerAdminInstance.verifyToken,controllerchauffeurInstance.updateChauffeur);
        router.delete('admin/chauffeur/:id', controllerAdminInstance.verifyToken,controllerchauffeurInstance.deleteChauffeur);
        //crud touriste
        router.get('admin/touristes', controllerAdminInstance.verifyToken,controllerclientInstance.getAllTouristes);
        router.get('admin/touriste/:id', controllerAdminInstance.verifyToken,controllerclientInstance.getTouristeById);
        router.put('admin/touriste/:id', controllerAdminInstance.verifyToken,controllerclientInstance.updateTouriste);
        router.delete('admin/touriste/:id', controllerAdminInstance.verifyToken,controllerclientInstance.deleteTouriste);
        //crud partenaire
        router.get('admin/partenaires', controllerAdminInstance.verifyToken,ControllerpartenairInstance.getAllPartenaires);
        router.get('admin/partenaire/:id', controllerAdminInstance.verifyToken,ControllerpartenairInstance.getPartenaireById);
        router.put('admin/partenaire/:id', controllerAdminInstance.verifyToken,ControllerpartenairInstance.updatePartenaire);
        router.delete('admin/partenaire/:id', controllerAdminInstance.verifyToken,ControllerpartenairInstance.deletePartenaire);
        //crud villeArticle sans token
        router.post('admin/villeArticle',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.createVilleArticle);
        router.get('/admin/villeArticles',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.getAllVilleArticles);
        router.get('/admin/villeArticle/:id',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.getVilleArticleById);
        router.put('/admin/villeArticle/:id',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.updateVilleArticle);
        router.delete('/admin/villeArticle/:id',controllerAdminInstance.verifyToken,controllerVilleArticleInstance.deleteVilleArticle);
        //crud question
        router.post('admin/question',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.createQuestion);
        router.get('/admin/question',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.getAllQuestions);
        router.get('/admin/question/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.getQuestionById);
        router.put('/admin/question/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.updateQuestion);
        router.delete('/admin/question/:id',controllerAdminInstance.verifyToken,ControllerquestionBankInstance.deleteQuestion);
    }
}

export default new Routeadmin();