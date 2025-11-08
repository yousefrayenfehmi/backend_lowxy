import { Document, Types } from 'mongoose';

interface IQuestionBank extends Document {
  _id: Types.ObjectId;
  question: string;
  ville_concernee: string;
  reponse_correcte: string;
  options: string[];
  latitude?: number;
  longitude?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Méthode pour vérifier si la question concerne une ville spécifique
  estPourVille(nomVille: string): boolean;
}

export default IQuestionBank;