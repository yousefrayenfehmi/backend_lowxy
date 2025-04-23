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

    // Route pour le webhook Stripe (pas d'authentification)
    router.post('/reservations/webhook', express.raw({ type: 'application/json' }), reservationControllerInstance.handleStripeWebhook);

    // Routes pour la gestion des réservations (authentifiées)
    router.get('/mes-reservations', controllerclientInstance.verifyToken, reservationControllerInstance.getMesReservationsClient);


    router.get('/partenaire-reservation-by-tour/:tour_id', ControllerpartenairInstance.verifyToken, reservationControllerInstance.getReservationsForTour);
    router.get('/partenaire-mes-reservations', ControllerpartenairInstance.verifyToken, reservationControllerInstance.getMesReservationsPartenaire);
  
  }
}

export default new RouteReservation();