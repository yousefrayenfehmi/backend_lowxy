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
exports.QuestionBanks = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QuestionBankSchema = new mongoose_1.Schema({
    question: {
        type: String,
        required: [true, 'La question est obligatoire'],
        trim: true
    },
    ville_concernee: {
        type: String,
        required: [true, 'La ville est obligatoire'],
        trim: true
    },
    reponse_correcte: {
        type: String,
        required: [true, 'La réponse correcte est obligatoire'],
        trim: true
    },
    options: [{
            type: String,
            required: [true, 'Les options sont obligatoires'],
            trim: true
        }],
    latitude: {
        type: Number,
        min: [-90, 'La latitude doit être comprise entre -90 et 90'],
        max: [90, 'La latitude doit être comprise entre -90 et 90']
    },
    name: {
        type: String,
        required: [true, 'Le nom de la monnaie est obligatoire'],
    },
    longitude: {
        type: Number,
        min: [-180, 'La longitude doit être comprise entre -180 et 180'],
        max: [180, 'La longitude doit être comprise entre -180 et 180']
    }
}, {
    timestamps: true
});
// Index sur ville_concernee pour des requêtes plus rapides
QuestionBankSchema.index({ ville_concernee: 1 });
// Middleware de validation
QuestionBankSchema.pre('save', function (next) {
    // Vérifier que la réponse correcte fait partie des options
    if (!this.options.includes(this.reponse_correcte)) {
        return next(new Error('La réponse correcte doit être incluse dans les options'));
    }
    // Si la latitude est fournie, la longitude doit également être fournie et vice versa
    if ((this.latitude !== undefined && this.longitude === undefined) ||
        (this.latitude === undefined && this.longitude !== undefined)) {
        return next(new Error('La latitude et la longitude doivent être fournies ensemble'));
    }
    next();
});
// Méthode pour vérifier si la question concerne une ville spécifique
QuestionBankSchema.methods.estPourVille = function (nomVille) {
    return this.ville_concernee === nomVille;
};
const QuestionBankModel = mongoose_1.default.model('QuestionBank', QuestionBankSchema);
exports.QuestionBanks = QuestionBankModel;
