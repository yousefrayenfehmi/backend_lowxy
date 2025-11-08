"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Controllerclient_1 = require("../Controlleur/Controllerclient");
const VerifierToken_1 = require("../midlleware/VerifierToken");
const Controllerchauffeur_1 = require("../Controlleur/Controllerchauffeur");
const router = express_1.default.Router();
class Routetouriste {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Routes d'authentification
        router.post('/touriste/register', (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield Controllerclient_1.controllerclientInstance.Signup(req, res);
        }));
        router.post('/touriste/login', Controllerclient_1.controllerclientInstance.login);
        router.post('/touriste/auth/google', Controllerclient_1.controllerclientInstance.authavecgoogle);
        router.post('/touriste/auth/facebook', Controllerclient_1.controllerclientInstance.authavecfacebook);
        router.get('/touriste-reenvoyercode', Controllerclient_1.controllerclientInstance.verifyToken, Controllerclient_1.controllerclientInstance.reenvoyeruncode);
        router.post('/touriste/forgetpassword', Controllerclient_1.controllerclientInstance.forgetpassword);
        router.post('/touriste/resetpassword/:token', Controllerclient_1.controllerclientInstance.resetpassword);
        router.post('/touriste-change-password', Controllerclient_1.controllerclientInstance.changePassword);
        router.get('/touriste/logout', Controllerclient_1.controllerclientInstance.logout);
        router.post('/touriste-verifier-email', Controllerclient_1.controllerclientInstance.verifyToken, Controllerclient_1.controllerclientInstance.VeriffieEmail);
        //Crud avec token
        router.get('/touriste/:id', Controllerclient_1.controllerclientInstance.verifyToken, Controllerclient_1.controllerclientInstance.getTouristeById);
        router.put('/touriste/:id', Controllerclient_1.controllerclientInstance.verifyToken, Controllerclient_1.controllerclientInstance.updateTouriste);
        router.delete('/touriste/:id', Controllerclient_1.controllerclientInstance.verifyToken, Controllerclient_1.controllerclientInstance.deleteTouriste);
        router.get('/touristes', Controllerclient_1.controllerclientInstance.verifyToken, Controllerclient_1.controllerclientInstance.getAllTouristes);
        //google authentification
        router.post('/verifyToken', Controllerclient_1.controllerclientInstance.verifyToken);
        //get User by token 
        router.get('/touriste-by-token', Controllerclient_1.controllerclientInstance.getTouristeByToken);
        router.post('/completertouriste', Controllerclient_1.controllerclientInstance.verifyToken, Controllerclient_1.controllerclientInstance.completerl);
        router.post('/touriste/uploadfacture', Controllerclient_1.controllerclientInstance.verifyToken, Controllerclient_1.controllerclientInstance.uploadfacture);
        router.post('/touriste/verifierchauffeur', Controllerclient_1.controllerclientInstance.verifyToken, Controllerchauffeur_1.controllerchauffeurInstance.verifierchauffeur);
        //get User by token
        router.get('/verifyTokenTous', VerifierToken_1.VerifierTokenInstance.getUser);
        router.post('/verifyTokenTouriste', Controllerclient_1.controllerclientInstance.verifyToken, (req, res) => {
            // Retourner l'objet touriste stocké lors de la vérification du token
            res.status(200).json({
                success: true,
                user: 'Touriste',
                message: 'Token valide',
                touriste: req.touriste
            });
        });
    }
}
exports.default = new Routetouriste();
