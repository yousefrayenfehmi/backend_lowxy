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
exports.controllerclientInstance = void 0;
const BDconnection_1 = require("../BDconnection/BDconnection");
const Touriste_1 = require("../models/Touriste");
const Fonction_1 = __importDefault(require("../fonction/Fonction"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importStar(require("mongoose"));
const Controllerpartenaire_1 = require("./Controllerpartenaire");
const Controllerpartenaire_2 = require("./Controllerpartenaire");
class controllerclient {
    constructor() {
        dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
    }
    verifyToken(req, res, next) {
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
            const authHeader = req.headers.authorization;
            console.log(authHeader);
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                res.status(401).json({ message: 'Token manquant' });
                return;
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const { id } = decoded;
                const touriste = yield Touriste_1.Touristes.findById(id);
                if (!touriste) {
                    res.status(401).json({ message: 'Client non trouvé' });
                    return;
                }
                // Stocker l'ID et l'objet touriste complet dans req
                req.user = id;
                req.touriste = touriste;
                next();
            }
            catch (err) {
                res.status(403).json({ message: 'Token invalide' });
            }
        });
    }
    uploadfacture(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection();
            }
            (0, Controllerpartenaire_1.upload)(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                if (err) {
                    console.log(err);
                    res.status(500).json({ error: 'Erreur lors du téléchargement de la facture' });
                    return;
                }
                try {
                    const files = req.files;
                    console.log("hani hne mawjoud wiwoooooo");
                    console.log(req.body);
                    const factureFiles = files['facture'] || [];
                    // Vérifier si des fichiers ont été téléchargés
                    if (!factureFiles.length) {
                        res.status(400).json({ error: 'Aucun fichier de facture téléchargé' });
                        return;
                    }
                    const factureDetails = {
                        filename: (_a = factureFiles[0]) === null || _a === void 0 ? void 0 : _a.filename,
                        originalname: (_b = factureFiles[0]) === null || _b === void 0 ? void 0 : _b.originalname,
                        mimetype: (_c = factureFiles[0]) === null || _c === void 0 ? void 0 : _c.mimetype,
                        size: (_d = factureFiles[0]) === null || _d === void 0 ? void 0 : _d.size,
                        path: (_e = factureFiles[0]) === null || _e === void 0 ? void 0 : _e.path,
                        type: 'banner'
                    };
                    console.log(factureDetails);
                    // Générer un nom de fichier unique pour S3
                    if (!req.body.Id_quizz) {
                        res.status(400).json({ error: 'ID du quiz manquant' });
                        return;
                    }
                    // Créer un chemin de destination pour S3
                    const fileExtension = factureFiles[0].originalname.split('.').pop() || 'jpg';
                    const fileName = `facture-${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtension}`;
                    const destination = `factures/${req.body.Id_quizz}/${fileName}`;
                    try {
                        const url = yield (0, Controllerpartenaire_2.uploadToS3)(factureFiles[0], destination);
                        const touriste = yield Touriste_1.Touristes.findOneAndUpdate({ 'historique_quiz._id': req.body.Id_quizz }, { $set: { 'historique_quiz.$.facture': url } }, { new: true });
                        if (!touriste) {
                            res.status(404).json({ error: 'Quiz non trouvé pour ce touriste' });
                            return;
                        }
                        res.status(200).json({ message: 'Facture téléchargée avec succès' });
                    }
                    catch (error) {
                        console.log(error);
                        res.status(500).json({ error: 'Erreur lors du traitement de la facture' });
                    }
                }
                catch (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Erreur lors du traitement de la facture' });
                }
            }));
        });
    }
    Clientquizz(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection();
            }
            try {
                const touriste = yield Touriste_1.Touristes.find({ "historique_quiz.0": { $exists: true } });
                if (!touriste) {
                    res.status(404).json({ error: 'Aucun touriste a passé un quizz' });
                }
                res.status(200).json(touriste);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération des touristes qui ont passé un quizz' });
            }
        });
    }
    sauvgarderMontatnt(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection();
            }
            try {
                const { montant } = req.body;
                const id = req.params.id;
                const touriste = yield Touriste_1.Touristes.findOneAndUpdate({ 'historique_quiz._id': id }, { $set: { 'historique_quiz.$.prix': montant } }, { new: true });
                res.status(200).json({ message: 'Montant sauvegardé avec succès' });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la sauvegarde du montant' });
            }
        });
    }
    getTouristeByToken(req, res) {
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
                const touriste = yield Touriste_1.Touristes.findById(id).select('-motdepasse'); // Exclure le mot de passe
                if (!touriste) {
                    res.status(404).json({ message: 'Touriste non trouvé' });
                    return;
                }
                res.status(200).json(touriste);
            }
            catch (err) {
                res.status(403).json({ message: 'Token invalide' });
                return;
            }
        });
    }
    logout(req, res) {
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
    login(req, res) {
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
                const { email, password } = req.body;
                const touriste = yield Touriste_1.Touristes.findOne({ 'info.email': email, 'securites.isverified': true });
                if (!touriste || !touriste.info || !touriste.info.motdepasse) {
                    res.status(404).json({ error: 'touriste non trouvé' });
                    return;
                }
                const match = yield bcryptjs_1.default.compare(password, touriste.info.motdepasse);
                if (!match) {
                    res.status(400).json({ error: 'Mot de passe incorrect' });
                    return;
                }
                const token = Fonction_1.default.createtokenetcookies(res, touriste._id);
                res.status(200).json({
                    success: true,
                    touriste: {
                        _id: touriste._id,
                        info: {
                            nom_complet: touriste.info.nom_complet,
                            email: touriste.info.email,
                            telephone: touriste.info.telephone
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
    forgetpassword(req, res) {
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
                const { email } = req.body;
                const touriste = yield Touriste_1.Touristes.findOne({ 'info.email': email });
                if (!touriste) {
                    res.status(404).json({ error: 'touriste non trouvé' });
                    return;
                }
                const resetToken = jsonwebtoken_1.default.sign({ userId: touriste._id, type: 'touriste' }, process.env.JWT_SECRET, { expiresIn: '1h' });
                const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
                touriste.resetPasswordToken = resetToken;
                touriste.resetPasswordTokenExpire = resetTokenExpiresAt;
                yield touriste.save();
                Fonction_1.default.sendmail(email, 'password', process.env.front_end + "/Auth/mot_passe_oblier/reset/?token=" + resetToken + "&type=personnel");
                res.status(200).json({
                    success: true,
                    message: 'email envoyé avec success'
                });
            }
            catch (error) {
                res.status(500).json({ error: "Erreur lors de l'envoi du mail de réinitialisation", errors: error });
            }
        });
    }
    resetpassword(req, res) {
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
                const { token } = req.params;
                const { newPassword } = req.body;
                console.log(token);
                console.log(newPassword);
                const touriste = yield Touriste_1.Touristes.findOne({
                    resetPasswordToken: token,
                    resetPasswordTokenExpire: { $gt: Date.now() },
                });
                if (!touriste || !touriste.info) {
                    res.status(400).json({ success: false, message: "Invalid or expired reset token" });
                    return;
                }
                const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
                touriste.info.motdepasse = hashedPassword;
                touriste.resetPasswordToken = undefined;
                touriste.resetPasswordTokenExpire = undefined;
                yield touriste.save();
                res.status(200).json({ success: true, message: "Password reset successful" });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
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
                const user = yield Touriste_1.Touristes.findById(id);
                if (!user) {
                    res.status(404).json({ message: 'Touriste non trouvé' });
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
    reenvoyeruncode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.user;
                const touriste = yield Touriste_1.Touristes.findOne({ '_id': id });
                if (!touriste) {
                    res.status(404).json({ error: 'touriste non trouveè' });
                    return;
                }
                const code = Fonction_1.default.generecode(100000, 999999);
                touriste.securites.code = code;
                Fonction_1.default.sendmail(touriste.info.email, 'Inscription', code.toString());
                yield touriste.save();
                res.status(200).json({ success: true, message: 'Code envoyé avec success' });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
            }
        });
    }
    completerl(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.user;
                let touriste = yield Touriste_1.Touristes.findById(id);
                console.log(req.body);
                if (!touriste) {
                    res.status(404).json({ error: 'client non trouvé' });
                    return;
                }
                if (req.body.historique_quiz && touriste.historique_quiz) {
                    touriste.historique_quiz.push(req.body.historique_quiz);
                }
                // Mise à jour sélective des champs
                const updateFields = {
                    // Champs textuels simples
                    'info.nom_complet': (_b = (_a = req.body.info) === null || _a === void 0 ? void 0 : _a.nom_complet) !== null && _b !== void 0 ? _b : touriste.info.nom_complet,
                    'info.telephone': (_d = (_c = req.body.info) === null || _c === void 0 ? void 0 : _c.telephone) !== null && _d !== void 0 ? _d : touriste.info.telephone,
                    // Champs de date
                    'info.naissance': (_f = (_e = req.body.info) === null || _e === void 0 ? void 0 : _e.naissance) !== null && _f !== void 0 ? _f : touriste.info.naissance,
                    // Adresse imbriquée
                    'info.adresse': {
                        'ville': (_j = (_h = (_g = req.body.info) === null || _g === void 0 ? void 0 : _g.adresse) === null || _h === void 0 ? void 0 : _h.ville) !== null && _j !== void 0 ? _j : touriste.info.adresse.ville,
                        'pays': (_m = (_l = (_k = req.body.info) === null || _k === void 0 ? void 0 : _k.adresse) === null || _l === void 0 ? void 0 : _l.pays) !== null && _m !== void 0 ? _m : touriste.info.adresse.pays
                    },
                    // Champs additionnels
                    'info.rib': (_p = (_o = req.body.info) === null || _o === void 0 ? void 0 : _o.rib) !== null && _p !== void 0 ? _p : touriste.info.rib,
                    // Ajoutez d'autres champs ici
                    'info.matricule_taxi': (_r = (_q = req.body.info) === null || _q === void 0 ? void 0 : _q.matricule_taxi) !== null && _r !== void 0 ? _r : touriste.info.matricule_taxi,
                    'preferences.langue': (_t = (_s = req.body.preferences) === null || _s === void 0 ? void 0 : _s.langue) !== null && _t !== void 0 ? _t : touriste.preferences.langue,
                    'preferences.langue_preferee': (_v = (_u = req.body.preferences) === null || _u === void 0 ? void 0 : _u.langue_preferee) !== null && _v !== void 0 ? _v : touriste.preferences.langue_preferee,
                    'preferences.centres_interet': (_x = (_w = req.body.preferences) === null || _w === void 0 ? void 0 : _w.centres_interet) !== null && _x !== void 0 ? _x : touriste.preferences.centres_interet,
                    'historique_quiz': touriste.historique_quiz
                };
                // Mise à jour partielle
                const updatedTouriste = yield Touriste_1.Touristes.findByIdAndUpdate(id, { $set: updateFields }, {
                    new: true, // Retourne le document mis à jour
                    runValidators: true // Valide les champs mis à jour
                });
                if (!updatedTouriste) {
                    res.status(404).json({ error: 'touriste non trouvé' });
                    return;
                }
                console.log(updatedTouriste.historique_quiz);
                res.status(200).json({
                    message: 'Profil mis à jour avec succès',
                    //retourne historique quiz dernier
                    historique_quiz: ((_y = updatedTouriste.historique_quiz) === null || _y === void 0 ? void 0 : _y.at(-1)) || null,
                });
            }
            catch (error) {
                console.error('Erreur lors de la mise à jour du touriste:', error);
                res.status(500).json({
                    error: 'Erreur lors de la mise à jour du touriste'
                });
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
                const touriste = yield Touriste_1.Touristes.findOne({ 'info.email': email });
                if (touriste && touriste.info.strategy == 'facebook') {
                    res.status(400).json({ error: 'Un touriste avec cet email existe déjà' });
                    return;
                }
                else if (touriste && touriste.info.strategy == 'google') {
                    const token = Fonction_1.default.createtokenetcookies(res, touriste._id);
                    res.status(200).json({ success: true, touriste: touriste, token: token });
                    return;
                }
                const touristee = new Touriste_1.Touristes(req.body);
                touristee.info.strategy = "google";
                touristee.info.motdepasse = yield bcryptjs_1.default.hash("google", 10);
                touristee.securites.isverified = true;
                yield touristee.save();
                const token = Fonction_1.default.createtokenetcookies(res, touristee._id);
                res.status(201).json({ success: true, touriste: touristee, token: token });
            }
            catch (error) {
                console.log('Erreur lors de la création du touriste:', error);
                res.status(500).json({ error: 'Erreur lors de la création du touriste' });
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
                const touriste = yield Touriste_1.Touristes.findOne({ 'info.email': email });
                if (touriste && touriste.info.strategy == 'google') {
                    res.status(400).json({ error: 'Un touriste avec cet email existe déjà' });
                    return;
                }
                else if (touriste && touriste.info.strategy == 'facebook') {
                    const token = Fonction_1.default.createtokenetcookies(res, touriste._id);
                    res.status(200).json({ success: true, touriste: touriste, token: token });
                    return;
                }
                const touristee = new Touriste_1.Touristes(req.body);
                touristee.info.strategy = "facebook";
                touristee.info.motdepasse = yield bcryptjs_1.default.hash("facebook", 10);
                touristee.securites.isverified = true;
                yield touristee.save();
                const token = Fonction_1.default.createtokenetcookies(res, touristee._id);
                res.status(201).json({ success: true, touriste: touristee, token: token });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la création du touriste' });
            }
        });
    }
    Signup(req, res) {
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
                console.log(req.body);
                const { email } = req.body.info;
                const touristeExistant = yield Touriste_1.Touristes.findOne({ 'info.email': email });
                if (touristeExistant) {
                    console.log();
                    res.status(400).json({ error: 'Un touriste avec cet email existe déjà' });
                    return;
                }
                /*
                const chauffeur=await Chauffeurs.findOne({ 'info.matricule': req.body.info.matricule_taxi });
                if (!chauffeur) {
                    res.status(400).json({ error: "Un chauffeur avec cette matricule n'existe pas " });
                    return;
                }*/
                const touriste = new Touriste_1.Touristes(req.body);
                const Code = Fonction_1.default.generecode(100000, 900000);
                ;
                touriste.securites = {
                    code: Code,
                    date: new Date(),
                    isverified: false,
                };
                touriste.info.strategy = "local";
                touriste.info.motdepasse = yield bcryptjs_1.default.hash(touriste.info.motdepasse, 10);
                touriste.info.matricule_taxi = req.body.info.matricule_taxi;
                const savedTouriste = yield touriste.save();
                const token = Fonction_1.default.createtokenetcookies(res, savedTouriste._id);
                yield Fonction_1.default.sendmail(email, 'Inscription', Code);
                res.status(201).json({
                    touriste: savedTouriste,
                    token
                });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la création du touriste' });
            }
        });
    }
    VeriffieEmail(req, res) {
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
                console.log(req.body);
                const id = req.user;
                const { code } = req.body;
                const tourist = yield Touriste_1.Touristes.findOne({
                    '_id': id,
                    'securites.code': code,
                    'securites.date': { $gt: new Date(Date.now() - 15 * 60 * 1000) }
                });
                if (!tourist) {
                    console.log('Le code est invalide ou a expiré');
                    res.status(400).json({
                        success: false,
                        message: 'Le code est invalide ou a expiré'
                    });
                    return;
                }
                tourist.securites = {
                    isverified: true
                };
                yield tourist.save();
                res.status(200).json({
                    success: true,
                    message: 'Email vérifié avec succès'
                });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la vérification'
                });
            }
        });
    }
    createTouristes(req, res) {
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
                const touriste = new Touriste_1.Touristes(req.body);
                const savedTouriste = yield touriste.save();
                res.status(201).json(savedTouriste);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la création du touriste' });
            }
        });
    }
    getAllTouristes(req, res) {
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
                const touristes = yield Touriste_1.Touristes.find();
                res.status(200).json(touristes);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération des touristes' });
            }
        });
    }
    getTouristeById(req, res) {
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
                const touriste = yield Touriste_1.Touristes.findById(req.params.id);
                if (!touriste) {
                    res.status(404).json({ error: 'touriste non trouvé' });
                    return;
                }
                res.status(200).json(touriste);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération du touriste' });
            }
        });
    }
    updateTouriste(req, res) {
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
                const touriste = yield Touriste_1.Touristes.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!touriste) {
                    res.status(404).json({ error: 'touriste non trouvé' });
                    return;
                }
                res.status(200).json(touriste);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la mise à jour du touriste' });
            }
        });
    }
    deleteTouriste(req, res) {
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
                const touriste = yield Touriste_1.Touristes.findByIdAndDelete(req.params.id);
                if (!touriste) {
                    res.status(404).json({ error: 'touriste non trouvé' });
                    return;
                }
                res.status(200).json(touriste);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la suppression du touriste' });
            }
        });
    }
    getTouristebymoth(req, res) {
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
                //recuperer moth de systeme
                const moth = new Date().getMonth() + 1;
                const year = new Date().getFullYear();
                const precedentmoth = new Date().getMonth();
                console.log(precedentmoth);
                ;
                const touriste = yield Touriste_1.Touristes.find({ 'createdAt': { $gte: new Date(year, moth - 1, 1), $lt: new Date(year, moth, 1) } });
                const touristeprecedent = yield Touriste_1.Touristes.find({ 'createdAt': { $gte: new Date(year, precedentmoth - 1, 1), $lt: new Date(year, precedentmoth, 1) } });
                res.status(200).json({ touriste: touriste.length, touristeprecedent: touristeprecedent.length });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération du touriste' });
            }
        });
    }
}
exports.controllerclientInstance = new controllerclient();
