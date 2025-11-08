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
exports.controllerAdminInstance = void 0;
const Admin_1 = require("../models/Admin");
const BDconnection_1 = require("../BDconnection/BDconnection");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Fonction_1 = __importDefault(require("../fonction/Fonction"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const Touriste_1 = require("../models/Touriste");
const Chauffeure_1 = require("../models/Chauffeure");
const Partenaire_1 = require("../models/Partenaire");
const Covering_ads_1 = require("../models/Covering_ads");
const EmailTemplates_1 = require("../fonction/EmailTemplates");
class Controlleradmin {
    validecovering(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            const { id } = req.params;
            try {
                const covering = yield Covering_ads_1.CoveringAd.findByIdAndUpdate(id, { $set: { status: 'active' } }, { new: true });
                if (!covering) {
                    res.status(404).json({ error: 'Covering non trouvé' });
                    return;
                }
                const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
                const coveringURL = `${baseUrl}/covering-ads-commande`;
                const chauffeurs = yield Chauffeure_1.Chauffeurs.find({ 'vehicule.modele': covering.details.modele_voiture });
                let emailsSent = 0;
                for (const chauffeur of chauffeurs) {
                    yield Fonction_1.default.sendmail(chauffeur.info.email, 'Nouvelle Opportunité Publicitaire pour votre Taxi', EmailTemplates_1.Emailtemplates.getNewCoveringNotification({
                        modele: covering.details.modele_voiture,
                        type: covering.details.type_covering,
                        prix: (covering.details.prix / 2) / covering.details.nombre_taxi
                    }, coveringURL));
                    emailsSent++;
                }
                res.status(200).json({ message: 'Covering validé avec succès' });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la validation du covering' });
            }
        });
    }
    completerprofil(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.params.id;
                let admin = yield Admin_1.Admin.findById(id);
                if (!admin) {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
                const updateFields = {
                    'nom_complet': (_a = req.body.nom_complet) !== null && _a !== void 0 ? _a : admin.nom_complet,
                    'tel': (_b = req.body.tel) !== null && _b !== void 0 ? _b : admin.tel
                };
                const updatedadmin = yield Admin_1.Admin.findByIdAndUpdate(id, { $set: updateFields }, {
                    new: true, // Retourne le document mis à jour
                    runValidators: true // Valide les champs mis à jour
                });
                if (!updatedadmin) {
                    res.status(404).json({ error: 'admin non trouvé' });
                    return;
                }
                res.status(200).json({
                    message: 'Profil mis à jour avec succès',
                    chauffeur: updatedadmin
                });
            }
            catch (error) {
                console.error('Erreur lors de la mise à jour du admin:', error);
                res.status(500).json({
                    error: 'Erreur lors de la mise à jour du admin'
                });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("admin try to login");
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            const { email, mot_de_passe } = req.body;
            console.log(email, mot_de_passe);
            try {
                const admin = yield Admin_1.Admin.findOne({
                    'email': email,
                    'isAdmin': true
                });
                if (!admin) {
                    res.status(404).json({ error: 'Admin non trouvé' });
                    return;
                }
                const match = yield bcryptjs_1.default.compare(mot_de_passe, admin.mot_de_passe);
                if (!match) {
                    res.status(400).json({ error: 'Mot de passe incorrect' });
                    return;
                }
                const token = Fonction_1.default.createtokenetcookies(res, admin._id);
                res.status(200).json({
                    success: true,
                    admin: {
                        _id: admin._id,
                        info: {
                            nom_complet: admin.nom_complet,
                            email: admin.email,
                            tel: admin.tel,
                            type: admin.type
                        }
                    },
                    token
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la connexion' });
            }
        });
    }
    verifyAdminToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("verifyTokenAdmin");
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                });
            }
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            console.log(token);
            if (!token) {
                res.status(401).json({ message: 'Token manquant' });
                return;
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const { id } = decoded;
                const admin = yield Admin_1.Admin.findById(id);
                if (!admin) {
                    res.status(401).json({ message: 'Admin non trouvé' });
                    return;
                }
                console.log("admin Token Verified   ");
                req.user = id;
                res.status(200).json({ message: 'Token valide', userId: id });
            }
            catch (err) {
                res.status(403).json({ message: 'Token invalide' });
            }
        });
    }
    verifyToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("verifyTokenAdmin");
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                });
            }
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            console.log(token);
            if (!token) {
                res.status(401).json({ message: 'Token manquant' });
                return;
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const { id } = decoded;
                const admin = yield Admin_1.Admin.findById(id);
                if (!admin) {
                    res.status(401).json({ message: 'Admin non trouvé' });
                    return;
                }
                console.log("admin Token Verified   ");
                req.user = id;
                next();
            }
            catch (err) {
                res.status(403).json({ message: 'Token invalide' });
            }
        });
    }
    createAdmin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                });
            }
            console.log(req.body);
            const admin = new Admin_1.Admin(req.body);
            console.log(admin);
            try {
                admin.mot_de_passe = yield bcryptjs_1.default.hash(req.body.motdepasse, 10);
                console.log('hash');
                const savedAdmin = yield admin.save();
                console.log('saved');
                res.status(201).json(savedAdmin);
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: "Erreur lors de la création de l'admin" });
            }
        });
    }
    getAllAdmins(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const admins = yield Admin_1.Admin.find();
                if (!admins || admins.length === 0) {
                    res.status(404).json({ error: 'Aucun admin trouvé' });
                    return;
                }
                res.status(200).json(admins);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération des admins' });
            }
        });
    }
    getAdminById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const admin = yield Admin_1.Admin.findById(req.params.id);
                if (!admin) {
                    res.status(404).json({ error: 'Admin non trouvé' });
                    return;
                }
                res.status(200).json(admin);
            }
            catch (error) {
                res.status(500).json({ error: "Erreur lors de la recherche de l'admin" });
            }
        });
    }
    updateAdmin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const admin = yield Admin_1.Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!admin) {
                    res.status(404).json({ error: 'Admin non trouvé' });
                    return;
                }
                res.status(200).json(admin);
            }
            catch (error) {
                res.status(500).json({ error: "Erreur lors de la mise à jour de l'admin" });
            }
        });
    }
    deleteAdmin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const admin = yield Admin_1.Admin.findByIdAndDelete(req.params.id);
                if (!admin) {
                    res.status(404).json({ error: 'Admin non trouvé' });
                    return;
                }
                res.status(200).json(admin);
            }
            catch (error) {
                res.status(500).json({ error: "Erreur lors de la suppression de l'admin" });
            }
        });
    }
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                res.clearCookie('jwt');
                res.status(200).json({
                    success: true,
                    message: 'Déconnexion réussie'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la déconnexion'
                });
            }
        });
    }
    getTouristeNumberbyMatricule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const matricule = req.params.matricule;
                const touriste = yield Touriste_1.Touristes.find({ 'info.matricule_taxi': matricule });
                res.status(200).json(touriste.length);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération du touriste' });
            }
        });
    }
    getStatistics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                // Récupérer les statistiques à partir des collections MongoDB
                const usersCount = yield Touriste_1.Touristes.countDocuments();
                const newUsersCount = yield Touriste_1.Touristes.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
                const driversCount = yield Chauffeure_1.Chauffeurs.countDocuments();
                const newDriversCount = yield Chauffeure_1.Chauffeurs.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
                const partnersCount = yield Partenaire_1.Partenaires.countDocuments();
                const newPartnersCount = yield Partenaire_1.Partenaires.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
                const toursCount = yield Partenaire_1.Partenaires.aggregate([{ $unwind: "$tours" }, { $count: "count" }]);
                const newToursCount = yield Partenaire_1.Partenaires.aggregate([{ $unwind: "$tours" }, { $match: { "tours.jours.date": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }, { $count: "count" }]);
                const adsCount = yield Partenaire_1.Partenaires.aggregate([{ $unwind: "$publicites" }, { $count: "count" }]);
                const newAdsCount = yield Partenaire_1.Partenaires.aggregate([{ $unwind: "$publicites" }, { $match: { "publicites.periode.debut": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }, { $count: "count" }]);
                const adsQuizCount = yield Partenaire_1.Partenaires.aggregate([{ $unwind: "$pub_quiz" }, { $count: "count" }]);
                const newAdsQuizCount = yield Partenaire_1.Partenaires.aggregate([{ $unwind: "$pub_quiz" }, { $match: { "pub_quiz.periode.debut": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }, { $count: "count" }]);
                res.status(200).json({
                    users: usersCount,
                    newUsers: newUsersCount,
                    drivers: driversCount,
                    newDrivers: newDriversCount,
                    partners: partnersCount,
                    newPartners: newPartnersCount,
                    tours: ((_a = toursCount[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
                    newTours: ((_b = newToursCount[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
                    ads: ((_c = adsCount[0]) === null || _c === void 0 ? void 0 : _c.count) || 0,
                    newAds: ((_d = newAdsCount[0]) === null || _d === void 0 ? void 0 : _d.count) || 0,
                    adsQuiz: ((_e = adsQuizCount[0]) === null || _e === void 0 ? void 0 : _e.count) || 0,
                    newAdsQuiz: ((_f = newAdsQuizCount[0]) === null || _f === void 0 ? void 0 : _f.count) || 0,
                });
            }
            catch (error) {
                console.error("Erreur lors de la récupération des statistiques :", error);
                res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
            }
        });
    }
}
exports.controllerAdminInstance = new Controlleradmin();
