import { Request, Response } from "express";
import axios from "axios";
import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
import { dbConnection } from "../BDconnection/BDconnection";
import { Touristes } from "../models/Touriste";

dotenv.config();

interface AuthRequest extends Request {
  touriste?: { _id: string };
}

interface GuideResponse {
  ville: string;
  position: {
    latitude: number;
    longitude: number;
  };
  interest: string,
  response: {
    text: string;
    pois: Array<{
      name: string;
      type: string;
      description: string;
      location: {
        latitude: number;
        longitude: number;
      };
    }>;
  };
  timestamp: Date;
}

interface Session {
  _id: Types.ObjectId;
  date_debut: Date;
  date_fin?: Date;
  duree?: number;
  mode: 'Live' | 'Itinéraire Personnalisé';
  montant: number;
  statut_paiement: 'En attente' | 'Complété' | 'Échoué' | 'Remboursé';
  transaction_id?: string;
  guide_responses?: GuideResponse[];
}

class GuideIAController {
  private PYTHON_API_URL: string;

  constructor() {
    // Initialize the URL in the constructor
    this.PYTHON_API_URL = 'http://localhost:8000';
    
    // Bind all methods to preserve 'this' context
    this.demarrerSession = this.demarrerSession.bind(this);
    this.guideLive = this.guideLive.bind(this);
    this.guideTrajet = this.guideTrajet.bind(this);
    this.terminerSession = this.terminerSession.bind(this);
    this.mettreAJourPreferences = this.mettreAJourPreferences.bind(this);
    this.getGuideResponses = this.getGuideResponses.bind(this);
  }

  async demarrerSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { mode } = req.body;
      const touristeId = req.touriste?._id;

      if (!touristeId || !Types.ObjectId.isValid(touristeId)) {
        res.status(400).json({ success: false, message: 'ID touriste invalide' });
        return;
      }

      const touriste = await Touristes.findById(touristeId);
      if (!touriste) {
        res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        return;
      }

      const sessionId = new mongoose.Types.ObjectId();

      await Touristes.updateOne(
        { _id: touristeId },
        {
          $push: {
            "pack_ia.sessions": {
              _id: sessionId,
              date_debut: new Date(),
              mode,
              statut_paiement: 'En attente'
            }
          },
          $set: {
            "pack_ia.mode": mode,
            "pack_ia.actif": true,
            "pack_ia.derniere_utilisation": new Date()
          }
        }
      );

      res.status(200).json({
        success: true,
        sessionId: sessionId.toString(),
        message: 'Session démarrée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors du démarrage de la session:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  async guideLive(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('API URL used:', this.PYTHON_API_URL); // Debug log
      
      const { currentLocation, speed, interests, narrationStyle, voiceType, sessionId,ville } = req.body;
      const touristeId = req.touriste?._id;

      // Vérification de la session
      const touriste = await Touristes.findOne({
        _id: touristeId,
        "pack_ia.sessions._id": sessionId
      });

      if (!touriste) {
        res.status(404).json({ success: false, message: 'Session non trouvée' });
        return;
      }

      // Préparation de la requête pour l'API Python
      const pythonRequest = {
        current_location: {
          latitude: currentLocation.latitude,  // Assurez-vous que c'est 'lat' dans votre frontend
          longitude: currentLocation.longitude  // Assurez-vous que c'est 'lon' dans votre frontend
        },
        interests: interests,
        speed: speed || null,
        narration_style: narrationStyle || null,
        voice_type: voiceType || null,
      };

      console.log('Requête envoyée à Python:', pythonRequest);

      // Appel à l'API Python
      const response = await axios.post(
        `${this.PYTHON_API_URL}/guides/live-guide`,
        pythonRequest,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Réponse de Python:", response.data);

      // Stocker la réponse dans la base de données
      await Touristes.updateOne(
        {
          _id: touristeId,
          "pack_ia.sessions._id": sessionId
        },
        {
          $push: {
            "pack_ia.sessions.$.guide_responses": {
              ville: ville,
              position: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude
              },
              interest: interests[0] || '',
              response: {
                text: response.data.guide_text || '',
                pois: response.data.pois || []
              },
              timestamp: new Date()
            }
          }
        }
      );

      res.status(200).json({ success: true, ...response.data });
    } catch (error) {
      console.error('Erreur guide live:', error);
      if (axios.isAxiosError(error)) {
        // Gestion spécifique des erreurs Axios
        const status = error.response?.status || 500;
        const message = error.response?.data?.detail || 'Erreur serveur';
        res.status(status).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
      }
    }
  }

