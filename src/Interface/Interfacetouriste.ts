import { Document, Types } from 'mongoose';

// Interface pour les questions du quiz
interface QuestionQuiz {
  id: number;
  question: string;
  reponseSelectionnee: string;
  reponseCorrecte: string;
  estCorrect: boolean;
  facture: string;
}

// Interface pour le résultat d'un quiz
interface ResultatQuiz {
  _id?: Types.ObjectId;
  matriculeTaxi: string;
  questions: QuestionQuiz[];
  aGagne: boolean;
  nombreReponsesCorrectes: number;
  totalQuestions: number;
  lieu: string;
  dateQuiz: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ITouriste extends Document {
  _id: Types.ObjectId;
  
  securites: {
    code?: string;
    date?: Date;
    isverified: boolean;
  };
  
  info: {
    nom_complet: string;
    email: string;
    motdepasse: string;
    telephone: string;
    naissance: Date;
    adresse: {
      ville: string;
      pays: string;
    };
    strategy: string;
    google_id: string;
    facebook_id: string;
    Rib: string;
    matricule_taxi: string;
  };
  
  resetPasswordToken?: string;
  resetPasswordTokenExpire?: Date | null;
  
  preferences: {
    langue?: string;
    langue_preferee?: string;
    centres_interet?: string[];
    guide_ia?: {
      narration: 'Sérieux' | 'Humoristique' | 'Familial' | 'Poétique';
      voix: {
        genre: 'Femme' | 'Homme' | 'Neutre';
        age: 'Jeune' | 'Adulte' | 'Âgé';
        style: 'Neutre' | 'Charismatique' | 'Amusante';
      };
      references_culturelles: boolean;
    };
  };
  
  pack_ia: {
    actif: boolean;
    mode?: 'Live' | 'Itinéraire Personnalisé';
    derniere_utilisation?: Date;
    historique_trajets?: Array<{
      depart: {
        adresse: string;
        latitude: number;
        longitude: number;
      };
      arrivee: {
        adresse: string;
        latitude: number;
        longitude: number;
      };
      date?: Date;
      duree?: number;
      distance?: number;
      points_interet_visites?: Array<{
        nom: string;
        type: string;
        description: string;
        latitude: number;
        longitude: number;
      }>;
    }>;
    sessions?: Array<{
      date_debut?: Date;
      date_fin?: Date;
      duree?: number;
      mode?: 'Live' | 'Itinéraire Personnalisé';
      montant?: number;
      statut_paiement?: 'En attente' | 'Complété' | 'Échoué' | 'Remboursé';
      transaction_id?: string;
      guide_responses?: Array<{
        ville: string;
        position: {
          latitude: number;
          longitude: number;
        };
        interest: string;
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
      }>;
    }>;
  };
  
  // Nouvelle partie pour l'historique des quiz
  historique_quiz?: ResultatQuiz[];
}

export default ITouriste;