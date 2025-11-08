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
exports.controllerchauffeurInstance = void 0;
const BDconnection_1 = require("../BDconnection/BDconnection");
const Fonction_1 = __importDefault(require("../fonction/Fonction"));
const Chauffeure_1 = require("../models/Chauffeure");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importStar(require("mongoose"));
class controllerchauffeur {
    constructor() {
        dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
    }
    verifyToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                });
            }
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                res.status(401).json({ message: 'Token manquant' });
                return;
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const { id } = decoded;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findById(id);
                if (!chauffeur) {
                    res.status(401).json({ message: 'chauffeur non trouvé' });
                    return;
                }
                req.user = id;
                next();
            }
            catch (err) {
                res.status(403).json({ message: 'Token invalide' });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                });
            }
            try {
                const { email, password } = req.body;
                console.log(email, password);
                const chauffeur = yield Chauffeure_1.Chauffeurs.findOne({ 'info.email': email, 'securites.isverified': true });
                console.log(chauffeur);
                if (!chauffeur) {
                    res.status(404).json({ error: 'chauffeur non trouvé' });
                    return;
                }
                const match = yield bcryptjs_1.default.compare(password, chauffeur.info.motdepasse);
                if (!match) {
                    res.status(400).json({ error: 'Mot de passe incorrect' });
                    return;
                }
                const token = Fonction_1.default.createtokenetcookies(res, chauffeur._id);
                res.status(200).json({
                    success: true,
                    chauffeur: {
                        _id: chauffeur._id,
                        info: {
                            nom: chauffeur.info.nom_complet,
                            email: chauffeur.info.email,
                            telephone: chauffeur.info.telephone,
                            matricule: chauffeur.info.matricule
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
    authavecgoogle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { email } = req.body.info;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findOne({ 'info.email': email });
                if (chauffeur && chauffeur.info.strategy !== 'google') {
                    res.status(400).json({ error: 'Un chauffeur avec cet email existe déjà' });
                    return;
                }
                else if (chauffeur && chauffeur.info.strategy === 'google') {
                    console.log('hetha chauffeur');
                    const token = Fonction_1.default.createtokenetcookies(res, chauffeur._id);
                    res.status(201).json({ success: true, chauffeur: chauffeur, token: token });
                    return;
                }
                const chauffeure = new Chauffeure_1.Chauffeurs(req.body);
                chauffeure.info.strategy = "google";
                chauffeure.info.motdepasse = yield bcryptjs_1.default.hash("google", 10);
                chauffeure.info.matricule = "";
                chauffeure.securites.isverified = true;
                const savechauvveure = yield chauffeure.save();
                if (savechauvveure) {
                    const matricule = Fonction_1.default.generermatricle();
                    Fonction_1.default.sendmail(email, 'matricule', matricule);
                    chauffeure.info.matricule = matricule;
                    yield chauffeure.save();
                    const token = Fonction_1.default.createtokenetcookies(res, chauffeure._id);
                    res.status(201).json({ success: true, chauffeur: chauffeure, token: token });
                }
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la création du chauffeur' });
            }
        });
    }
    verifierchauffeur(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const matricule = req.body.matricule;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findOne({ 'info.matricule': matricule });
                if (chauffeur) {
                    res.status(200).json({ success: true, chauffeur: chauffeur });
                    return;
                }
                else {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la vérification du chauffeur' });
            }
        });
    }
    authavecfacebook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { email } = req.body.info;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findOne({ 'info.email': email });
                if (chauffeur && chauffeur.info.strategy !== 'facebook') {
                    res.status(400).json({ error: 'Un chauffeur avec cet email existe déjà' });
                    return;
                }
                else if (chauffeur && chauffeur.info.strategy === 'facebook') {
                    const token = Fonction_1.default.createtokenetcookies(res, chauffeur._id);
                    res.status(201).json({ success: true, chauffeur: chauffeur, token: token });
                    return;
                }
                const chauffeure = new Chauffeure_1.Chauffeurs(req.body);
                chauffeure.info.strategy = "facebook";
                chauffeure.info.motdepasse = yield bcryptjs_1.default.hash("google", 10);
                chauffeure.info.matricule = "";
                chauffeure.securites.isverified = true;
                const savechauvveure = yield chauffeure.save();
                if (savechauvveure) {
                    const matricule = Fonction_1.default.generermatricle();
                    Fonction_1.default.sendmail(email, 'matricule', matricule);
                    chauffeure.info.matricule = matricule;
                    yield chauffeure.save();
                    const token = Fonction_1.default.createtokenetcookies(res, chauffeure._id);
                    res.status(201).json({ success: true, chauffeur: chauffeure, token: token });
                }
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la création du chauffeur' });
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
    forgetpassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { email } = req.body;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findOne({ 'info.email': email });
                if (!chauffeur) {
                    res.status(404).json({ error: 'chauffeur non trouvé' });
                    return;
                }
                const resetToken = crypto_1.default.randomBytes(20).toString("hex");
                const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
                chauffeur.resetPasswordToken = resetToken;
                chauffeur.resetPasswordTokenExpire = resetTokenExpiresAt;
                yield chauffeur.save();
                Fonction_1.default.sendmail(email, 'password', process.env.front_end + "/Auth/mot_passe_oblier/reset/?token=" + resetToken + "&type=chauffeur");
                res.status(200).json({
                    success: true,
                    message: 'email envoyé avec succès'
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de l\'envoi du mail de réinitialisation' });
            }
        });
    }
    resetpassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { token } = req.params;
                const { newPassword } = req.body;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findOne({
                    resetPasswordToken: token,
                    resetPasswordTokenExpire: { $gt: Date.now() },
                });
                if (!chauffeur || !chauffeur.info) {
                    res.status(400).json({ success: false, message: "Token de réinitialisation invalide ou expiré" });
                    return;
                }
                const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
                chauffeur.info.motdepasse = hashedPassword;
                chauffeur.resetPasswordToken = undefined;
                chauffeur.resetPasswordTokenExpire = undefined;
                yield chauffeur.save();
                res.status(200).json({ success: true, message: "Mot de passe réinitialisé avec succès" });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
            }
        });
    }
    Signup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { email } = req.body.info;
                const chauffeur = new Chauffeure_1.Chauffeurs(req.body);
                const chauffeurExistant = yield Chauffeure_1.Chauffeurs.findOne({ 'info.email': email });
                if (chauffeurExistant || !chauffeur.info || !chauffeur.info.motdepasse) {
                    res.status(400).json({ error: 'Un chauffeur avec cet email existe déjà' });
                    return;
                }
                const Code = Fonction_1.default.generecode(100000, 900000);
                ;
                chauffeur.securites = {
                    code: Code,
                    date: new Date(),
                    isverified: false,
                };
                chauffeur.info.motdepasse = yield bcryptjs_1.default.hash(chauffeur.info.motdepasse, 10);
                const savedChauffeur = yield chauffeur.save();
                const token = Fonction_1.default.createtokenetcookies(res, savedChauffeur._id);
                yield Fonction_1.default.sendmail(email, 'Inscription', Code);
                res.status(201).json({
                    chauffeur: savedChauffeur,
                    token
                });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    renvoyeruncode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.user;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findById(id);
                if (!chauffeur) {
                    res.status(404).json({ error: 'chauffeur non trouvé' });
                    return;
                }
                const Code = Fonction_1.default.generecode(100000, 900000);
                ;
                chauffeur.securites.code = Code;
                yield chauffeur.save();
                yield Fonction_1.default.sendmail(chauffeur.info.email, 'Inscription', Code);
                res.status(200).json({
                    success: true,
                    message: 'email envoyé avec succès'
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
            }
        });
    }
    completerprofil(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.user;
                let chauffeur = yield Chauffeure_1.Chauffeurs.findById(id);
                if (!chauffeur) {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
                // Mise à jour sélective des champs
                const updateFields = {
                    // Champs textuels simples
                    'info.nom_complet': (_b = (_a = req.body.info) === null || _a === void 0 ? void 0 : _a.nom_complet) !== null && _b !== void 0 ? _b : chauffeur.info.nom_complet,
                    'info.telephone': (_d = (_c = req.body.info) === null || _c === void 0 ? void 0 : _c.telephone) !== null && _d !== void 0 ? _d : chauffeur.info.telephone,
                    'info.naissance': (_f = (_e = req.body.info) === null || _e === void 0 ? void 0 : _e.naissance) !== null && _f !== void 0 ? _f : chauffeur.info.naissance,
                    'info.adresse': {
                        'ville': (_j = (_h = (_g = req.body.info) === null || _g === void 0 ? void 0 : _g.adresse) === null || _h === void 0 ? void 0 : _h.ville) !== null && _j !== void 0 ? _j : chauffeur.info.adresse.ville,
                        'pays': (_m = (_l = (_k = req.body.info) === null || _k === void 0 ? void 0 : _k.adresse) === null || _l === void 0 ? void 0 : _l.pays) !== null && _m !== void 0 ? _m : chauffeur.info.adresse.pays
                    },
                    'info.Rib': (_p = (_o = req.body.info) === null || _o === void 0 ? void 0 : _o.Rib) !== null && _p !== void 0 ? _p : chauffeur.info.Rib,
                    'vehicule.matricule': (_r = (_q = req.body.vehicule) === null || _q === void 0 ? void 0 : _q.matricule) !== null && _r !== void 0 ? _r : chauffeur.vehicule.matricule,
                    'vehicule.modele': (_t = (_s = req.body.vehicule) === null || _s === void 0 ? void 0 : _s.modele) !== null && _t !== void 0 ? _t : chauffeur.vehicule.modele,
                    'vehicule.places': (_v = (_u = req.body.vehicule) === null || _u === void 0 ? void 0 : _u.places) !== null && _v !== void 0 ? _v : chauffeur.vehicule.places,
                    'vehicule.marque': (_x = (_w = req.body.vehicule) === null || _w === void 0 ? void 0 : _w.marque) !== null && _x !== void 0 ? _x : chauffeur.vehicule.marque,
                };
                // Mise à jour partielle
                const updatedChauffeur = yield Chauffeure_1.Chauffeurs.findByIdAndUpdate(id, { $set: updateFields }, {
                    new: true, // Retourne le document mis à jour
                    runValidators: true // Valide les champs mis à jour
                });
                if (!updatedChauffeur) {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
                res.status(200).json({
                    message: 'Profil mis à jour avec succès',
                    chauffeur: updatedChauffeur
                });
            }
            catch (error) {
                console.error('Erreur lors de la mise à jour du chauffeur:', error);
                res.status(500).json({
                    error: 'Erreur lors de la mise à jour du chauffeur'
                });
            }
        });
    }
    VeriffieEmail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.user;
                const { code } = req.body;
                let matricule = Fonction_1.default.generermatricle();
                const chauffeur = yield Chauffeure_1.Chauffeurs.findOne({
                    '_id': id,
                    'securites.code': code,
                    'securites.date': { $gt: new Date(Date.now() - 15 * 60 * 1000) }
                });
                if (!chauffeur) {
                    console.log('chauffeur non trouvé');
                    res.status(400).json({
                        success: false,
                        message: 'Le code est invalide ou a expiré'
                    });
                    return;
                }
                while (yield Chauffeure_1.Chauffeurs.findOne({ info: { matricule: matricule } })) {
                    matricule = Fonction_1.default.generermatricle();
                }
                chauffeur.securites = {
                    isverified: true
                };
                chauffeur.info.matricule = matricule;
                yield chauffeur.save();
                Fonction_1.default.sendmail(chauffeur.info.email, 'matricule', matricule);
                res.status(200).json({
                    success: true,
                    message: 'Email vérifié avec succès'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la vérification'
                });
            }
        });
    }
    createChauffeur(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeur = new Chauffeure_1.Chauffeurs(req.body);
                const savedChauffeur = yield chauffeur.save();
                res.status(201).json(savedChauffeur);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la création du chauffeur' });
            }
        });
    }
    getAllChauffeurs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeurs = yield Chauffeure_1.Chauffeurs.find();
                if (!chauffeurs || chauffeurs.length === 0) {
                    res.status(404).json({ error: 'Aucun chauffeur trouvé' });
                    return;
                }
                res.status(200).json(chauffeurs);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération des chauffeurs' });
            }
        });
    }
    getChauffeurById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeur = yield Chauffeure_1.Chauffeurs.findById(req.params.id);
                if (!chauffeur) {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
                res.status(200).json(chauffeur);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération du chauffeur' });
            }
        });
    }
    updateChauffeur(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeur = yield Chauffeure_1.Chauffeurs.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!chauffeur) {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
                res.status(200).json(chauffeur);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la mise à jour du chauffeur' });
            }
        });
    }
    deleteChauffeur(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeur = yield Chauffeure_1.Chauffeurs.findByIdAndDelete(req.params.id);
                if (!chauffeur) {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
                res.status(200).json(chauffeur);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la suppression du chauffeur' });
            }
        });
    }
    changePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                res.status(401).json({ message: 'Token manquant' });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            if (!newPassword || newPassword.length < 8) {
                res.status(400).json({ message: 'New password must be at least 8 characters long' });
                return;
            }
            try {
                // Decode the token
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const { id } = decoded;
                // Ensure the id is a valid ObjectId
                if (!mongoose_1.Types.ObjectId.isValid(id)) {
                    res.status(400).json({ message: 'Invalid user ID in token' });
                    return;
                }
                // Find the user by id, excluding the password
                const user = yield Chauffeure_1.Chauffeurs.findById(id);
                if (!user) {
                    res.status(404).json({ message: 'Chauffeur non trouvé' });
                    return;
                }
                // Check if the current password matches
                const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.info.motdepasse);
                if (!isMatch) {
                    res.status(400).json({ message: 'Current password is incorrect' });
                    return;
                }
                // Hash the new password
                const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
                user.info.motdepasse = hashedPassword;
                yield user.save();
                res.status(200).json({ message: 'Password changed successfully' });
            }
            catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'An error occurred while changing the password' });
            }
        });
    }
    getChauffeurByToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (mongoose_1.default.connection.readyState !== 1) {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                const authHeader = req.headers.authorization;
                const token = authHeader && authHeader.split(' ')[1];
                if (!token) {
                    res.status(401).json({ message: 'Token manquant' });
                    return;
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const { id } = decoded;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findById(id).select('-motdepasse'); // Exclure le mot de passe
                if (!chauffeur) {
                    res.status(404).json({ message: 'Chauffeur non trouvé' });
                    return;
                }
                res.status(200).json(chauffeur);
            }
            catch (err) {
                res.status(403).json({ message: 'Token invalide' });
                return;
            }
        });
    }
}
exports.controllerchauffeurInstance = new controllerchauffeur();