  async guideTrajet(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { adresseDepart, adresseArrivee, interests, narrationStyle, voiceType, sessionId } = req.body;
      const touristeId = req.touriste?._id;

      const touriste = await Touristes.findOne({
        _id: touristeId,
        "pack_ia.sessions._id": sessionId
      });

      if (!touriste) {
        res.status(404).json({ success: false, message: 'Session non trouvée' });
        return;
      }

      const response = await axios.post(`${this.PYTHON_API_URL}/guides/route-guide`, {
        start_address: adresseDepart,
        end_address: adresseArrivee,
        interests,
        narration_style: narrationStyle,
        voice_type: voiceType
      });

      res.status(200).json({ success: true, ...response.data });
    } catch (error) {
      console.error('Erreur guide trajet:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  async terminerSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId, duree } = req.body;
      const touristeId = req.touriste?._id;

      const result = await Touristes.updateOne(
        {
          _id: touristeId,
          "pack_ia.sessions._id": sessionId
        },
        {
          $set: {
            "pack_ia.sessions.$.date_fin": new Date(),
            "pack_ia.sessions.$.duree": duree,
            "pack_ia.sessions.$.statut_paiement": 'Complété'
          }
        }
      );

      if (result.modifiedCount === 0) {
        res.status(404).json({ success: false, message: 'Session non trouvée' });
        return;
      }

      res.status(200).json({ success: true, message: 'Session terminée avec succès' });
    } catch (error) {
      console.error('Erreur fin session:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  async mettreAJourPreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { preferences } = req.body;
      const touristeId = req.touriste?._id;

      await Touristes.updateOne(
        { _id: touristeId },
        {
          $set: {
            "preferences.guide_ia": {
              interest: preferences.interest || '',
              narrationStyle: preferences.narrationStyle || null,
              voiceType: preferences.voiceType || null,
              speed: preferences.speed || null
            }
          }
        }
      );

      res.status(200).json({ success: true, message: 'Préférences mises à jour avec succès' });
    } catch (error) {
      console.error('Erreur maj préférences:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  async getGuideResponses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const touristeId = req.touriste?._id;
      const { sessionId } = req.query;

      if (!touristeId) {
        res.status(401).json({ success: false, message: 'Non autorisé' });
        return;
      }

      const query: any = { _id: touristeId };
      if (sessionId) {
        query["pack_ia.sessions._id"] = sessionId;
      }

      const touriste: any = await Touristes.findOne(query);

      if (!touriste || !touriste.pack_ia || !touriste.pack_ia.sessions) {
        res.status(404).json({ success: false, message: 'Touriste non trouvé ou pas de sessions' });
        return;
      }

      let responses: any[] = [];

      // Parcourir les sessions
      for (const session of touriste.pack_ia.sessions) {
        // Si un sessionId est spécifié, ne traiter que cette session
        if (sessionId && session._id.toString() !== sessionId) {
          continue;
        }

        // Si la session a des réponses, les ajouter
        if (session.guide_responses && Array.isArray(session.guide_responses)) {
          for (const response of session.guide_responses) {
            // Enrichir les POIs avec les données de la collection enriched_pois
            const enrichedPois = await Promise.all(
              response.response.pois.map(async (poiId: string) => {
                const enrichedPoi = await mongoose.connection.db
                  .collection('enriched_pois')
                  .findOne({ _id: new mongoose.Types.ObjectId(poiId) }, { projection: { _id: 0 } });
                return enrichedPoi || { id: poiId };
              })
            );

            responses.push({
              sessionId: session._id,
              date: session.date_debut,
              ville: response.ville,
              position: response.position,
              interest: response.interest,
              response: {
                text: response.response.text,
                pois: enrichedPois
              },
              timestamp: response.timestamp
            });
          }
        }
      }

      res.status(200).json({
        success: true,
        responses: responses
      });
    } catch (error) {
      console.error('Erreur récupération réponses:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

export const GuideIAControllerInstance = new GuideIAController();