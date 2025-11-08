"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tourController_1 = require("../Controlleur/tourController");
const Controllerpartenaire_1 = require("../Controlleur/Controllerpartenaire");
const router = express_1.default.Router();
class RouteTour {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        const verifyToken = Controllerpartenaire_1.ControllerpartenairInstance.verifyToken;
        // Routes pour les partenaires (nécessitent authentification)
        router.post('/tours', verifyToken, tourController_1.tourControllerInstance.creerTour.bind(tourController_1.tourControllerInstance));
        router.get('/mes-tours', verifyToken, tourController_1.tourControllerInstance.getMesTours.bind(tourController_1.tourControllerInstance));
        router.get('/mes-tours/:tourId', verifyToken, tourController_1.tourControllerInstance.getMonTourById.bind(tourController_1.tourControllerInstance));
        router.put('/tours/:tourId', verifyToken, tourController_1.tourControllerInstance.updateTour.bind(tourController_1.tourControllerInstance));
        router.delete('/tours/:tourId', verifyToken, tourController_1.tourControllerInstance.deleteTour.bind(tourController_1.tourControllerInstance));
        // Routes publiques (sans authentification)
        router.get('/tours', tourController_1.tourControllerInstance.getAllTours.bind(tourController_1.tourControllerInstance));
        router.get('/tours/:tourId', tourController_1.tourControllerInstance.getTourById.bind(tourController_1.tourControllerInstance));
        router.get('/tours/ville/:ville', tourController_1.tourControllerInstance.getToursByVille.bind(tourController_1.tourControllerInstance));
        // Routes pour la gestion des images (stockage local)
        router.post('/tours/:tourId/images', verifyToken, tourController_1.tourControllerInstance.uploadTourImageS3.bind(tourController_1.tourControllerInstance));
        router.delete('/tours/:tourId/images', verifyToken, tourController_1.tourControllerInstance.deleteTourImageS3.bind(tourController_1.tourControllerInstance));
    }
}
exports.default = new RouteTour();
