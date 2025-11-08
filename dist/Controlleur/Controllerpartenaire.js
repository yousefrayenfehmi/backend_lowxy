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
exports.ControllerpartenairInstance = exports.deleteFromS3 = exports.upload = void 0;
exports.uploadToS3 = uploadToS3;
const Partenaire_1 = require("../models/Partenaire");
const BDconnection_1 = require("../BDconnection/BDconnection");
const Fonction_1 = __importDefault(require("../fonction/Fonction"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importStar(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const stripe_1 = __importDefault(require("stripe"));
const mongodb_1 = require("mongodb");
const aws_sdk_1 = require("aws-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
const Configpublicite_1 = __importDefault(require("../models/Configpublicite"));
const stripe = new stripe_1.default('sk_test_51RAG0WQ4fzXaDh6qqaSa4kETsLitTt3nAHAnaPoodCOrgstRL0puvbFYG6KoruYmawEgL3o8NJ5DmywcApPS2NjH00FKdOaX9O');
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'eu-north-1',
    httpOptions: {
        timeout: 120000,
        connectTimeout: 60000
    },
    maxRetries: 3
});
// Définition du middleware upload au niveau du module ou de la classe
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
}).fields([
    { name: 'banners', maxCount: 3 },
    { name: 'videos', maxCount: 3 },
    { name: 'covering', maxCount: 1 },
    { name: 'facture', maxCount: 1 }
]);
function uploadToS3(file, destination) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileBuffer;
        // Gérer les deux types de stockage
        if (file.buffer) {
            // Stockage mémoire
            fileBuffer = file.buffer;
        }
        else if (file.path) {
            // Stockage local - lire le fichier
            console.log('file.path33', file.path);
            fileBuffer = fs_1.default.readFileSync(file.path);
            console.log('fileBuffer56', fileBuffer);
        }
        else {
            throw new Error('Aucun contenu de fichier disponible');
        }
        const params = {
            Bucket: process.env.AWS_S3_BUCKET || 'lowxysas',
            Key: destination,
            Body: fileBuffer,
            ContentType: file.mimetype
            // ACL supprimé car le bucket ne permet pas les ACLs
        };
        console.log('params', params);
        try {
            console.log('Début upload vers S3...');
            const result = yield s3.upload(params).promise();
            console.log('Upload terminé:', result);
            if (!result || !result.Location) {
                throw new Error('Upload S3 réussi mais pas de Location retournée');
            }
            console.log('URL finale:', result.Location);
            return result.Location;
        }
        catch (error) {
            console.error('Error uploading file to S3:', error);
            throw error;
        }
    });
}
const deleteFromS3 = (fileUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const urlParts = new URL(fileUrl);
        const s3Path = urlParts.pathname.substring(1);
        const params = {
            Bucket: 'lowxysas',
            Key: s3Path
        };
        yield s3.deleteObject(params).promise();
        console.log(`File deleted successfully from S3: ${fileUrl}`);
    }
    catch (error) {
        console.error('Error deleting file from S3:', error);
        throw error;
    }
});
exports.deleteFromS3 = deleteFromS3;
class ControllerPartenaire {
    constructor() {
        dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
        console.log('process.env.front_end' + process.env.front_end);
    }
    verifyToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
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
                const partenaire = yield Partenaire_1.Partenaires.findById(id);
                if (!partenaire) {
                    res.status(401).json({ message: 'Partenaire non trouvé' });
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
    enregisterstatistiques(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const statistiques = req.body;
                console.log("Statistiques reçues:");
                console.log(JSON.stringify(statistiques, null, 2));
                // Parcourir les statistiques par ID de publicité
                for (const publiciteId in statistiques) {
                    console.log("publiciteId" + publiciteId);
                    if (statistiques.hasOwnProperty(publiciteId)) {
                        const { impressions, clics } = statistiques[publiciteId];
                        console.log(`Publicité ${publiciteId}: ${impressions} impressions, ${clics} clics`);
                        // Méthode alternative pour mettre à jour la publicité
                        try {
                            const partenaire = yield Partenaire_1.Partenaires.findOneAndUpdate({ 'pub_quiz._id': publiciteId }, {
                                $inc: {
                                    'pub_quiz.$.impressions': impressions,
                                    'pub_quiz.$.clicks': clics
                                }
                            }, { new: true });
                            if (!partenaire) {
                                console.log(`Publicité ${publiciteId} non trouvée`);
                            }
                        }
                        catch (updateError) {
                            console.error(`Erreur lors de la mise à jour de la publicité ${publiciteId}:`, updateError);
                        }
                    }
                }
                res.status(200).json({ message: 'Statistiques enregistrées avec succès' });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    createcovering(req, res) {
        console.log("salut gays");
        (0, exports.upload)(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                console.error('Erreur multer:', err);
                res.status(400).json({ message: 'Erreur lors de l\'upload des fichiers: ' + err.message });
                return;
            }
            //recuperer les fichiers uploadés
            const files = req.files;
            //verifier s'il y a des fichiers
            if (!files || (!files['covering'] || files['covering'].length === 0)) {
                res.status(400).json({ message: 'Aucun fichier image ou vidéo envoyé' });
                return;
            }
            console.log(req.body);
            //Traiter les images avec S3
            const coveringFile = files['covering'][0];
            const fileName = `covering-${Date.now()}-${Math.round(Math.random() * 1E9)}${path_1.default.extname(coveringFile.originalname)}`;
            const destination = `covering_ads/${req.params.nom_societe}/images/${fileName}`;
            try {
                const fileUrl = yield uploadToS3(coveringFile, destination);
                const covring = {
                    _id: new mongoose_1.Types.ObjectId(),
                    image: fileUrl,
                    modele_voiture: req.body.model_voiture,
                    type_covering: req.body.type_covering,
                    nombre_taxi: req.body.nombre_de_taxi,
                    nombre_jour: req.body.nombre_de_jour,
                    prix: req.body.prix,
                    statu: 'En attente de validation',
                    impressions: 0,
                    clicks: 0
                };
                const session = yield stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price_data: {
                                currency: 'eur',
                                product_data: {
                                    name: `Publicité ${req.params.nom_societe || ''}`,
                                    description: 'Campagne publicitaire',
                                },
                                unit_amount: Math.round(covring.prix * 100), // Conversion en centimes et arrondi
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${req.headers.origin || process.env.front_end || 'http://a9aec0bf981024fcab3097aa85d37546-1960190977.eu-west-3.elb.amazonaws.com'}//paiment_sucesses/${covring._id}?data=${encodeURIComponent(JSON.stringify(covring))}&type=covering`,
                    cancel_url: `${process.env.front_end}/paiment_echouee/${covring._id}?type=covering`,
                });
                res.status(200).json({ id: session.id });
            }
            catch (error) {
                console.error('Erreur lors de l\'upload sur S3:', error);
                res.status(500).json({ message: 'Erreur lors de l\'upload: ' + error.message });
            }
        }));
    }
    createPubliciteetpay(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, exports.upload)(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (err) {
                        console.log("error");
                        console.error('Erreur multer:', err);
                        res.status(400).json({ message: 'Erreur lors de l\'upload des fichiers: ' + err.message });
                        return;
                    }
                    console.log("salut");
                    // Récupérer les fichiers uploadés
                    const files = req.files;
                    console.log("files", files);
                    // Vérifier s'il y a des fichiers
                    if (!files || ((!files['banners'] || files['banners'].length === 0) &&
                        (!files['videos'] || files['videos'].length === 0))) {
                        res.status(400).json({ message: 'Aucun fichier image ou vidéo envoyé' });
                        return;
                    }
                    console.log(req.body);
                    // Traiter les images avec S3
                    const bannerFiles = files['banners'] || [];
                    const bannerUrls = [];
                    // Upload des bannières vers S3
                    for (const file of bannerFiles) {
                        console.log("file", file);
                        const fileName = `banners-${Date.now()}-${Math.round(Math.random() * 1E9)}${path_1.default.extname(file.originalname)}`;
                        const destination = `compagne/${req.params.nom_societe}/banners/${fileName}`;
                        const fileUrl = yield uploadToS3(file, destination);
                        bannerUrls.push(fileUrl);
                    }
                    // Traiter les vidéos avec S3
                    const videoFiles = files['videos'] || [];
                    const videoUrls = [];
                    // Upload des vidéos vers S3
                    for (const file of videoFiles) {
                        const fileName = `videos-${Date.now()}-${Math.round(Math.random() * 1E9)}${path_1.default.extname(file.originalname)}`;
                        const destination = `compagne/${req.params.nom_societe}/videos/${fileName}`;
                        const fileUrl = yield uploadToS3(file, destination);
                        videoUrls.push(fileUrl);
                    }
                    const partenaire = yield Partenaire_1.Partenaires.findOne({ _id: req.user });
                    // Récupérer et parser les données JSON
                    const id = new mongoose_1.default.Types.ObjectId();
                    const callToAction = req.body.call_to_action ? JSON.parse(req.body.call_to_action) : null;
                    const keywords = req.body.keywords ? JSON.parse(req.body.keywords) : [];
                    const periode = req.body.periode ? JSON.parse(req.body.periode) : {};
                    const Budget_totale = req.body.Budget_totale ? JSON.parse(req.body.Budget_totale) : null;
                    const pub = {
                        _id: id,
                        bannieres: bannerUrls,
                        videos: videoUrls,
                        call_to_action: callToAction,
                        keywords: keywords,
                        periode: { debut: req.body.dateDebut, fin: req.body.dateFin },
                        Budget_totale: Budget_totale,
                        statu: 'En attente de validation',
                        impressions: 0,
                        clicks: 0
                    };
                    console.log(pub);
                    // INTÉGRATION STRIPE ICI
                    try {
                        const budgetAmount = typeof Budget_totale === 'number' ? Budget_totale : parseFloat(Budget_totale || '0');
                        const session = yield stripe.checkout.sessions.create({
                            payment_method_types: ['card'],
                            line_items: [
                                {
                                    price_data: {
                                        currency: 'eur',
                                        product_data: {
                                            name: `Publicité ${req.params.nom_societe || ''}`,
                                            description: 'Campagne publicitaire',
                                        },
                                        unit_amount: Math.round(budgetAmount * 100),
                                    },
                                    quantity: 1,
                                },
                            ],
                            mode: 'payment',
                            success_url: `${process.env.front_end}/paiment_sucesses/${pub._id}?data=${encodeURIComponent(JSON.stringify(pub))}&type=publicite`,
                            cancel_url: `${process.env.front_end}/paiment_echouee/${pub._id}?type=publicite`,
                        });
                        // Retourner l'ID de la session pour redirection
                        res.status(201).json({
                            message: 'Publicité créée avec succès',
                            id: session.id,
                            publicite_id: id
                        });
                    }
                    catch (stripeError) {
                        console.error('Erreur Stripe:', stripeError);
                        res.status(400).json({
                            message: 'Erreur lors de la création du paiement',
                        });
                    }
                }
                catch (error) {
                    console.error('Erreur lors de la création de la publicité:', error);
                    res.status(500).json({
                        message: error,
                    });
                }
            }));
        });
    }
    getpubAllquizvalide(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                console.log('hhhhhhhhhhhhhhhhhhhh active');
                // Trouver tous les partenaires avec des pub_quiz actives
                const partenaires = yield Partenaire_1.Partenaires.find({ 'pub_quiz.statu': 'Active' });
                console.log(partenaires);
                const pubsQuizActives = [];
                for (const partenaire of partenaires) {
                    const pubsActives = partenaire.pub_quiz.filter(quiz => quiz.statu === 'Active');
                    pubsQuizActives.push(...pubsActives);
                }
                res.status(200).json(pubsQuizActives);
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la récupération des publicités quiz' });
            }
        });
    }
    pubcomplete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const partenaires = yield Partenaire_1.Partenaires.find();
                const configads = yield Configpublicite_1.default.find();
                for (const partenaire of partenaires) {
                    for (const pub of partenaire.pub_quiz) {
                        console.log(pub.periode.fin < new Date());
                        console.log(new Date());
                        if (pub.periode.fin < new Date() || (pub.clicks * configads[0].prixClic > pub.Budget_totale || pub.impressions * configads[0].prixImpression > pub.Budget_totale)) {
                            pub.statu = 'Complete';
                            console.log("pub complete", pub);
                        }
                    }
                    yield partenaire.save();
                }
                res.status(200).json(partenaires);
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la récupération des publicités quiz' });
            }
        });
    }
    Pubsauvgarde(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                console.log('hhhhhhhhhhhhhhhhhhhh');
                const id = req.user;
                const data = req.body.data;
                console.log("data", data);
                const pub = yield Partenaire_1.Partenaires.findOne({ '_id': id });
                pub === null || pub === void 0 ? void 0 : pub.pub_quiz.push(data);
                yield (pub === null || pub === void 0 ? void 0 : pub.save());
                res.status(200).json(pub);
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    covringsave(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.user;
                const data = req.body.data;
                console.log("data" + data);
                const partenaire = yield Partenaire_1.Partenaires.findOne({ '_id': id });
                yield (partenaire === null || partenaire === void 0 ? void 0 : partenaire.save());
                res.status(200).json(partenaire);
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    pubetatchanger(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.params.id;
                console.log('id' + id);
                const objectIdFromString = new mongodb_1.ObjectId(id);
                const pub = yield Partenaire_1.Partenaires.findOne({ 'pub_quiz._id': objectIdFromString });
                console.log(pub);
                console.log('mazelet mactivetch');
                if (pub) {
                    pub.pub_quiz.filter(quiz => {
                        var _a;
                        // Convert both to strings before comparing
                        if (((_a = quiz._id) === null || _a === void 0 ? void 0 : _a.toString()) === objectIdFromString.toString()) {
                            if (quiz.statu === 'En attente de validation') {
                                console.log('rahi active sayer');
                                quiz.statu = 'Active';
                            }
                        }
                    });
                    yield pub.save();
                }
                if (!pub) {
                    res.status(404).json({ error: 'Publicité non trouvée' });
                    return;
                }
                res.status(200).json(pub);
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    tourbypartenaire(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.params.id;
                const partenaire = yield Partenaire_1.Partenaires.findById(id);
                if (!partenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé' });
                    return;
                }
                const tours = partenaire.tours;
                res.status(200).json({ tours: tours, nom_societe: partenaire.information.inforegester.nom_entreprise });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    deleteTour(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.params.id;
                const partenaire = yield Partenaire_1.Partenaires.findOne({ 'tours._id': id });
                if (!partenaire) {
                    res.status(404).json({ error: 'tour non trouvé' });
                    return;
                }
                const tour = partenaire.tours.find(tour => { var _a; return ((_a = tour._id) === null || _a === void 0 ? void 0 : _a.toString()) === id; });
                for (const image of (tour === null || tour === void 0 ? void 0 : tour.images) || []) {
                    yield (0, exports.deleteFromS3)(image);
                }
                partenaire.tours = partenaire.tours.filter(tour => { var _a; return ((_a = tour._id) === null || _a === void 0 ? void 0 : _a.toString()) !== id; });
                yield partenaire.save();
                res.status(200).json({ message: 'Tour supprimé avec succès' });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    deletepubquiz(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.params.id;
                const partenaire = yield Partenaire_1.Partenaires.findOne({ 'pub_quiz._id': id });
                if (!partenaire) {
                    res.status(404).json({ error: 'Publicité non trouvée' });
                    return;
                }
                // Trouver la publicité à supprimer
                const pubquiz = partenaire.pub_quiz.find(quiz => { var _a; return ((_a = quiz._id) === null || _a === void 0 ? void 0 : _a.toString()) === id; });
                if (pubquiz) {
                    // Supprimer les fichiers de S3
                    for (const banner of pubquiz.bannieres) {
                        yield (0, exports.deleteFromS3)(banner);
                    }
                    for (const video of pubquiz.videos) {
                        yield (0, exports.deleteFromS3)(video);
                    }
                    // Supprimer la publicité du tableau pub_quiz
                    partenaire.pub_quiz = partenaire.pub_quiz.filter(quiz => { var _a; return ((_a = quiz._id) === null || _a === void 0 ? void 0 : _a.toString()) !== id; });
                    yield partenaire.save();
                }
                res.status(200).json({ message: 'Publicité supprimée avec succès' });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
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
                const { email } = req.body.inforamtion.inforegester;
                const partenaireExistant = yield Partenaire_1.Partenaires.findOne({ 'inforamtion.inforegester.email': email });
                if (partenaireExistant) {
                    res.status(400).json({ error: 'Un partenaire avec cet email existe déjà' });
                    return;
                }
                const partenaire = new Partenaire_1.Partenaires(req.body);
                console.log(partenaire);
                const Code = Fonction_1.default.generecode(100000, 900000);
                ;
                partenaire.securites = {
                    code: Code,
                    date: new Date(),
                    isverified: false,
                };
                partenaire.information.inforegester.motdepasse = yield bcryptjs_1.default.hash(partenaire.information.inforegester.motdepasse, 10);
                const savedPartenaire = yield partenaire.save();
                const token = Fonction_1.default.createtokenetcookies(res, savedPartenaire._id);
                yield Fonction_1.default.sendmail(email, 'Inscription', Code);
                res.status(201).json({ partenaire: savedPartenaire, token });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la création du partenaire' });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                console.log(req.body);
                const { email, password } = req.body;
                const partenaire = yield Partenaire_1.Partenaires.findOne({
                    'information.inforegester.email': email,
                    'securites.isverified': true
                });
                if (!partenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé ou non vérifié' });
                    return;
                }
                // Vérifier que le mot de passe existe
                if (!partenaire.information.inforegester.motdepasse) {
                    res.status(400).json({ error: 'Mot de passe non défini pour ce partenaire' });
                    return;
                }
                const match = yield bcryptjs_1.default.compare(password, partenaire.information.inforegester.motdepasse);
                if (!match) {
                    res.status(400).json({ error: 'Mot de passe incorrect' });
                    return;
                }
                const token = Fonction_1.default.createtokenetcookies(res, partenaire._id);
                res.status(200).json({
                    success: true,
                    partenaire: {
                        _id: partenaire._id,
                        information: {
                            inforegester: {
                                nom_entreprise: partenaire.information.inforegester.nom_entreprise,
                                email: partenaire.information.inforegester.email,
                                telephone: partenaire.information.inforegester.telephone
                            }
                        }
                    },
                    token
                });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la connexion' });
            }
        });
    }
    completerprofil(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.user;
                console.log("req.body.information=>", req.body.information.info_societe.adresse.ville);
                let partenaire = yield Partenaire_1.Partenaires.findById(id);
                if (!partenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé' });
                    return;
                }
                // Mise à jour sélective des champs
                const updateFields = {
                    // Mise à jour des informations de registre (si nécessaire)
                    'information.inforegester.nom_entreprise': (_c = (_b = (_a = req.body.information) === null || _a === void 0 ? void 0 : _a.inforegester) === null || _b === void 0 ? void 0 : _b.nom_entreprise) !== null && _c !== void 0 ? _c : partenaire.information.inforegester.nom_entreprise,
                    'information.inforegester.Proprietaire': (_f = (_e = (_d = req.body.information) === null || _d === void 0 ? void 0 : _d.inforegester) === null || _e === void 0 ? void 0 : _e.Proprietaire) !== null && _f !== void 0 ? _f : partenaire.information.inforegester.Proprietaire,
                    'information.inforegester.email': (_j = (_h = (_g = req.body.information) === null || _g === void 0 ? void 0 : _g.inforegester) === null || _h === void 0 ? void 0 : _h.email) !== null && _j !== void 0 ? _j : partenaire.information.inforegester.email,
                    'information.inforegester.telephone': (_m = (_l = (_k = req.body.information) === null || _k === void 0 ? void 0 : _k.inforegester) === null || _l === void 0 ? void 0 : _l.telephone) !== null && _m !== void 0 ? _m : partenaire.information.inforegester.telephone,
                    // Préserver le mot de passe existant pour éviter l'erreur de validation
                    'information.inforegester.motdepasse': partenaire.information.inforegester.motdepasse,
                    // Mise à jour des informations de société
                    'information.info_societe.numero_siret': (_q = (_p = (_o = req.body.information) === null || _o === void 0 ? void 0 : _o.info_societe) === null || _p === void 0 ? void 0 : _p.numero_siret) !== null && _q !== void 0 ? _q : partenaire.information.info_societe.numero_siret,
                    'information.info_societe.domaines': (_t = (_s = (_r = req.body.information) === null || _r === void 0 ? void 0 : _r.info_societe) === null || _s === void 0 ? void 0 : _s.domaines) !== null && _t !== void 0 ? _t : partenaire.information.info_societe.domaines,
                    // Mise à jour de l'adresse
                    'information.info_societe.adresse.ville': (_x = (_w = (_v = (_u = req.body.information) === null || _u === void 0 ? void 0 : _u.info_societe) === null || _v === void 0 ? void 0 : _v.adresse) === null || _w === void 0 ? void 0 : _w.ville) !== null && _x !== void 0 ? _x : partenaire.information.info_societe.adresse.ville,
                    'information.info_societe.adresse.pays': (_1 = (_0 = (_z = (_y = req.body.information) === null || _y === void 0 ? void 0 : _y.info_societe) === null || _z === void 0 ? void 0 : _z.adresse) === null || _0 === void 0 ? void 0 : _0.pays) !== null && _1 !== void 0 ? _1 : partenaire.information.info_societe.adresse.pays,
                    'information.info_societe.adresse.rue': (_5 = (_4 = (_3 = (_2 = req.body.information) === null || _2 === void 0 ? void 0 : _2.info_societe) === null || _3 === void 0 ? void 0 : _3.adresse) === null || _4 === void 0 ? void 0 : _4.rue) !== null && _5 !== void 0 ? _5 : partenaire.information.info_societe.adresse.rue,
                    'information.info_societe.rib': (_8 = (_7 = (_6 = req.body.information) === null || _6 === void 0 ? void 0 : _6.info_societe) === null || _7 === void 0 ? void 0 : _7.rib) !== null && _8 !== void 0 ? _8 : partenaire.information.info_societe.rib,
                    'information.info_societe.tva': (_11 = (_10 = (_9 = req.body.information) === null || _9 === void 0 ? void 0 : _9.info_societe) === null || _10 === void 0 ? void 0 : _10.tva) !== null && _11 !== void 0 ? _11 : partenaire.information.info_societe.tva
                };
                console.log("updateFields=>", updateFields);
                // Mise à jour partielle
                const updatedpartenaire = yield Partenaire_1.Partenaires.findByIdAndUpdate(id, { $set: updateFields }, {
                    new: true, // Retourne le document mis à jour
                    runValidators: true // Valide les champs mis à jour
                });
                console.log('updatedpartenaire=>', updatedpartenaire);
                if (!updatedpartenaire) {
                    res.status(404).json({ error: 'partenaire non trouvé' });
                    return;
                }
                res.status(200).json({
                    message: 'Profil mis à jour avec succès',
                    chauffeur: updatedpartenaire
                });
            }
            catch (error) {
                console.error('Erreur lors de la mise à jour du partenaire:', error);
                res.status(500).json({
                    error: 'Erreur lors de la mise à jour du partenaire'
                });
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
                const partenaire = yield Partenaire_1.Partenaires.findById(id);
                if (!partenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé' });
                    return;
                }
                const Code = Fonction_1.default.generecode(100000, 900000);
                ;
                partenaire.securites.code = Code;
                yield partenaire.save();
                yield Fonction_1.default.sendmail(partenaire.information.inforegester.email, 'Inscription', Code);
                res.status(200).json({
                    success: true,
                    message: 'Email envoyé avec succès'
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
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
                const partenaire = yield Partenaire_1.Partenaires.findOne({
                    '_id': id,
                    'securites.code': code,
                    'securites.date': { $gt: new Date(Date.now() - 15 * 60 * 1000) }
                });
                console.log(req.body);
                if (!partenaire) {
                    console.log('partenaire non trouvé');
                    res.status(400).json({
                        success: false,
                        message: 'Le code est invalide ou a expiré'
                    });
                    return;
                }
                partenaire.securites = {
                    isverified: true
                };
                yield partenaire.save();
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
                console.log("email=>", email);
                const partenaire = yield Partenaire_1.Partenaires.findOne({ 'information.inforegester.email': email });
                if (!partenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé' });
                    return;
                }
                const resetToken = crypto_1.default.randomBytes(20).toString("hex");
                const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
                // Utiliser findByIdAndUpdate pour éviter la validation complète
                yield Partenaire_1.Partenaires.findByIdAndUpdate(partenaire._id, {
                    resetPasswordToken: resetToken,
                    resetPasswordTokenExpire: resetTokenExpiresAt
                }, { runValidators: false } // Désactiver la validation pour cette opération
                );
                yield Fonction_1.default.sendmail(email, 'password', process.env.front_end + "/Auth/mot_passe_oblier/reset/?token=" + resetToken + "&type=partenaire");
                res.status(200).json({
                    success: true,
                    message: 'Email envoyé avec succès'
                });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: "Erreur lors de l'envoi du mail de réinitialisation", errors: error });
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
                const partenaire = yield Partenaire_1.Partenaires.findOne({
                    resetPasswordToken: token,
                    resetPasswordTokenExpire: { $gt: Date.now() },
                });
                if (!partenaire || !partenaire.information || !partenaire.information.inforegester) {
                    res.status(400).json({ success: false, message: "Token de réinitialisation invalide ou expiré" });
                    return;
                }
                const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
                partenaire.information.inforegester.motdepasse = hashedPassword;
                partenaire.resetPasswordToken = undefined;
                partenaire.resetPasswordTokenExpire = undefined;
                yield partenaire.save();
                res.status(200).json({ success: true, message: "Mot de passe réinitialisé avec succès" });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
            }
        });
    }
    Createpartenaire(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const partenaire = new Partenaire_1.Partenaires(req.body);
                const savedPartenaire = yield partenaire.save();
                res.status(201).json(savedPartenaire);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la création du partenaire' });
            }
        });
    }
    getAllPartenaires(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const partenaires = yield Partenaire_1.Partenaires.find();
                res.status(200).json(partenaires);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération des partenaires' });
            }
        });
    }
    getPartenaireById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { id } = req.params;
                const partenaire = yield Partenaire_1.Partenaires.findById(id);
                if (!partenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé' });
                    return;
                }
                res.status(200).json(partenaire);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération du partenaire' });
            }
        });
    }
    updatePartenaire(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { id } = req.params;
                const updatedPartenaire = yield Partenaire_1.Partenaires.findByIdAndUpdate(id, req.body, { new: true });
                if (!updatedPartenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé' });
                    return;
                }
                res.status(200).json(updatedPartenaire);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la mise à jour du partenaire' });
            }
        });
    }
    deletePartenaire(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { id } = req.params;
                const deletedPartenaire = yield Partenaire_1.Partenaires.findByIdAndDelete(id);
                if (!deletedPartenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé' });
                    return;
                }
                res.status(200).json({ message: 'Partenaire supprimé avec succès' });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la suppression du partenaire' });
            }
        });
    }
    getPartenaireByToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
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
                const partenaire = yield Partenaire_1.Partenaires.findById(id).select('-motdepasse');
                ;
                if (!partenaire) {
                    res.status(401).json({ message: 'Partenaire non trouvé' });
                    return;
                }
                res.status(200).json(partenaire);
            }
            catch (err) {
                res.status(403).json({ message: 'Token invalide' });
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
                const user = yield Partenaire_1.Partenaires.findById(id);
                if (!user) {
                    res.status(404).json({ message: 'partenaire non trouvé' });
                    return;
                }
                // Check if the current password matches
                const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.information.inforegester.motdepasse);
                if (!isMatch) {
                    res.status(400).json({ message: 'Current password is incorrect' });
                    return;
                }
                // Hash the new password
                const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
                user.information.inforegester.motdepasse = hashedPassword;
                yield user.save();
                res.status(200).json({ message: 'Password changed successfully' });
            }
            catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'An error occurred while changing the password' });
            }
        });
    }
}
exports.ControllerpartenairInstance = new ControllerPartenaire();
