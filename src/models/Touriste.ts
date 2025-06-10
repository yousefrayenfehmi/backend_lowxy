import mongoose, { CallbackError, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import ITouriste from "../Interface/Interfacetouriste";

// Définir un sous-schéma pour les résultats de quiz
const resultatQuizSchema = new Schema({
  matriculeTaxi: {
    type: String,
    required: true
  },
  questions: [{
    id: Number,
    question: String,
    reponseSelectionnee: String,
    reponseCorrecte: String,
    estCorrect: Boolean
  }],
  aGagne: {
    type: Boolean,
    default: false
  },
  nombreReponsesCorrectes: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  facture: {
    type: String,
    required: false
  },
  prix: {
    type: Number,
    required: false
  },
  lieu: String,
  dateQuiz: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true,
  timestamps: true
});

const touristeSchema = new Schema<ITouriste>({
  securites: {
    code: {
      type: String,
      required: false
    },
    date: {
      type: Date,
      required: false
    },
    isverified: {
      type: Boolean,
      default: false
    }
  },
  info: {
    nom_complet: {
      type: String,
      required: [false]
    },
    email: {
      type: String,
      required: [false],
      unique: true,
    },
    motdepasse: {
      type: String,
      required: [false]
    },
    telephone: {
      type: String,
      required: [false]
    },
    naissance: {
      type: Date,
      required: [false]
    },
    adresse: {
      ville: {
        type: String,
        required: [false],
      },
      pays: {
        type: String,
        required: [false],
      }
    },
    strategy: {
      type: String,
    },
    google_id: {
      type: String
    },
    facebook_id: {
      type: String
    },
    Rib: { type: String },
    matricule_taxi: {
      type: String
    }
  },
  resetPasswordToken: {
    type: String,
    required: false
  },
  resetPasswordTokenExpire: {
    type: Date,
    default: null,
    nullable: true
  },
  preferences: {
    langue: {
      type: String,
      required: false,
    },
    langue_preferee: {
      type: String,
      required: false,
    },
    centres_interet: [{
      type: String,
      trim: true
    }],
    activites: [{
      type: String,
    }],
  },
  pack_ia: {
    actif: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      enum: ['Live', 'Itinéraire Personnalisé']
    },
  },
  // Nouvelle partie pour les quiz
  historique_quiz: [resultatQuizSchema]
}, {
  timestamps: true
});

// Index TTL pour la suppression automatique des comptes non vérifiés
touristeSchema.index({
  "securites.date": 1
}, {
  expireAfterSeconds: 900,
  partialFilterExpression: { "securites.isverified": false }
});

const Touriste = mongoose.model<ITouriste>('Touriste', touristeSchema);

export const Touristes = Touriste;