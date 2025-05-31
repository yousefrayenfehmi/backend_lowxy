
import { Document, Types } from 'mongoose';

export interface ICoveringAd extends Document {
  _id: Types.ObjectId;
  creator: {
    type: 'partenaire' | 'client';
    id: Types.ObjectId;
  };
  details: {
    modele_voiture: string;
    type_covering: string;
    image: string;
    nombre_taxi: number;
    nombre_jour: number;
    prix: number;
  };
  status:  'Active' | 'Completed' |  'Pending';
  assigned_taxis: Types.ObjectId[];
}