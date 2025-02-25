import mongoose, { Schema, Document, Types } from 'mongoose';
import  IChauffeurs  from '../Interface/Interfacechauffeur';
// Interface pour le chauffeur

// Schéma Mongoose
const ChauffeurSchema = new Schema<IChauffeurs>({
   info: {
       nom_complet: { type: String },
       email: { type: String, unique: true },
       telephone: { type: String },
       motdepasse: { type: String},
       strategy:{type: String,},
       google_id:{type:String},
       facebook_id:{type:String}
   },
   vehicule: {
       matricule: { type: String, required: false },
       modele: { type: String, required: false },
       places: { type: Number, required: false }
   },
   documents: {
       permis: {
           numero: { type: String, required: false },
           expiration: { type: Date, required: false }
       },
       assurance: {
           nom: { type: String, required: false },
           numero: { type: String, required: false },
           expiration: { type: Date, required: false }
       },
       carte_taxi: {
           numero: { type: String, required: false },
           expiration: { type: Date, required: false }
       }
   },
   securites: {
       code: { type: String, required: false },
       date: { type: Date, required: false },
       isverified: { type: Boolean, default: false }
   },
   resetPasswordToken: String,
   resetPasswordTokenExpire: Date
}, {
   timestamps: true
});
ChauffeurSchema.index({ "securites.date": 1 }, { 
    expireAfterSeconds: 10,
    partialFilterExpression: { "securites.isverified": false }
});
ChauffeurSchema.index({ "resetPasswordTokenExpire": 1 }, {
    expireAfterSeconds: 3600})

// Création du modèle
const Chauffeur = mongoose.model<IChauffeurs>('Chauffeur', ChauffeurSchema);

export const Chauffeurs = Chauffeur;