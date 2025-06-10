
import mongoose, { Schema, model } from 'mongoose';
import {  TourMarge } from '../Interface/Interfacemarge';

const margeSchema = new Schema<TourMarge>({
    tourId: {
      type: String,
      ref: 'Tour',
      required: true
    },
    pourcentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    montantFixe: {
      type: Number,
      default: 0,
      min: 0
    },
    dateModification: {
      type: Date,
      default: Date.now
    },
    modifiePar: {
      type: String,
      required: true
    },
    actif: {
      type: Boolean,
      default: true
    }
  });

export const Marge = mongoose.model('Marge', margeSchema);

