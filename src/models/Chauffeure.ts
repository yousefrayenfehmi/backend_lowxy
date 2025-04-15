import mongoose, { Schema, Document, Types } from 'mongoose';
import  IChauffeurs  from '../Interface/Interfacechauffeur';
// Interface pour le chauffeur

// Schéma Mongoose// Mongoose Schema
const ChauffeurSchema = new Schema<IChauffeurs>({
    info: {
        nom_complet: { type: String },
        email: { type: String, unique: true },
        telephone: { type: String },
        motdepasse: { type: String },
        strategy: { type: String },
        google_id: { type: String },
        naissance: {
            type: Date,
            required: false
        },
        adresse: {
            ville: {
                type: String,
                required: false,
            },
            pays: {
                type: String,
                required: false,
            }
        },
        facebook_id: { type: String },
        matricule: { type: String, required: false, unique: true },
        Rib: { type: String, required: false }
    },
    vehicule: {
        matricule: { type: String, required: false },
        modele: { type: String, required: false },
        places: { type: Number, required: false }
    },
    documents: {
        permis: {
            numero: { type: String, required: false },
            expiration: { type: Date, required: false },
            imagePath: { type: String, required: false } // Image path for permis
        },
        assurance: {
            nom: { type: String, required: false },
            numero: { type: String, required: false },
            expiration: { type: Date, required: false },
            imagePath: { type: String, required: false } // Image path for assurance
        },
        carte_taxi: {
            numero: { type: String, required: false },
            expiration: { type: Date, required: false },
            imagePath: { type: String, required: false } // Image path for carte taxi
        }
    },
    securites: {
        code: { type: String, required: false },
        date: { type: Date, required: false },
        isverified: { type: Boolean, default: false }
    },
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    active_coverings: { type: [Types.ObjectId], required: false },
    covering_history: { type: [Types.ObjectId], required: false }
}, {
    timestamps: true
});

// Index for securites
ChauffeurSchema.index({ "securites.date": 1 }, { 
    expireAfterSeconds: 900,
    partialFilterExpression: { "securites.isverified": false }
});


// Création du modèle
const Chauffeur = mongoose.model<IChauffeurs>('Chauffeur', ChauffeurSchema);

export const Chauffeurs = Chauffeur;