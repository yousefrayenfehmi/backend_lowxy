import express, { Router, Request, Response } from 'express';
import { reservationControllerInstance } from '../Controlleur/ReservationController';
import { ControllerpartenairInstance } from '../Controlleur/Controllerpartenaire';
import { controllerclientInstance } from '../Controlleur/Controllerclient'; 

const router: Router = express.Router();

class RouteReservation {
  constructor() {
    this.initRoutes();
  }

  public getRouter(): Router {
    return router;
  }

  private initRoutes() {

    // Routes pour la création et la confirmation des paiements
    router.post('/reservations/create-payment-session', controllerclientInstance.verifyToken, reservationControllerInstance.createPaymentSession);
    router.post('/reservations/confirm-payment', reservationControllerInstance.confirmPayment);
    // Checkout par ID de réservation (front: POST /reservations/:reservationId/checkout)
    router.post('/reservations/:reservationId/checkout', controllerclientInstance.verifyToken, reservationControllerInstance.createReservationCheckoutSessionById.bind(reservationControllerInstance));

    // Nouvelle route pour envoyer un email au touriste (avec authentification client)
    router.post('/reservations/envoyer-email-touriste', controllerclientInstance.verifyToken, reservationControllerInstance.envoyerEmailTouriste.bind(reservationControllerInstance));

    //Route pour le webhook Stripe (pas d'authentification)
    router.post('/reservations/webhook', express.raw({ type: 'application/json' }), reservationControllerInstance.handleStripeWebhook);

    //Routes pour la gestion des réservations (authentifiées)
   router.get('/mes-reservations', controllerclientInstance.verifyToken, reservationControllerInstance.getMesReservationsClient);


    router.get('/partenaire-reservation-by-tour/:tour_id', ControllerpartenairInstance.verifyToken, reservationControllerInstance.getReservationsForTour);
    router.get('/partenaire-mes-reservations', ControllerpartenairInstance.verifyToken, reservationControllerInstance.getMesReservationsPartenaire);
  
    router.post('/reservations/complete-reservation', controllerclientInstance.verifyToken, reservationControllerInstance.completeReservation);
    router.post('/reservations/annuler-reservation-partenaire', ControllerpartenairInstance.verifyToken, reservationControllerInstance.annulerReservationPartenaire);
    router.post('/reservations/annuler-reservation-touriste', controllerclientInstance.verifyToken, reservationControllerInstance.annulerReservationTouriste);
  }
}

export default new RouteReservation();