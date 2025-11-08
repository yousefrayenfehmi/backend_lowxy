"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ReservationController_1 = require("../Controlleur/ReservationController");
const Controllerpartenaire_1 = require("../Controlleur/Controllerpartenaire");
const Controllerclient_1 = require("../Controlleur/Controllerclient");
const router = express_1.default.Router();
class RouteReservation {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Routes pour la création et la confirmation des paiements
        router.post('/reservations/create-payment-session', Controllerclient_1.controllerclientInstance.verifyToken, ReservationController_1.reservationControllerInstance.createPaymentSession);
        router.post('/reservations/confirm-payment', ReservationController_1.reservationControllerInstance.confirmPayment);
        // Checkout par ID de réservation (front: POST /reservations/:reservationId/checkout)
        router.post('/reservations/:reservationId/checkout', Controllerclient_1.controllerclientInstance.verifyToken, ReservationController_1.reservationControllerInstance.createReservationCheckoutSessionById.bind(ReservationController_1.reservationControllerInstance));
        // Nouvelle route pour envoyer un email au touriste (avec authentification client)
        router.post('/reservations/envoyer-email-touriste', Controllerclient_1.controllerclientInstance.verifyToken, ReservationController_1.reservationControllerInstance.envoyerEmailTouriste.bind(ReservationController_1.reservationControllerInstance));
        //Route pour le webhook Stripe (pas d'authentification)
        router.post('/reservations/webhook', express_1.default.raw({ type: 'application/json' }), ReservationController_1.reservationControllerInstance.handleStripeWebhook);
        //Routes pour la gestion des réservations (authentifiées)
        router.get('/mes-reservations', Controllerclient_1.controllerclientInstance.verifyToken, ReservationController_1.reservationControllerInstance.getMesReservationsClient);
        router.get('/partenaire-reservation-by-tour/:tour_id', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, ReservationController_1.reservationControllerInstance.getReservationsForTour);
        router.get('/partenaire-mes-reservations', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, ReservationController_1.reservationControllerInstance.getMesReservationsPartenaire);
        router.post('/reservations/complete-reservation', Controllerclient_1.controllerclientInstance.verifyToken, ReservationController_1.reservationControllerInstance.completeReservation);
        router.post('/reservations/annuler-reservation-partenaire', Controllerpartenaire_1.ControllerpartenairInstance.verifyToken, ReservationController_1.reservationControllerInstance.annulerReservationPartenaire);
        router.post('/reservations/annuler-reservation-touriste', Controllerclient_1.controllerclientInstance.verifyToken, ReservationController_1.reservationControllerInstance.annulerReservationTouriste);
    }
}
exports.default = new RouteReservation();
