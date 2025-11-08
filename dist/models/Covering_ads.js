"use strict";
// models/CoveringAd.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoveringAd = void 0;
const mongoose_1 = require("mongoose");
const CoveringAdSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    creator: {
        type: { type: String, enum: ['partenaire', 'client'], required: true },
        id: { type: mongoose_1.Schema.Types.ObjectId, required: true, refPath: 'creator.type' }
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
        enum: ['Active', 'Completed', 'Pending'],
        default: 'Pending'
    },
    assigned_taxis: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Taxi' }],
}, { timestamps: true });
// Indexes pour améliorer les performances des requêtes
CoveringAdSchema.index({ 'creator.type': 1, 'creator.id': 1 });
CoveringAdSchema.index({ status: 1 });
exports.CoveringAd = (0, mongoose_1.model)('CoveringAd', CoveringAdSchema);
