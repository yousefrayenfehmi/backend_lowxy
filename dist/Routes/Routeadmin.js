"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Controlleradmin_1 = require("../Controlleur/Controlleradmin");
const Controllerclient_1 = require("../Controlleur/Controllerclient");
const Controllerpartenaire_1 = require("../Controlleur/Controllerpartenaire");
const Controllerchauffeur_1 = require("../Controlleur/Controllerchauffeur");
const Controllervillearticle_1 = require("../Controlleur/Controllervillearticle");
const Controllerquestionquize_1 = require("../Controlleur/Controllerquestionquize");
const ControllerMarge_1 = require("../Controlleur/ControllerMarge");
const Controllercovringads_1 = require("../Controlleur/Controllercovringads");
const ControllerConfigpublicite_1 = require("../Controlleur/ControllerConfigpublicite");
const router = express_1.default.Router();
class Routeadmin {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Routes pour la gestion des admins
        router.post('/admin-login', Controlleradmin_1.controllerAdminInstance.login);
        router.get("admin/logout", Controlleradmin_1.controllerAdminInstance.logout);
        router.post('/admin/validecovering/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controlleradmin_1.controllerAdminInstance.validecovering);
        //CrudcreateAdmin
        router.post('/admin-create', Controlleradmin_1.controllerAdminInstance.createAdmin);
        router.get('/admins/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controlleradmin_1.controllerAdminInstance.getAdminById);
        router.put('/admins/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controlleradmin_1.controllerAdminInstance.updateAdmin);
        router.delete('/admins/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controlleradmin_1.controllerAdminInstance.deleteAdmin);
        router.get('/admins', Controlleradmin_1.controllerAdminInstance.verifyToken, Controlleradmin_1.controllerAdminInstance.getAllAdmins);
        //crud client
        router.get('/admins-clients', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.getAllTouristes);
        router.get('admins/client/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.getTouristeById);
        router.put('admins/client/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.updateTouriste);
        router.delete('/admins/client/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.deleteTouriste);
        //crud chauffeur
        router.get('/admins-chauffeurs', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.getAllChauffeurs);
        router.get('admin/chauffeur/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.getChauffeurById);
        router.put('admin/chauffeur/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.updateChauffeur);
        router.delete('/admins/chauffeur/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.deleteChauffeur);
        //crud touriste
        router.get('/admins/touristes', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.getAllTouristes);
        router.get('/admins/touriste/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.getTouristeById);
        router.put('/admins/touriste/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.updateTouriste);
        router.delete('/admins/touriste/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.deleteTouriste);
        //crud partenaire
        router.get('/admins-partenaires', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.getAllPartenaires);
        router.get('/admins/partenaire/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.getPartenaireById);
        router.put('/admins/partenaire/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.updatePartenaire);
        router.delete('/admins/partenaire/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.deletePartenaire);
        //crud villeArticle sans token
        router.post('/admins/villeArticle', Controllervillearticle_1.ControllervillearticleInstance.createVilleArticle);
        router.get('/admin/villeArticle', Controllervillearticle_1.ControllervillearticleInstance.getVilleArticle);
        router.put('/admine/villeArticle/:id', Controllervillearticle_1.ControllervillearticleInstance.updateVilleArticle);
        router.delete('/admine/villeArticle/:id', Controllervillearticle_1.ControllervillearticleInstance.deleteVilleArticle);
        router.get('/admin/villeArticle/:ville', Controllervillearticle_1.ControllervillearticleInstance.getVilleArticleByVille);
        //
        router.get('/admine-partenaire/pub-quiz/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.pubetatchanger);
        router.delete('/admine-partenaire/pub-quiz/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.deletepubquiz);
        //crud marge
        // Routes des marges - Sans token pour test
        router.get('/admins/marges/stats', Controlleradmin_1.controllerAdminInstance.verifyToken, ControllerMarge_1.ControllerMargeInstance.getMargeStats);
        router.get('/admin-marge', Controlleradmin_1.controllerAdminInstance.verifyToken, ControllerMarge_1.ControllerMargeInstance.getAllMarges);
        // Routes des marges avec token
        router.get('/admins/marges/tour/:tourId', Controlleradmin_1.controllerAdminInstance.verifyToken, ControllerMarge_1.ControllerMargeInstance.getMargesByTourId);
        router.post('/admins/marges', Controlleradmin_1.controllerAdminInstance.verifyToken, ControllerMarge_1.ControllerMargeInstance.createMarge);
        router.post('/admins-marges/global', Controlleradmin_1.controllerAdminInstance.verifyToken, ControllerMarge_1.ControllerMargeInstance.applyGlobalMarge);
        //crud question
        router.post('/admin/question', Controllerquestionquize_1.ControllerquestionBankInstance.createQuestion);
        router.get('/question', Controllerquestionquize_1.ControllerquestionBankInstance.getAllQuestions);
        router.get('/admin/question/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerquestionquize_1.ControllerquestionBankInstance.getQuestionById);
        router.put('/admin/question/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerquestionquize_1.ControllerquestionBankInstance.updateQuestion);
        router.delete('/admin/question/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerquestionquize_1.ControllerquestionBankInstance.deleteQuestion);
        router.post('/admin/question', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerquestionquize_1.ControllerquestionBankInstance.createQuestion);
        router.get('/admin-all-questions', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerquestionquize_1.ControllerquestionBankInstance.getAllQuestions);
        router.get('/adminGetQuestion/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerquestionquize_1.ControllerquestionBankInstance.getQuestionById);
        router.put('/adminUpdateQuestion/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerquestionquize_1.ControllerquestionBankInstance.updateQuestion);
        router.delete('/adminDeleteQuestion/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerquestionquize_1.ControllerquestionBankInstance.deleteQuestion);
        router.post('/admin-verifyToken', Controlleradmin_1.controllerAdminInstance.verifyAdminToken);
        //covering
        router.get('/covering-admine/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.getcoveringadsById);
        router.put('/covering-admine/active/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.ActiveCampaign);
        router.delete('/covering-admine/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllercovringads_1.ControllercovringadsInstance.deleteCampaign);
        router.get('/tour-admine/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.tourbypartenaire);
        router.delete('/tour-admine/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerpartenaire_1.ControllerpartenairInstance.deleteTour);
        //config publicite
        router.post('/admin-config-publicite', Controlleradmin_1.controllerAdminInstance.verifyToken, ControllerConfigpublicite_1.ControllerConfigpubliciteInstance.creerConfiguration);
        router.get('/admin-config-publicite', Controlleradmin_1.controllerAdminInstance.verifyToken, ControllerConfigpublicite_1.ControllerConfigpubliciteInstance.getConfiguration);
        router.get('/touriste-number-by-matricule/:matricule', Controlleradmin_1.controllerAdminInstance.verifyToken, Controlleradmin_1.controllerAdminInstance.getTouristeNumberbyMatricule);
        router.get('/touriste-quizz', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.Clientquizz);
        router.put('/touriste-quizz/:id', Controlleradmin_1.controllerAdminInstance.verifyToken, Controllerclient_1.controllerclientInstance.sauvgarderMontatnt);
        router.get('/config-publicite', ControllerConfigpublicite_1.ControllerConfigpubliciteInstance.getConfiguration);
        router.get('/admin-marges/stats', Controlleradmin_1.controllerAdminInstance.verifyToken, ControllerMarge_1.ControllerMargeInstance.statMarge);
        router.get("/admin-statistics", Controlleradmin_1.controllerAdminInstance.verifyToken, Controlleradmin_1.controllerAdminInstance.getStatistics);
    }
}
exports.default = new Routeadmin();
