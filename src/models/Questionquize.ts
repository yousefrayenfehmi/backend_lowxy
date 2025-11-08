import mongoose, { Schema } from 'mongoose';
import IQuestionBank from '../Interface/InterfaceQuestion';

const QuestionBankSchema = new Schema({
  question: {
    type: String,
    required: [true, 'La question est obligatoire'],
    trim: true
  },
  ville_concernee: {
    type: String,
    required: [true, 'La ville est obligatoire'],
    trim: true
  },
  reponse_correcte: {
    type: String,
    required: [true, 'La réponse correcte est obligatoire'],
    trim: true
  },
  options: [{
    type: String,
    required: [true, 'Les options sont obligatoires'],
    trim: true
  }],
  latitude: {
    type: Number,
    min: [-90, 'La latitude doit être comprise entre -90 et 90'],
    max: [90, 'La latitude doit être comprise entre -90 et 90']
  },
  name: {
    type: String,
    required: [true, 'Le nom de la monnaie est obligatoire'],
  },
  longitude: {
    type: Number,
    min: [-180, 'La longitude doit être comprise entre -180 et 180'],
    max: [180, 'La longitude doit être comprise entre -180 et 180']
  }
}, {
  timestamps: true 
});

// Index sur ville_concernee pour des requêtes plus rapides
QuestionBankSchema.index({ ville_concernee: 1 });

// Middleware de validation
QuestionBankSchema.pre('save', function(next) {
  // Vérifier que la réponse correcte fait partie des options
  if (!this.options.includes(this.reponse_correcte)) {
    return next(new Error('La réponse correcte doit être incluse dans les options'));
  }
  
  // Si la latitude est fournie, la longitude doit également être fournie et vice versa
  if ((this.latitude !== undefined && this.longitude === undefined) || 
      (this.latitude === undefined && this.longitude !== undefined)) {
    return next(new Error('La latitude et la longitude doivent être fournies ensemble'));
  }
  
  next();
});

// Méthode pour vérifier si la question concerne une ville spécifique
QuestionBankSchema.methods.estPourVille = function(nomVille: string): boolean {
  return this.ville_concernee === nomVille;
};

const QuestionBankModel = mongoose.model<IQuestionBank>('QuestionBank', QuestionBankSchema);

export const QuestionBanks = QuestionBankModel;