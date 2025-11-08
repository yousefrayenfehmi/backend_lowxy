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
exports.Partenaires = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const partenaireSchema = new mongoose_1.Schema({
    information: {
        inforegester: {
            nom_entreprise: {
                type: String,
                required: true
            },
            Proprietaire: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true,
                unique: true
            },
            telephone: {
                type: String,
                required: true
            },
            motdepasse: {
                type: String,
                required: true
            }
        },
        info_societe: {
            numero_siret: {
                type: String,
            },
            domaines: [String],
            adresse: {
                pays: { type: String },
                ville: { type: String },
                rue: { type: String }
            },
            rib: { type: String },
            tva: { type: String }
        }
    },
    tours: [{
            nom: String,
            description: String,
            ville: String,
            duree: Number,
            itineraire: {
                depart: String,
                arrivee: String,
                plan: String
            },
            images: [String],
            commission: { type: Number, required: true, default: 20 },
            jours: [{
                    date: Date,
                    depart: String,
                    capacite: {
                        adultes: Number,
                        enfants: Number
                    },
                    prix: {
                        adulte: { type: Number, required: true },
                        enfant: { type: Number, required: true }
                    },
                    supplements: [String],
                    reservations: [{
                            client_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client' },
                            date: Date,
                            participants: {
                                adultes: Number,
                                enfants: Number
                            },
                            prix_total: Number,
                            // Nouveaux champs pour la gestion des paiements
                            statut: {
                                type: String,
                                enum: ['en attente de paiement', 'confirmée', 'annulée'],
                                default: 'en attente de paiement'
                            },
                            payment_id: { type: String },
                            payment_date: { type: Date }
                        }]
                }]
        }],
    covering_ads: [{
            image: { type: String },
            modele_voiture: { type: String },
            type_covering: { type: String },
            nombre_taxi: { type: Number },
            nombre_jour: { type: Number },
            prix: { type: Number }
        }],
    pub_quiz: [{
            bannieres: [String],
            videos: [String],
            call_to_action: [String],
            keywords: [Array],
            periode: {
                debut: Date,
                fin: Date
            },
            Budget_totale: { type: Number },
            statu: { type: String, required: true, default: 'pending' },
            impressions: { type: Number },
            clicks: { type: Number },
            facturation: { type: String },
        }],
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
// Index
partenaireSchema.index({ 'inforamtion.inforegester.email': 1 }, { unique: true });
// TTL Index
partenaireSchema.index({ "resetPasswordTokenExpire": 1 }, { expireAfterSeconds: 3600 });
// TTL Index
partenaireSchema.index({ "securites.date": 1 }, {
    expireAfterSeconds: 900,
    partialFilterExpression: { "securites.isverified": false }
});
const Partenaire = mongoose_1.default.model('partenaire', partenaireSchema);
exports.Partenaires = Partenaire;
