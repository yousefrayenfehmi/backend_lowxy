// models/CoveringAd.ts

import mongoose, { Schema, model } from 'mongoose';
import { ICoveringAd } from '../Interface/InterfaceCovering_ads';

const CoveringAdSchema: Schema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  creator: {
    type: { type: String, enum: ['partenaire', 'client'], required: true },
    id: { type: Schema.Types.ObjectId, required: true, refPath: 'creator.type' }
  },
  details: {
    modele_voiture: { type: String, required: true },
    type_covering: { type: String, required: true },
    image: { type: String, required: true },
    nombre_taxi: { type: Number, required: true, min: 1 },
    nombre_jour: { type: Number, required: true, min: 1 },
    prix: { type: Number, required: true }
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'annuler', 'pending'],
    default: 'pending'
  },
  assigned_taxis: [{ type: Schema.Types.ObjectId, ref: 'Taxi' }],
 
}, { timestamps: true });

// Indexes pour améliorer les performances des requêtes
CoveringAdSchema.index({ 'creator.type': 1, 'creator.id': 1 });
CoveringAdSchema.index({ status: 1 });

export const CoveringAd = model<ICoveringAd>('CoveringAd', CoveringAdSchema);