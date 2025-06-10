import { Document, Types } from 'mongoose';

// Interface pour les questions du quiz
interface QuestionQuiz {
  id: number;
  question: string;
  reponseSelectionnee: string;
  reponseCorrecte: string;
  estCorrect: boolean;
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
  facture: string;
  prix: number;
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
    activites?: string[];
  };
  
  pack_ia: {
    actif: boolean;
    mode?: 'Live' | 'Itinéraire Personnalisé';
    preferences?: string[];
  };
  
  // Nouvelle partie pour l'historique des quiz
  historique_quiz?: ResultatQuiz[];
}

export default ITouriste;