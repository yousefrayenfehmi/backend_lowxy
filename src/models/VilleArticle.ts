import mongoose, { Schema, Document } from 'mongoose';
import { IPointInteret } from '../Interface/InterfaceVilleAticle.';

export interface IPointInteretDocument extends IPointInteret, Document {}

const PointInteretSchema: Schema<IPointInteretDocument> = new Schema({
    nom_lieu: {
        type: String,
        required: true,
        trim: true
    },
    categorie: {
        type: String,
        required: true,
        enum: ['all', 'restaurants', 'hotels', 'concerts', 'spectacles']
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    url_image: {
        type: String,
        required: true,
        trim: true
    },
    texte_alternatif: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    ville: {
        type: String,
        required: true,
        trim: true
    },
    pays: {
        type: String,
        required: true,
        trim: true
    },
    adresse: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

export const PointInteret = mongoose.model<IPointInteretDocument>('PointInteret', PointInteretSchema);