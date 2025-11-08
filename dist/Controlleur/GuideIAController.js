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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuideIAControllerInstance = void 0;
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importStar(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Touriste_1 = require("../models/Touriste");
dotenv_1.default.config();
class GuideIAController {
    constructor() {
        // Initialize the URL in the constructor
        this.PYTHON_API_URL = 'http://localhost:8000';
        // Bind all methods to preserve 'this' context
        this.demarrerSession = this.demarrerSession.bind(this);
        this.guideLive = this.guideLive.bind(this);
        this.guideTrajet = this.guideTrajet.bind(this);
        this.terminerSession = this.terminerSession.bind(this);
        this.mettreAJourPreferences = this.mettreAJourPreferences.bind(this);
        this.getGuideResponses = this.getGuideResponses.bind(this);
    }
    demarrerSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { mode } = req.body;
                const touristeId = (_a = req.touriste) === null || _a === void 0 ? void 0 : _a._id;
                if (!touristeId || !mongoose_1.Types.ObjectId.isValid(touristeId)) {
                    res.status(400).json({ success: false, message: 'ID touriste invalide' });
                    return;
                }
                const touriste = yield Touriste_1.Touristes.findById(touristeId);
                if (!touriste) {
                    res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
                    return;
                }
                const sessionId = new mongoose_1.default.Types.ObjectId();
                yield Touriste_1.Touristes.updateOne({ _id: touristeId }, {
                    $push: {
                        "pack_ia.sessions": {
                            _id: sessionId,
                            date_debut: new Date(),
                            mode,
                            statut_paiement: 'En attente'
                        }
                    },
                    $set: {
                        "pack_ia.mode": mode,
                        "pack_ia.actif": true,
                        "pack_ia.derniere_utilisation": new Date()
                    }
                });
                res.status(200).json({
                    success: true,
                    sessionId: sessionId.toString(),
                    message: 'Session démarrée avec succès'
                });
            }
            catch (error) {
                console.error('Erreur lors du démarrage de la session:', error);
                res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
        });
    }
    guideLive(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                console.log('API URL used:', this.PYTHON_API_URL); // Debug log
                const { currentLocation, speed, interests, narrationStyle, voiceType, sessionId, ville } = req.body;
                const touristeId = (_a = req.touriste) === null || _a === void 0 ? void 0 : _a._id;
                // Vérification de la session
                const touriste = yield Touriste_1.Touristes.findOne({
                    _id: touristeId,
                    "pack_ia.sessions._id": sessionId
                });
                if (!touriste) {
                    res.status(404).json({ success: false, message: 'Session non trouvée' });
                    return;
                }
                // Préparation de la requête pour l'API Python
                const pythonRequest = {
                    current_location: {
                        latitude: currentLocation.latitude, // Assurez-vous que c'est 'lat' dans votre frontend
                        longitude: currentLocation.longitude // Assurez-vous que c'est 'lon' dans votre frontend
                    },
                    interests: interests,
                    speed: speed || null,
                    narration_style: narrationStyle || null,
                    voice_type: voiceType || null,
                };
                console.log('Requête envoyée à Python:', pythonRequest);
                // Appel à l'API Python
                const response = yield axios_1.default.post(`${this.PYTHON_API_URL}/guides/live-guide`, pythonRequest, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log("Réponse de Python:", response.data);
                // Stocker la réponse dans la base de données
                yield Touriste_1.Touristes.updateOne({
                    _id: touristeId,
                    "pack_ia.sessions._id": sessionId
                }, {
                    $push: {
                        "pack_ia.sessions.$.guide_responses": {
                            ville: ville,
                            position: {
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude
                            },
                            interest: interests[0] || '',
                            response: {
                                text: response.data.guide_text || '',
                                pois: response.data.pois || []
                            },
                            timestamp: new Date()
                        }
                    }
                });
                res.status(200).json(Object.assign({ success: true }, response.data));
            }
            catch (error) {
                console.error('Erreur guide live:', error);
                if (axios_1.default.isAxiosError(error)) {
                    // Gestion spécifique des erreurs Axios
                    const status = ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500;
                    const message = ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.detail) || 'Erreur serveur';
                    res.status(status).json({ success: false, message });
                }
                else {
                    res.status(500).json({ success: false, message: 'Erreur serveur' });
                }
            }
        });
    }
    guideTrajet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { adresseDepart, adresseArrivee, interests, narrationStyle, voiceType, sessionId } = req.body;
                const touristeId = (_a = req.touriste) === null || _a === void 0 ? void 0 : _a._id;
                const touriste = yield Touriste_1.Touristes.findOne({
                    _id: touristeId,
                    "pack_ia.sessions._id": sessionId
                });
                if (!touriste) {
                    res.status(404).json({ success: false, message: 'Session non trouvée' });
                    return;
                }
                const response = yield axios_1.default.post(`${this.PYTHON_API_URL}/guides/route-guide`, {
                    start_address: adresseDepart,
                    end_address: adresseArrivee,
                    interests,
                    narration_style: narrationStyle,
                    voice_type: voiceType
                });
                res.status(200).json(Object.assign({ success: true }, response.data));
            }
            catch (error) {
                console.error('Erreur guide trajet:', error);
                res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
        });
    }
    terminerSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { sessionId, duree } = req.body;
                const touristeId = (_a = req.touriste) === null || _a === void 0 ? void 0 : _a._id;
                const result = yield Touriste_1.Touristes.updateOne({
                    _id: touristeId,
                    "pack_ia.sessions._id": sessionId
                }, {
                    $set: {
                        "pack_ia.sessions.$.date_fin": new Date(),
                        "pack_ia.sessions.$.duree": duree,
                        "pack_ia.sessions.$.statut_paiement": 'Complété'
                    }
                });
                if (result.modifiedCount === 0) {
                    res.status(404).json({ success: false, message: 'Session non trouvée' });
                    return;
                }
                res.status(200).json({ success: true, message: 'Session terminée avec succès' });
            }
            catch (error) {
                console.error('Erreur fin session:', error);
                res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
        });
    }
    mettreAJourPreferences(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { preferences } = req.body;
                const touristeId = (_a = req.touriste) === null || _a === void 0 ? void 0 : _a._id;
                yield Touriste_1.Touristes.updateOne({ _id: touristeId }, {
                    $set: {
                        "preferences.guide_ia": {
                            interest: preferences.interest || '',
                            narrationStyle: preferences.narrationStyle || null,
                            voiceType: preferences.voiceType || null,
                            speed: preferences.speed || null
                        }
                    }
                });
                res.status(200).json({ success: true, message: 'Préférences mises à jour avec succès' });
            }
            catch (error) {
                console.error('Erreur maj préférences:', error);
                res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
        });
    }
    getGuideResponses(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const touristeId = (_a = req.touriste) === null || _a === void 0 ? void 0 : _a._id;
                const { sessionId } = req.query;
                if (!touristeId) {
                    res.status(401).json({ success: false, message: 'Non autorisé' });
                    return;
                }
                const query = { _id: touristeId };
                if (sessionId) {
                    query["pack_ia.sessions._id"] = sessionId;
                }
                const touriste = yield Touriste_1.Touristes.findOne(query);
                if (!touriste || !touriste.pack_ia || !touriste.pack_ia.sessions) {
                    res.status(404).json({ success: false, message: 'Touriste non trouvé ou pas de sessions' });
                    return;
                }
                let responses = [];
                // Parcourir les sessions
                for (const session of touriste.pack_ia.sessions) {
                    // Si un sessionId est spécifié, ne traiter que cette session
                    if (sessionId && session._id.toString() !== sessionId) {
                        continue;
                    }
                    // Si la session a des réponses, les ajouter
                    if (session.guide_responses && Array.isArray(session.guide_responses)) {
                        for (const response of session.guide_responses) {
                            // Enrichir les POIs avec les données de la collection enriched_pois
                            const enrichedPois = yield Promise.all(response.response.pois.map((poiId) => __awaiter(this, void 0, void 0, function* () {
                                const enrichedPoi = yield mongoose_1.default.connection.db
                                    .collection('enriched_pois')
                                    .findOne({ _id: new mongoose_1.default.Types.ObjectId(poiId) }, { projection: { _id: 0 } });
                                return enrichedPoi || { id: poiId };
                            })));
                            responses.push({
                                sessionId: session._id,
                                date: session.date_debut,
                                ville: response.ville,
                                position: response.position,
                                interest: response.interest,
                                response: {
                                    text: response.response.text,
                                    pois: enrichedPois
                                },
                                timestamp: response.timestamp
                            });
                        }
                    }
                }
                res.status(200).json({
                    success: true,
                    responses: responses
                });
            }
            catch (error) {
                console.error('Erreur récupération réponses:', error);
                res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
        });
    }
}
exports.GuideIAControllerInstance = new GuideIAController();
