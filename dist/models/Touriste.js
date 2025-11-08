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
exports.Touristes = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Définir un sous-schéma pour les résultats de quiz
const resultatQuizSchema = new mongoose_1.Schema({
    matriculeTaxi: {
        type: String,
        required: true
    },
    questions: [{
            id: Number,
            question: String,
            reponseSelectionnee: String,
            reponseCorrecte: String,
            estCorrect: Boolean
        }],
    aGagne: {
        type: Boolean,
        default: false
    },
    nombreReponsesCorrectes: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    facture: {
        type: String,
        required: false
    },
    prix: {
        type: Number,
        required: false
    },
    lieu: String,
    dateQuiz: {
        type: Date,
        default: Date.now
    }
}, {
    _id: true,
    timestamps: true
});
const touristeSchema = new mongoose_1.Schema({
    securites: {
        code: {
            type: String,
            required: false
        },
        date: {
            type: Date,
            required: false
        },
        isverified: {
            type: Boolean,
            default: false
        }
    },
    info: {
        nom_complet: {
            type: String,
            required: [false]
        },
        email: {
            type: String,
            required: [false],
            unique: true,
        },
        motdepasse: {
            type: String,
            required: [false]
        },
        telephone: {
            type: String,
            required: [false]
        },
        naissance: {
            type: Date,
            required: [false]
        },
        adresse: {
            ville: {
                type: String,
                required: [false],
            },
            pays: {
                type: String,
                required: [false],
            }
        },
        strategy: {
            type: String,
        },
        google_id: {
            type: String
        },
        facebook_id: {
            type: String
        },
        rib: { type: String },
        matricule_taxi: {
            type: String
        }
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordTokenExpire: {
        type: Date,
        default: null,
        nullable: true
    },
    preferences: {
        langue: {
            type: String,
            required: false,
        },
        langue_preferee: {
            type: String,
            required: false,
        },
        centres_interet: [{
                type: String,
                trim: true
            }],
        guide_ia: {
            narration: {
                type: String,
                enum: ['Sérieux', 'Humoristique', 'Familial', 'Poétique'],
                default: 'Sérieux'
            },
            voix: {
                genre: {
                    type: String,
                    enum: ['Femme', 'Homme', 'Neutre'],
                    default: 'Neutre'
                },
                age: {
                    type: String,
                    enum: ['Jeune', 'Adulte', 'Âgé'],
                    default: 'Adulte'
                },
                style: {
                    type: String,
                    enum: ['Neutre', 'Charismatique', 'Amusante'],
                    default: 'Neutre'
                }
            },
            references_culturelles: {
                type: Boolean,
                default: true
            }
        }
    },
    pack_ia: {
        actif: {
            type: Boolean,
            default: false
        },
        mode: {
            type: String,
            enum: ['Live', 'Itinéraire Personnalisé'],
            default: 'Live'
        },
        derniere_utilisation: {
            type: Date,
            default: null
        },
        historique_trajets: [{
                depart: {
                    adresse: String,
                    latitude: Number,
                    longitude: Number
                },
                arrivee: {
                    adresse: String,
                    latitude: Number,
                    longitude: Number
                },
                date: {
                    type: Date,
                    default: Date.now
                },
                duree: Number, // en secondes
                distance: Number, // en mètres
                points_interet_visites: [{
                        nom: String,
                        type: String,
                        description: String,
                        latitude: Number,
                        longitude: Number
                    }]
            }],
        sessions: [{
                date_debut: {
                    type: Date,
                    default: Date.now
                },
                date_fin: Date,
                duree: Number,
                mode: {
                    type: String,
                    enum: ['Live', 'Itinéraire Personnalisé'],
                    required: true
                },
                montant: {
                    type: Number,
                    required: true
                },
                statut_paiement: {
                    type: String,
                    enum: ['En attente', 'Complété', 'Échoué', 'Remboursé'],
                    default: 'En attente'
                },
                transaction_id: String,
                guide_responses: [{
                        ville: String,
                        position: {
                            latitude: Number,
                            longitude: Number
                        },
                        interest: String,
                        response: {
                            text: String,
                            pois: [{
                                    name: String,
                                    type: String,
                                    description: String,
                                    location: {
                                        latitude: Number,
                                        longitude: Number
                                    }
                                }]
                        },
                        timestamp: {
                            type: Date,
                            default: Date.now
                        }
                    }]
            }]
    },
    // Nouvelle partie pour les quiz
    historique_quiz: [resultatQuizSchema]
}, {
    timestamps: true
});
// Index TTL pour la suppression automatique des comptes non vérifiés
touristeSchema.index({
    "securites.date": 1
}, {
    expireAfterSeconds: 900,
    partialFilterExpression: { "securites.isverified": false }
});
const Touriste = mongoose_1.default.model('Touriste', touristeSchema);
exports.Touristes = Touriste;
