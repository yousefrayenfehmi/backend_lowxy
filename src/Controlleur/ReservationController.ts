import { Partenaires } from "../models/Partenaire";
import { dbConnection } from "../BDconnection/BDconnection";
import { NextFunction, Request, Response } from "express";
import mongoose, { Types } from 'mongoose';
import Stripe from 'stripe';
import multer from 'multer';
import path from 'path';
import { Touristes } from "../models/Touriste";
import dotenv from 'dotenv';
// Configuration Stripe
const stripe = new Stripe('sk_test_51RAG0WQ4fzXaDh6qqaSa4kETsLitTt3nAHAnaPoodCOrgstRL0puvbFYG6KoruYmawEgL3o8NJ5DmywcApPS2NjH00FKdOaX9O');
// Configuration de Multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/reservations'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage }).none(); // .none() car pas de fichiers à uploader pour les réservations

// Extension de l'interface Request pour inclure l'ID de l'utilisateur
interface AuthRequest extends Request {
    user?: string;
}

class ReservationController {
  constructor(){
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    console.log(process.env.FRONTEND_URL);
 }
 
  // Créer une session de paiement pour une réservation
async createPaymentSession(req: AuthRequest, res: Response): Promise<void> {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error('Erreur multer:', err);
        res.status(400).json({ success: false, message: 'Erreur lors du traitement du formulaire: ' + err.message });
        return;
      }

      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
      }

      // Récupérer l'ID du client à partir du token d'authentification
      const client_id = req.user;
      
      if (!client_id || !Types.ObjectId.isValid(client_id)) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentification requise pour effectuer une réservation' 
        });
        return;
      }

      console.log("Données reçues pour la réservation:", req.body);
      
      const { tour_id, jour_id, date, adultes, enfants, nom_tour } = req.body;
      // Vérifier la validité des paramètres
      if (!tour_id || !Types.ObjectId.isValid(tour_id) || 
          !jour_id || !Types.ObjectId.isValid(jour_id) || 
          !date || !adultes || !nom_tour) {
        res.status(400).json({ 
          success: false, 
          message: 'Paramètres invalides ou manquants' 
        });
        return;
      }
      
      // Trouver le partenaire et le tour
      const partenaire = await Partenaires.findOne({ 'tours._id': tour_id });
      if (!partenaire) {
        res.status(404).json({ 
          success: false, 
          message: 'Tour non trouvé' 
        });
        return;
      }
      
      // Trouver le tour dans le tableau des tours du partenaire
      const tour = partenaire.tours.find(t => t._id.toString() === tour_id);
      if (!tour) {
        res.status(404).json({ 
          success: false, 
          message: 'Tour non trouvé' 
        });
        return;
      }
      
      // Trouver le jour dans le tableau des jours du tour
      const jour = tour.jours.find(j => j._id.toString() === jour_id);
      if (!jour) {
        res.status(404).json({ 
          success: false, 
          message: 'Jour non trouvé' 
        });
        return;
      }
      
      // Vérifier la disponibilité
      const nbAdultes = parseInt(adultes);
      const nbEnfants = parseInt(enfants || '0');
      
      if (nbAdultes > jour.capacite.adultes || nbEnfants > jour.capacite.enfants) {
        res.status(400).json({ 
          success: false, 
          message: 'Capacité insuffisante pour cette date' 
        });
        return;
      }
      
      // Calculer le prix total en utilisant les prix spécifiques pour adultes et enfants
      const prixTotal = (nbAdultes * jour.prix.adulte) + (nbEnfants * jour.prix.enfant);
      
      // Créer une réservation temporaire avec un nouvel ID
      const reservationId = new mongoose.Types.ObjectId();
      
      const reservation = {
        _id: reservationId,
        client_id: new Types.ObjectId(client_id),
        date: new Date(date),
        participants: {
          adultes: nbAdultes,
          enfants: nbEnfants
        },
        prix_total: prixTotal,
        statut: 'en attente de paiement'
      };
      
      // Ajouter la réservation temporaire au tableau de réservations du jour
      if (!jour.reservations) {
        jour.reservations = [];
      }
      
      jour.reservations.push(reservation);
      await partenaire.save();
      
      console.log("Réservation créée temporairement:", reservation);
      
      try {
        // Création de la session de paiement Stripe
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `Réservation pour ${nom_tour}`,
                  description: `${nbAdultes} adulte(s) à ${jour.prix.adulte}€ et ${nbEnfants} enfant(s) à ${jour.prix.enfant}€ pour le ${new Date(date).toLocaleDateString('fr-FR')}`,
                },
                unit_amount: Math.round(prixTotal * 100), // Conversion en centimes
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.front_end}/paiment_sucesses/${reservation._id}?data=${encodeURIComponent(JSON.stringify({
            reservation_id: reservationId.toString(),
            tour_id: tour_id,
            jour_id: jour_id,
            client_id: client_id
          }))}&type=reservation`,
          cancel_url: `${process.env.front_end}/paiment_echouee/${reservation._id}?data=${encodeURIComponent(JSON.stringify({
            tour_id: tour_id
          }))}&type=reservation`,
        });
        
        res.status(200).json({ 
          success: true, 
          id: session.id,
          reservation_id: reservationId
        });
      } catch (stripeError) {
        console.error('Erreur Stripe:', stripeError);
        
        // Annuler la réservation temporaire en cas d'erreur
        const jourIndex = tour.jours.findIndex(j => j._id.toString() === jour_id);
        if (jourIndex !== -1) {
          const reservationIndex = tour.jours[jourIndex].reservations.findIndex(r => r._id.toString() === reservationId.toString());
          if (reservationIndex !== -1) {
            tour.jours[jourIndex].reservations.splice(reservationIndex, 1);
            await partenaire.save();
          }
        }
        
        res.status(400).json({ 
          success: false,
          message: 'Erreur lors de la création du paiement Stripe',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la création de la réservation' 
      });
    }
  });
}

  // Confirmer le paiement d'une réservation
  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      console.log("Données de confirmation reçues:", req.body);
      
      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
      }
      
      const { reservation_id, tour_id, jour_id, client_id } = req.body;
      
      if (!reservation_id || !Types.ObjectId.isValid(reservation_id) || 
          !tour_id || !Types.ObjectId.isValid(tour_id) || 
          !jour_id || !Types.ObjectId.isValid(jour_id) ||
          !client_id || !Types.ObjectId.isValid(client_id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Paramètres invalides ou manquants' 
        });
        return;
      }
      
      // Trouver le partenaire et le tour
      const partenaire = await Partenaires.findOne({ 'tours._id': tour_id });
      if (!partenaire) {
        res.status(404).json({ 
          success: false, 
          message: 'Tour non trouvé' 
        });
        return;
      }
      
      // Trouver le tour dans le tableau des tours du partenaire
      const tourIndex = partenaire.tours.findIndex(t => t._id.toString() === tour_id);
      if (tourIndex === -1) {
        res.status(404).json({ 
          success: false, 
          message: 'Tour non trouvé' 
        });
        return;
      }
      
      // Trouver le jour dans le tableau des jours du tour
      const jourIndex = partenaire.tours[tourIndex].jours.findIndex(j => j._id.toString() === jour_id);
      if (jourIndex === -1) {
        res.status(404).json({ 
          success: false, 
          message: 'Jour non trouvé' 
        });
        return;
      }
      
      // Trouver la réservation dans le tableau des réservations du jour
      const reservationIndex = partenaire.tours[tourIndex].jours[jourIndex].reservations.findIndex(r => 
        r._id.toString() === reservation_id
      );
      
      if (reservationIndex === -1) {
        res.status(404).json({ 
          success: false, 
          message: 'Réservation non trouvée' 
        });
        return;
      }
      
      // Mettre à jour le statut de la réservation
      partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex].statut = 'confirmée';
      partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex].payment_date = new Date();
      
      await partenaire.save();
      
      console.log("Réservation confirmée:", partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex]);
      
      res.status(200).json({ 
        success: true, 
        message: 'Paiement confirmé avec succès', 
        reservation: partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex]
      });
    } catch (error) {
      console.error('Erreur lors de la confirmation du paiement:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la confirmation du paiement' 
      });
    }
  }

  // Webhook Stripe pour les événements de paiement
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      res.status(400).json({ 
        success: false, 
        message: 'Signature Stripe manquante' 
      });
      return;
    }
    
    try {
      let event;
      
      // Vérifier la signature
      try {
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        event = stripe.webhooks.constructEvent(
          req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body)),
          sig,
          endpointSecret
        );
      } catch (err) {
        console.error(`Erreur de signature Stripe: ${err.message}`);
        res.status(400).json({ 
          success: false, 
          message: `Erreur de signature: ${err.message}` 
        });
        return;
      }
      
      // Gérer les événements Stripe
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Traiter le paiement réussi
        console.log('Paiement réussi:', session);
        
        // Extraire les informations de la réservation depuis l'URL de succès
        if (session.success_url && session.success_url.includes('type=reservation')) {
          const url = new URL(session.success_url);
          const dataParam = url.searchParams.get('data');
          
          if (dataParam) {
            try {
              const data = JSON.parse(decodeURIComponent(dataParam));
              const { reservation_id, tour_id, jour_id } = data;
              
              if (reservation_id && tour_id && jour_id) {
                // Trouver le partenaire et le tour
                const partenaire = await Partenaires.findOne({ 'tours._id': tour_id });
                
                if (partenaire) {
                  const tourIndex = partenaire.tours.findIndex(t => t._id.toString() === tour_id);
                  
                  if (tourIndex !== -1) {
                    const jourIndex = partenaire.tours[tourIndex].jours.findIndex(j => j._id.toString() === jour_id);
                    
                    if (jourIndex !== -1) {
                      const reservationIndex = partenaire.tours[tourIndex].jours[jourIndex].reservations.findIndex(r => 
                        r._id.toString() === reservation_id
                      );
                      
                      if (reservationIndex !== -1) {
                        // Mettre à jour le statut de la réservation
                        partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex].statut = 'confirmée';
                        partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex].payment_id = session.payment_intent;
                        partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex].payment_date = new Date();
                        
                        await partenaire.save();
                        console.log(`Réservation ${reservation_id} confirmée via webhook`);
                      }
                    }
                  }
                }
              }
            } catch (parseError) {
              console.error('Erreur lors du parsing des données de réservation:', parseError);
            }
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Erreur lors du traitement du webhook Stripe:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors du traitement du webhook' 
      });
    }
  }

  // Autres méthodes du contrôleur (getMesReservations, getReservationsForTour, annulerReservation)...
// Additional methods for ReservationController

  // Obtenir toutes les réservations d'un partenaire
  async getMesReservationsPartenaire(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
          res.status(500).json({ error: 'Erreur de connexion à la base de données' });
          return;
        });
      }
  
      // Récupérer l'ID du partenaire à partir du token d'authentification
      const partenaire_id = req.user;
      
      if (!partenaire_id || !Types.ObjectId.isValid(partenaire_id)) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentification requise pour accéder aux réservations' 
        });
        return;
      }
  
      // Trouver le partenaire 
      const partenaire = await Partenaires.findById(partenaire_id);
      
      if (!partenaire) {
        res.status(404).json({ 
          success: false, 
          message: 'Partenaire non trouvé' 
        });
        return;
      }
  
      // Collecter toutes les réservations de tous les tours
      const allReservations = [];
      
      for (const tour of partenaire.tours) {
        for (const jour of tour.jours) {
          if (jour.reservations && jour.reservations.length > 0) {
            // Pour chaque réservation, récupérer les informations du client
            const reservationsWithDetails = await Promise.all(jour.reservations.map(async (reservation) => {
              // Récupérer les informations du client
              const client = await Touristes.findById(reservation.client_id);
              
              // Créer l'objet client_info
              const client_info = client ? {
                nom: client.info.nom_complet || 'Client',
                email: client.info.email || 'Email non disponible',
                telephone: client.info.telephone || 'Téléphone non disponible'
              } : {
                nom: 'Client',
                email: 'Information non disponible',
                telephone: 'Information non disponible'
              };
              
              return {
                ...reservation.toObject(),
                tour_info: {
                  tour_id: tour._id,
                  tour_nom: tour.nom,
                  tour_ville: tour.ville
                },
                jour_info: {
                  jour_id: jour._id,
                  jour_date: jour.date,
                  jour_depart: jour.depart
                },
                client_info: client_info
              };
            }));
            
            allReservations.push(...reservationsWithDetails);
          }
        }
      }
      
      // Tri des réservations par date (de la plus récente à la plus ancienne)
      allReservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
      res.status(200).json({ 
        success: true, 
        nombre_reservations: allReservations.length,
        reservations: allReservations 
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des réservations' 
      });
    }
  }

  // Obtenir toutes les réservations pour un tour spécifique
  async getReservationsForTour(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
          res.status(500).json({ error: 'Erreur de connexion à la base de données' });
          return;
        });
      }

      // Récupérer l'ID du partenaire à partir du token d'authentification
      const partenaire_id = req.user;
      
      if (!partenaire_id || !Types.ObjectId.isValid(partenaire_id)) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentification requise pour accéder aux réservations' 
        });
        return;
      }

      const { tour_id } = req.params;
      console.log(tour_id)
      if (!tour_id || !Types.ObjectId.isValid(tour_id)) {
        res.status(400).json({ 
          success: false, 
          message: 'ID de tour invalide ou manquant' 
        });
        return;
      }

      // Trouver le partenaire et vérifier que le tour lui appartient
      const partenaire = await Partenaires.findOne({ 
        _id: partenaire_id,
        'tours._id': new Types.ObjectId(tour_id)
      });
      
      if (!partenaire) {
        res.status(404).json({ 
          success: false, 
          message: 'Tour non trouvé ou non autorisé' 
        });
        return;
      }

      // Trouver le tour spécifique
      const tour = partenaire.tours.id(tour_id);
      
      if (!tour) {
        res.status(404).json({ 
          success: false, 
          message: 'Tour non trouvé' 
        });
        return;
      }

      // Collecter toutes les réservations de ce tour
      const allReservations = [];
      
      for (const jour of tour.jours) {
        console.log(jour.reservations)
        if (jour.reservations ) {
          // Ajouter les informations du jour à chaque réservation
          const reservationsWithDetails = jour.reservations.map(reservation => {
            return {
              ...reservation.toObject(),
              jour_info: {
                jour_id: jour._id,
                jour_date: jour.date,
                jour_depart: jour.depart
              }
            };
          });
          
          allReservations.push(...reservationsWithDetails);
        }
      }
      console.log(allReservations)
      // Tri des réservations par date (de la plus récente à la plus ancienne)
      allReservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.status(200).json({ 
        success: true, 
        tour_info: {
          nom: tour.nom,
          ville: tour.ville,
          description: tour.description
        },
        nombre_reservations: allReservations.length,
        reservations: allReservations 
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations du tour:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des réservations du tour' 
      });
    }
  }

  // Obtenir toutes les réservations d'un client
  async getMesReservationsClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
          res.status(500).json({ error: 'Erreur de connexion à la base de données' });
          return;
        });
      }

      // Récupérer l'ID du client à partir du token d'authentification
      const client_id = req.user;
      
      if (!client_id || !Types.ObjectId.isValid(client_id)) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentification requise pour accéder à vos réservations' 
        });
        return;
      }

      // Recherche de toutes les réservations pour ce client dans tous les partenaires
      const partenaires = await Partenaires.find({
        'tours.jours.reservations.client_id': new Types.ObjectId(client_id)
      });

      // Collecter toutes les réservations du client
      const allReservations = [];
      
      for (const partenaire of partenaires) {
        for (const tour of partenaire.tours) {
          for (const jour of tour.jours) {
            // Filtrer uniquement les réservations du client
            const clientReservations = jour.reservations.filter(
              reservation => reservation.client_id.toString() === client_id
            );
            
            if (clientReservations.length > 0) {
              // Ajouter les informations du tour, du jour et du partenaire à chaque réservation
              const reservationsWithDetails = clientReservations.map(reservation => {
                return {
                  ...reservation.toObject(),
                  partenaire_info: {
                    partenaire_id: partenaire._id,
                    nom_entreprise: partenaire.inforamtion.inforegester.nom_entreprise
                  },
                  tour_info: {
                    tour_id: tour._id,
                    tour_nom: tour.nom,
                    tour_ville: tour.ville,
                    tour_image: tour.images && tour.images.length > 0 ? tour.images[0] : null
                  },
                  jour_info: {
                    jour_id: jour._id,
                    jour_date: jour.date,
                    jour_depart: jour.depart
                  }
                };
              });
              
              allReservations.push(...reservationsWithDetails);
            }
          }
        }
      }
      
      // Tri des réservations par date (de la plus récente à la plus ancienne)
      allReservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.status(200).json({ 
        success: true, 
        nombre_reservations: allReservations.length,
        reservations: allReservations 
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations du client:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération de vos réservations' 
      });
    }
  }

  // Méthode pour annuler une réservation
  async annulerReservation(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
          res.status(500).json({ error: 'Erreur de connexion à la base de données' });
          return;
        });
      }

      const { reservation_id, tour_id, jour_id } = req.params;
      
      // Récupérer l'ID de l'utilisateur authentifié (client ou partenaire)
      const user_id = req.user;
      
      if (!user_id || !Types.ObjectId.isValid(user_id)) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentification requise pour annuler une réservation' 
        });
        return;
      }
      
      if (!reservation_id || !Types.ObjectId.isValid(reservation_id) || 
          !tour_id || !Types.ObjectId.isValid(tour_id) ||
          !jour_id || !Types.ObjectId.isValid(jour_id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Paramètres invalides ou manquants' 
        });
        return;
      }

      // Trouver le partenaire et le tour
      const partenaire = await Partenaires.findOne({ 'tours._id': tour_id });
      
      if (!partenaire) {
        res.status(404).json({ 
          success: false, 
          message: 'Tour non trouvé' 
        });
        return;
      }
      
      // Trouver le tour dans le tableau des tours du partenaire
      const tourIndex = partenaire.tours.findIndex(t => t._id.toString() === tour_id);
      
      if (tourIndex === -1) {
        res.status(404).json({ 
          success: false, 
          message: 'Tour non trouvé' 
        });
        return;
      }
      
      // Trouver le jour dans le tableau des jours du tour
      const jourIndex = partenaire.tours[tourIndex].jours.findIndex(j => j._id.toString() === jour_id);
      
      if (jourIndex === -1) {
        res.status(404).json({ 
          success: false, 
          message: 'Jour non trouvé' 
        });
        return;
      }
      
      // Trouver la réservation dans le tableau des réservations du jour
      const reservationIndex = partenaire.tours[tourIndex].jours[jourIndex].reservations.findIndex(r => 
        r._id.toString() === reservation_id
      );
      
      if (reservationIndex === -1) {
        res.status(404).json({ 
          success: false, 
          message: 'Réservation non trouvée' 
        });
        return;
      }
      
      // Vérifier que l'utilisateur a les droits d'annuler la réservation
      const reservation = partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex];
      
      // Un client ne peut annuler que ses propres réservations
      // Un partenaire peut annuler n'importe quelle réservation de ses tours
      if (reservation.client_id.toString() !== user_id && partenaire._id.toString() !== user_id) {
        res.status(403).json({ 
          success: false, 
          message: 'Vous n\'êtes pas autorisé à annuler cette réservation' 
        });
        return;
      }
      
      // Vérifier que la réservation n'est pas déjà annulée
      if (reservation.statut === 'annulée') {
        res.status(400).json({ 
          success: false, 
          message: 'Cette réservation est déjà annulée' 
        });
        return;
      }
      
      // Mettre à jour le statut de la réservation
      partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex].statut = 'annulée';
      
      await partenaire.save();
      
      res.status(200).json({ 
        success: true, 
        message: 'Réservation annulée avec succès' 
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la réservation:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de l\'annulation de la réservation' 
      });
    }
  }

  // Méthode pour compléter une réservation en attente (pour le touriste)
  async completeReservation(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
          res.status(500).json({ error: 'Erreur de connexion à la base de données' });
          return;
        });
      }

      const { _id, tour_info, jour_info } = req.body;
      const reservation_id = _id;
      const tour_id = tour_info.tour_id;
      const jour_id = jour_info.jour_id;
      const client_id = req.user;
      console.log("--------------------------------");
      console.log(client_id);
      console.log(reservation_id, tour_id, jour_id);
      console.log("--------------------------------");
      if (!client_id || !Types.ObjectId.isValid(client_id)) {
        res.status(401).json({ success: false, message: 'Authentification requise' });
        return;
      }

      if (!reservation_id || !Types.ObjectId.isValid(reservation_id) || !tour_id || !Types.ObjectId.isValid(tour_id) || !jour_id || !Types.ObjectId.isValid(jour_id)) {
        res.status(400).json({ success: false, message: 'Paramètres invalides ou manquants' });
        return;
      }

      const partenaire = await Partenaires.findOne({ 'tours._id': tour_id });
      if (!partenaire) {
        res.status(404).json({ success: false, message: 'Tour non trouvé' });
        return;
      }

      const tourIndex = partenaire.tours.findIndex(t => t._id.toString() === tour_id);
      if (tourIndex === -1) {
        res.status(404).json({ success: false, message: 'Tour non trouvé' });
        return;
      }

      const jourIndex = partenaire.tours[tourIndex].jours.findIndex(j => j._id.toString() === jour_id);
      if (jourIndex === -1) {
        res.status(404).json({ success: false, message: 'Jour non trouvé' });
        return;
      }

      const reservationIndex = partenaire.tours[tourIndex].jours[jourIndex].reservations.findIndex(r => r._id.toString() === reservation_id);
      if (reservationIndex === -1) {
        res.status(404).json({ success: false, message: 'Réservation non trouvée' });
        return;
      }

      const reservation = partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex];
      if (reservation.client_id.toString() !== client_id) {
        res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à compléter cette réservation' });
        return;
      }

      if (reservation.statut !== 'en attente de paiement') {
        res.status(400).json({ success: false, message: 'Cette réservation n\'est pas en attente de paiement' });
        return;
      }

      // Création de la session de paiement Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Réservation pour ${partenaire.tours[tourIndex].nom}`,
                description: `${reservation.participants.adultes} adulte(s) et ${reservation.participants.enfants} enfant(s) pour le ${new Date(reservation.date).toLocaleDateString('fr-FR')}`,
              },
              unit_amount: Math.round(reservation.prix_total * 100), // Conversion en centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.front_end}/paiment_sucesses/${reservation._id}?data=${encodeURIComponent(JSON.stringify({
          reservation_id: reservation_id,
          tour_id: tour_id,
          jour_id: jour_id,
          client_id: client_id
        }))}&type=reservation`,
        cancel_url: `${process.env.front_end}/paiment_echouee/${reservation._id}?data=${encodeURIComponent(JSON.stringify({
          tour_id: tour_id
        }))}&type=reservation`,
      });

      res.status(200).json({ 
        success: true, 
        id: session.id,
        reservation_id: reservation_id
      });

    } catch (error) {
      console.error('Erreur lors de la complétion de la réservation:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la complétion de la réservation' });
    }
  }

  // Méthode pour qu'un partenaire annule une réservation en attente
  async annulerReservationPartenaire(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
          res.status(500).json({ error: 'Erreur de connexion à la base de données' });
          return;
        });
      }

      const { reservation_id, tour_id, jour_id } = req.body;
      const partenaire_id = req.user;

      if (!partenaire_id || !Types.ObjectId.isValid(partenaire_id)) {
        res.status(401).json({ success: false, message: 'Authentification requise' });
        return;
      }

      if (!reservation_id || !Types.ObjectId.isValid(reservation_id) || !tour_id || !Types.ObjectId.isValid(tour_id) || !jour_id || !Types.ObjectId.isValid(jour_id)) {
        res.status(400).json({ success: false, message: 'Paramètres invalides ou manquants' });
        return;
      }

      const partenaire = await Partenaires.findOne({ _id: partenaire_id, 'tours._id': tour_id });
      if (!partenaire) {
        res.status(404).json({ success: false, message: 'Tour non trouvé ou non autorisé' });
        return;
      }

      const tourIndex = partenaire.tours.findIndex(t => t._id.toString() === tour_id);
      if (tourIndex === -1) {
        res.status(404).json({ success: false, message: 'Tour non trouvé' });
        return;
      }

      const jourIndex = partenaire.tours[tourIndex].jours.findIndex(j => j._id.toString() === jour_id);
      if (jourIndex === -1) {
        res.status(404).json({ success: false, message: 'Jour non trouvé' });
        return;
      }

      const reservationIndex = partenaire.tours[tourIndex].jours[jourIndex].reservations.findIndex(r => r._id.toString() === reservation_id);
      if (reservationIndex === -1) {
        res.status(404).json({ success: false, message: 'Réservation non trouvée' });
        return;
      }

      const reservation = partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex];
      if (reservation.statut !== 'en attente de paiement') {
        res.status(400).json({ success: false, message: 'Cette réservation n\'est pas en attente de paiement' });
        return;
      }

      // Mettre à jour le statut de la réservation à "annulée"
      partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex].statut = 'annulée';

      await partenaire.save();
      console.log("Réservation annulée avec succès par le partenaire");
      res.status(200).json({ success: true, message: 'Réservation annulée avec succès par le partenaire' });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la réservation par le partenaire:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation de la réservation' });
    }
  }

  // Méthode pour qu'un touriste annule sa réservation en attente
  async annulerReservationTouriste(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérification de la connexion à la BD
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
          res.status(500).json({ error: 'Erreur de connexion à la base de données' });
          return;
        });
      }

      const { reservationId, tourId, jourId } = req.body;
      const client_id = req.user;
      console.log("--------------------------------");
      console.log(client_id);
      console.log(reservationId, tourId, jourId);
      console.log("--------------------------------");

      if (!client_id || !Types.ObjectId.isValid(client_id)) {
        res.status(401).json({ success: false, message: 'Authentification requise' });
        return;
      }

      if (!reservationId || !Types.ObjectId.isValid(reservationId) || !tourId || !Types.ObjectId.isValid(tourId) || !jourId || !Types.ObjectId.isValid(jourId)) {
        res.status(400).json({ success: false, message: 'Paramètres invalides ou manquants' });
        return;
      }

      const partenaire = await Partenaires.findOne({ 'tours._id': tourId });
      if (!partenaire) {
        res.status(404).json({ success: false, message: 'Tour non trouvé' });
        return;
      }

      const tourIndex = partenaire.tours.findIndex(t => t._id.toString() === tourId);
      if (tourIndex === -1) {
        res.status(404).json({ success: false, message: 'Tour non trouvé' });
        return;
      }

      const jourIndex = partenaire.tours[tourIndex].jours.findIndex(j => j._id.toString() === jourId);
      if (jourIndex === -1) {
        res.status(404).json({ success: false, message: 'Jour non trouvé' });
        return;
      }

      const reservationIndex = partenaire.tours[tourIndex].jours[jourIndex].reservations.findIndex(r => r._id.toString() === reservationId);
      if (reservationIndex === -1) {
        res.status(404).json({ success: false, message: 'Réservation non trouvée' });
        return;
      }

      const reservation = partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex];
      if (reservation.client_id.toString() !== client_id) {
        res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à annuler cette réservation' });
        return;
      }

      if (reservation.statut !== 'en attente de paiement') {
        res.status(400).json({ success: false, message: 'Cette réservation n\'est pas en attente de paiement' });
        return;
      }

      // Mettre à jour le statut de la réservation à "annulée"
      partenaire.tours[tourIndex].jours[jourIndex].reservations[reservationIndex].statut = 'annulée';

      await partenaire.save();
      console.log("Réservation annulée avec succès par le touriste");
      res.status(200).json({ success: true, message: 'Réservation annulée avec succès par le touriste' });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la réservation par le touriste:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation de la réservation' });
    }
  }

  async envoyerEmailTouriste(req: Request, res: Response): Promise<void> {
    try {
      const emailData = req.body;
      await (await import('../fonction/Fonction')).default.sendContactOrganisateurMail(emailData);
      res.status(200).json({ success: true, message: 'Email envoyé avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email au touriste:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email', error: error instanceof Error ? error.message : error });
    }
  }

}

export const reservationControllerInstance = new ReservationController();