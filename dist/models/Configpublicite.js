"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const configPubliciteSchema = new mongoose_1.Schema({
    prixClic: { type: Number, required: true },
    prixImpression: { type: Number, required: true },
    tarifParJour: { type: Object, required: true },
});
const ConfigPublicite = (0, mongoose_1.model)('ConfigPublicite', configPubliciteSchema);
exports.default = ConfigPublicite;
