"use strict";
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
exports.ControllerMargeInstance = void 0;
const marge_1 = require("../models/marge");
const BDconnection_1 = require("../BDconnection/BDconnection");
const mongoose_1 = __importDefault(require("mongoose"));
const Partenaire_1 = require("../models/Partenaire");
const Touriste_1 = require("../models/Touriste");
const Chauffeure_1 = require("../models/Chauffeure");
class MargeController {
    createMarge(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                console.log('req.body', req.body);
                console.log(req.user);
                const idtour = req.body.tourId;
                const id = req.user;
                const partenaire = yield Partenaire_1.Partenaires.findOne({ 'tours._id': idtour });
                if (!partenaire) {
                    res.status(404).json({ error: 'Tour non trouvé' });
                    return;
                }
                partenaire.tours.forEach((tour) => {
                    if (tour._id.toString() === idtour) {
                        tour.commission = req.body.pourcentage;
                    }
                });
                yield partenaire.save();
                res.status(201).json({
                    success: true,
                    marge: partenaire
                });
            }
            catch (error) {
                console.log('error', error);
                res.status(500).json({
                    success: false,
                    error: error
                });
            }
        });
    }
    getAllMarges(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const partenaire = yield Partenaire_1.Partenaires.find();
                const marges = partenaire.map((partenaire) => {
                    return partenaire.tours.map((tour) => {
                        if (tour.commission) {
                            return tour;
                        }
                    });
                }).flat();
                console.log('marges', marges);
                res.status(200).json({ success: true, marges: marges });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error });
            }
        });
    }
    getMargesByTourId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { tourId } = req.params;
                const marges = yield marge_1.Marge.find({ tourId });
                res.status(200).json({
                    success: true,
                    marges: marges
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la recherche des marges'
                });
            }
        });
    }
    getMargeStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("getMargeStats called");
            try {
                // S'assurer que la connexion à la base de données est établie
                if (mongoose_1.default.connection.readyState !== 1) {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                // Calculer la marge moyenne active
                const marges = yield marge_1.Marge.find({ actif: true });
                const margeMoyenne = marges.length
                    ? marges.reduce((acc, marge) => acc + marge.pourcentage, 0) / marges.length
                    : 0;
                // Statistiques simplifées pour éviter les erreurs
                const stats = {
                    margeMoyenne,
                    revenuTotal: 0,
                    partenaireTotal: 0,
                    beneficeTotal: 0
                };
                res.status(200).json({
                    success: true,
                    stats: stats
                });
            }
            catch (error) {
                console.error("Erreur dans getMargeStats:", error);
                res.status(500).json({
                    success: false,
                    message: "Une erreur est survenue lors du calcul des statistiques",
                    error: error instanceof Error ? error.message : "Erreur inconnue"
                });
            }
        });
    }
    applyGlobalMarge(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { pourcentage } = req.body;
                const partenaire = yield Partenaire_1.Partenaires.find();
                partenaire.forEach((partenaire) => __awaiter(this, void 0, void 0, function* () {
                    partenaire.tours.forEach((tour) => {
                        tour.commission = pourcentage;
                    });
                    yield partenaire.save();
                }));
                console.log('partenaire', partenaire);
                res.status(200).json({ success: true, message: 'Marge globale appliquée avec succès' });
            }
            catch (error) {
                console.error("Erreur lors de l'application de la marge globale:", error);
                res.status(500).json({
                    success: false,
                    message: "Une erreur est survenue lors de l'application de la marge globale",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }
    statMarge(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const partenaires = yield Partenaire_1.Partenaires.find();
                const touriste = yield Touriste_1.Touristes.find();
                const chauffeurs = yield Chauffeure_1.Chauffeurs.find();
                const reservationsConfirmees = [];
                for (const partenaire of partenaires) {
                    if (!partenaire.tours || !Array.isArray(partenaire.tours))
                        continue;
                    for (const tour of partenaire.tours) {
                        if (!tour.jours || !Array.isArray(tour.jours))
                            continue;
                        for (const jour of tour.jours) {
                            if (!jour.reservations || !Array.isArray(jour.reservations))
                                continue;
                            for (const reservation of jour.reservations) {
                                if (reservation.statut !== 'confirmée')
                                    continue;
                                const touristeCorrespondant = touriste.find(t => t._id && reservation.client_id &&
                                    t._id.toString() === reservation.client_id.toString());
                                const matricule = ((_a = touristeCorrespondant === null || touristeCorrespondant === void 0 ? void 0 : touristeCorrespondant.info) === null || _a === void 0 ? void 0 : _a.matricule_taxi) || 'Non trouvé';
                                const chauffeurCorrespondant = chauffeurs.find(chauffeur => { var _a; return ((_a = chauffeur.info) === null || _a === void 0 ? void 0 : _a.matricule) === matricule; });
                                reservationsConfirmees.push({
                                    reservationId: reservation._id,
                                    partenaireId: partenaire._id,
                                    partenaireName: ((_c = (_b = partenaire.information) === null || _b === void 0 ? void 0 : _b.inforegester) === null || _c === void 0 ? void 0 : _c.nom_entreprise) || 'Non spécifié',
                                    tourId: tour._id,
                                    jourId: jour._id,
                                    clientId: reservation.client_id,
                                    matriculeTouriste: matricule,
                                    nomCompletTouriste: ((_d = touristeCorrespondant === null || touristeCorrespondant === void 0 ? void 0 : touristeCorrespondant.info) === null || _d === void 0 ? void 0 : _d.nom_complet) || 'Non trouvé',
                                    prix_total: reservation.prix_total || 0,
                                    commission: tour.commission || 20,
                                    commission_montant: ((reservation.prix_total || 0) * (tour.commission || 20)) / 100,
                                    chauffeurID: chauffeurCorrespondant === null || chauffeurCorrespondant === void 0 ? void 0 : chauffeurCorrespondant._id,
                                    chauffeurname: ((_e = chauffeurCorrespondant === null || chauffeurCorrespondant === void 0 ? void 0 : chauffeurCorrespondant.info) === null || _e === void 0 ? void 0 : _e.nom_complet) || 'Non trouvé'
                                });
                            }
                        }
                    }
                }
                const prixmarge = reservationsConfirmees.reduce((acc, reservation) => acc + (reservation.prix_total || 0), 0);
                let prixlowxy = 0;
                const partenairegagnant = [];
                const chauffeurgagant = [];
                for (const reservation of reservationsConfirmees) {
                    const commissionMontant = (reservation.prix_total * (reservation.commission / 2)) / 100;
                    prixlowxy += commissionMontant;
                    // Gestion des partenaires
                    const partenaireIndex = partenairegagnant.findIndex(p => p._id.toString() === reservation.partenaireId.toString());
                    if (partenaireIndex === -1) {
                        partenairegagnant.push({
                            _id: reservation.partenaireId,
                            nom: reservation.partenaireName,
                            prix: reservation.prix_total - commissionMontant
                        });
                    }
                    else {
                        partenairegagnant[partenaireIndex].prix += reservation.prix_total - commissionMontant;
                    }
                    // Gestion des chauffeurs
                    if (reservation.chauffeurID) {
                        const chauffeurIndex = chauffeurgagant.findIndex(c => c._id.toString() === reservation.chauffeurID.toString());
                        if (chauffeurIndex === -1) {
                            chauffeurgagant.push({
                                _id: reservation.chauffeurID,
                                nom: reservation.chauffeurname,
                                prix: commissionMontant
                            });
                        }
                        else {
                            chauffeurgagant[chauffeurIndex].prix += commissionMontant;
                        }
                    }
                }
                res.status(200).json({
                    success: true,
                    prixTotal: prixmarge,
                    partenaireGagnant: partenairegagnant,
                    prixlowxy: prixlowxy,
                    chauffeurGagant: chauffeurgagant
                });
            }
            catch (error) {
                console.error('Erreur dans statMarge:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Erreur inconnue'
                });
            }
        });
    }
}
exports.ControllerMargeInstance = new MargeController();
