"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chauffeurs = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Interface pour le chauffeur
// Schéma Mongoose// Mongoose Schema
const ChauffeurSchema = new mongoose_1.Schema({
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
        marque: { type: String, required: false },
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
    active_coverings: { type: [{ id: { type: mongoose_1.Types.ObjectId, required: false }, date_debut: { type: Date, required: false }, date_fin: { type: Date, required: false }, status: { type: String, required: false } }], required: false },
    covering_history: { type: [mongoose_1.Types.ObjectId], required: false }
}, {
    timestamps: true
});
// Index for securites
ChauffeurSchema.index({ "securites.date": 1 }, {
    expireAfterSeconds: 900,
    partialFilterExpression: { "securites.isverified": false }
});
// Création du modèle
const Chauffeur = mongoose_1.default.model('Chauffeur', ChauffeurSchema);
exports.Chauffeurs = Chauffeur;
