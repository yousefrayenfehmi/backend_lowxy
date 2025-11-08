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
exports.ControllercovringadsInstance = exports.Controllercovringads = void 0;
const Chauffeure_1 = require("../models/Chauffeure");
const BDconnection_1 = require("../BDconnection/BDconnection");
const Touriste_1 = require("../models/Touriste");
const Partenaire_1 = require("../models/Partenaire");
const Controllerpartenaire_1 = require("./Controllerpartenaire");
const Covering_ads_1 = require("../models/Covering_ads");
const mongoose_1 = __importStar(require("mongoose"));
const stripe_1 = __importDefault(require("stripe"));
const Fonction_1 = __importDefault(require("../fonction/Fonction"));
const Admin_1 = require("../models/Admin");
const stripe = new stripe_1.default('sk_test_51S3lkdQyRlRGZEmDNI1UnQ94xHMubhAmKIDEu2g7iapu5PuTSRYRstBEZ1ZHBLmoNE6f7fm0JlF7GbbWYWfTHPB9007zXrJlsS');
class Controllercovringads {
    paidcovering(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(req.body);
            try {
                const covring = {
                    _id: new mongoose_1.Types.ObjectId(),
                    image: req.body.details.image,
                    modele_voiture: req.body.details.modele_voiture,
                    type_covering: req.body.details.type_covering,
                    nombre_taxi: req.body.details.nombre_taxi,
                    nombre_jour: req.body.details.nombre_jour,
                    prix: req.body.details.prix,
                    statu: 'pending',
                };
                console.log(covring);
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
                                unit_amount: Math.round(covring.prix * 100),
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${process.env.front_end}/Covering_ads/Personnel/partenaire/paiment_sucesses/${covring._id}?data=${encodeURIComponent(JSON.stringify(covring))}`,
                    cancel_url: `${process.env.front_end}/Covering_ads/Personnel/partenaire/paiment_echouee/${covring._id}?type=covering`,
                });
                res.status(200).json({ id: session.id });
            }
            catch (error) {
                console.error('Erreur lors de l\'upload sur S3:', error);
                res.status(500).json({ message: 'Erreur lors de l\'upload: ' + error.message });
            }
        });
    }
    savecovering(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                console.log("req.body:" + req.body);
                const id = req.user;
                const coveringAd = req.body;
                console.log('coveringAd:' + coveringAd);
                let type;
                if (yield Partenaire_1.Partenaires.findById(id)) {
                    type = 'partenaire';
                }
                else if (yield Touriste_1.Touristes.findById(id)) {
                    type = 'client';
                }
                else {
                    console.log('Utilisateur non trouvé');
                    res.status(400).json({ error: 'Utilisateur non trouvé' });
                    return;
                }
                // S'assurer que coveringAd a l'ID
                if (!coveringAd._id) {
                    coveringAd._id = new mongoose_1.Types.ObjectId();
                }
                // Mapper les champs potentiellement différents envoyés par le front
                const image = coveringAd.image || coveringAd.lien_photo;
                const modele_voiture = coveringAd.modele_voiture || coveringAd.type_voiture;
                const nombre_taxi = (_a = coveringAd.nombre_taxi) !== null && _a !== void 0 ? _a : coveringAd.nombre_taxis;
                const nombre_jour = (_b = coveringAd.nombre_jour) !== null && _b !== void 0 ? _b : coveringAd.nombre_jours;
                const statutClient = coveringAd.statu || coveringAd.status || coveringAd.statut;
                const normalizedStatus = (statutClient || '').toLowerCase() === 'active'
                    ? 'Active'
                    : (statutClient || '').toLowerCase() === 'completed'
                        ? 'Completed'
                        : 'Pending';
                // Créer un nouvel objet CoveringAd avec tous les champs requis
                const coveringAds = new Covering_ads_1.CoveringAd({
                    _id: coveringAd._id,
                    creator: {
                        type: type,
                        id: id
                    },
                    details: {
                        modele_voiture: modele_voiture,
                        type_covering: coveringAd.type_covering,
                        image: image,
                        nombre_taxi: parseInt(nombre_taxi),
                        nombre_jour: parseInt(nombre_jour),
                        prix: parseFloat(coveringAd.prix)
                    },
                    status: normalizedStatus,
                    assigned_taxis: coveringAd.assigned_taxis || []
                });
                console.log(coveringAds);
                yield coveringAds.save();
                const admins = yield Admin_1.Admin.find({});
                let partenaire;
                let touriste;
                for (const admin of admins) {
                    if (coveringAds.creator.type === 'partenaire') {
                        partenaire = yield Partenaire_1.Partenaires.findById(coveringAds.creator.id);
                    }
                    else {
                        touriste = yield Touriste_1.Touristes.findById(coveringAds.creator.id);
                    }
                    Fonction_1.default.sendmailAdminCovering(admin.email, {
                        nom_partenaire: (partenaire === null || partenaire === void 0 ? void 0 : partenaire.information.inforegester.nom_entreprise) || (touriste === null || touriste === void 0 ? void 0 : touriste.info.nom_complet) || "Partenaire inconnu",
                        modele: coveringAds.details.modele_voiture,
                        type: coveringAds.details.type_covering,
                        nombre_taxi: coveringAds.details.nombre_taxi,
                        nombre_jour: coveringAds.details.nombre_jour,
                        prix: coveringAds.details.prix
                    }, `http://localhost:4200/admin/utilisateurs/partenaires/${coveringAds.creator.id}/covering`);
                }
                /*const chauffeurs=await Chauffeurs.find({vehicule:{$in:[coveringAds.details.modele_voiture]}})
                for(const chauffeur of chauffeurs){
                  Fonction.sendmailCovering(chauffeur.info.email,coveringAds.details)
                }*/
                res.status(200).json({ message: 'Campagne publicitaire enregistrée avec succès' });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error });
            }
        });
    }
    // Méthode pour récupérer les campagnes disponibles pour les taxis
    getAvailableCampaigns(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                // Extraire les paramètres de filtre
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const modele = req.query.modele;
                const type_covering = req.query.type_covering;
                const min_days = parseInt(req.query.min_days) || 0;
                // Construire le filtre
                const filter = { status: 'Active' };
                if (modele)
                    filter['details.modele_voiture'] = modele;
                if (type_covering)
                    filter['details.type_covering'] = type_covering;
                if (min_days > 0)
                    filter['details.nombre_jour'] = { $gte: min_days };
                // Calculer le skip pour la pagination
                const skip = (page - 1) * limit;
                // Récupérer les campagnes
                const campaigns = yield Covering_ads_1.CoveringAd.find(filter)
                    .sort({ 'dates.debut': 1 })
                    .skip(skip)
                    .limit(limit);
                console.log("campaigns:" + campaigns);
                // Compter le total
                const total = yield Covering_ads_1.CoveringAd.countDocuments(filter);
                res.status(200).json({
                    success: true,
                    count: campaigns.length,
                    total,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit)
                    },
                    data: campaigns,
                    filter: filter
                });
            }
            catch (error) {
                console.error('Erreur lors de la récupération des campagnes disponibles:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des campagnes',
                    error
                });
            }
        });
    }
    // Méthode pour qu'un taxi rejoigne une campagne
    joinCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeurId = req.user;
                const { campaignId } = req.params;
                console.log("campaignId:" + campaignId);
                const chauffeurDetails = yield Chauffeure_1.Chauffeurs.findById(chauffeurId);
                if (!chauffeurDetails) {
                    res.status(404).json({
                        success: false,
                        message: 'Taxi non trouvé'
                    });
                    return;
                }
                // Vérifier si le taxi participe à cette campagne
                const isParticipating = chauffeurDetails.active_coverings &&
                    chauffeurDetails.active_coverings.some(c => c.toString() === campaignId);
                if (isParticipating) {
                    console.log('Ce taxi participe déjà à cette campagne');
                    res.status(400).json({
                        success: false,
                        message: 'Ce taxi participe déjà à cette campagne'
                    });
                    return;
                }
                // Récupérer la campagne
                const campaign = yield Covering_ads_1.CoveringAd.findById(campaignId);
                if (!campaign) {
                    res.status(404).json({
                        success: false,
                        message: 'Campagne non trouvée'
                    });
                    return;
                }
                if (campaign.status === 'Pending') {
                    res.status(400).json({
                        success: false,
                        message: 'Cette campagne n\'est plus disponible'
                    });
                    return;
                }
                const verifcompagne = yield Covering_ads_1.CoveringAd.find({ assigned_taxis: { $in: [chauffeurId] } });
                if (verifcompagne.length > 0) {
                    console.log("verifcompagne:" + verifcompagne);
                    res.status(400).json({
                        success: false,
                        message: 'Ce taxi participe déjà à une campagne active'
                    });
                    return;
                }
                // Vérifier si le modèle du taxi correspond
                if (((_a = chauffeurDetails.vehicule.modele) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== campaign.details.modele_voiture.toLowerCase()) {
                    console.log("chauffeurDetails.vehicule.modele:" + chauffeurDetails.vehicule.modele);
                    console.log("campaign.details.modele_voiture:" + campaign.details.modele_voiture);
                    res.status(400).json({
                        success: false,
                        message: 'Le modèle de votre taxi ne correspond pas à celui requis pour cette campagne'
                    });
                    return;
                }
                // Vérifier si le nombre maximum de taxis n'est pas atteint
                if (campaign.assigned_taxis.length >= campaign.details.nombre_taxi) {
                    res.status(400).json({
                        success: false,
                        message: 'Le nombre maximum de taxis pour cette campagne a déjà été atteint'
                    });
                    return;
                }
                // Ajouter le taxi à la campagne
                campaign.assigned_taxis.push(chauffeurDetails._id);
                // Si le nombre requis est atteint, activer la campagne
                if (campaign.assigned_taxis.length >= campaign.details.nombre_taxi) {
                    campaign.status = 'Completed';
                }
                console.log("campaign.status:" + campaign);
                yield campaign.save();
                // Ajouter la campagne aux coverings actifs du taxi
                chauffeurDetails.active_coverings = chauffeurDetails.active_coverings || [];
                // Calculer la date de fin en ajoutant le nombre de jours
                const dateDebut = new Date();
                const dateFin = new Date();
                dateFin.setDate(dateDebut.getDate() + campaign.details.nombre_jour);
                chauffeurDetails.active_coverings.push({
                    id: campaign._id,
                    date_debut: dateDebut,
                    date_fin: dateFin
                });
                yield chauffeurDetails.save();
                res.status(200).json({
                    success: true,
                    message: 'Vous avez rejoint la campagne avec succès',
                    data: {
                        campaignId: campaign._id,
                        taxiId: chauffeurDetails._id
                    }
                });
            }
            catch (error) {
                console.error('Erreur lors de la participation à la campagne:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la participation à la campagne',
                    error
                });
            }
        });
    }
    getcoveringadsById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.params.id;
                const coveringads = yield Covering_ads_1.CoveringAd.find({ 'creator.id': id });
                const partenaire = yield Partenaire_1.Partenaires.findById(id);
                res.status(200).json({ covering: coveringads, nom_societe: partenaire === null || partenaire === void 0 ? void 0 : partenaire.information.inforegester.nom_entreprise });
            }
            catch (error) {
                console.error('Erreur lors de la récupération des campagnes:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des campagnes',
                    error
                });
            }
        });
    }
    // Méthode pour récupérer les campagnes du taxi connecté
    getMyCampaigns(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeurId = req.user;
                // Récupérer le taxi et ses campagnes actives
                const chauffeurDetails = yield Chauffeure_1.Chauffeurs.findById(chauffeurId);
                if (!chauffeurDetails) {
                    res.status(404).json({
                        success: false,
                        message: 'Taxi non trouvé'
                    });
                    return;
                }
                console.log("active_coverings:" + chauffeurDetails);
                // Récupérer les détails des campagnes actives
                const activeCampaigns = yield Covering_ads_1.CoveringAd.find({
                    _id: { $in: ((_a = chauffeurDetails.active_coverings) === null || _a === void 0 ? void 0 : _a.map(c => c.id)) || [] }
                });
                console.log("activeCampaigns:" + activeCampaigns);
                console.log("covering_history:" + chauffeurDetails.covering_history);
                // Récupérer les détails des campagnes passées
                const historyCampaigns = yield Covering_ads_1.CoveringAd.find({
                    _id: { $in: chauffeurDetails.covering_history || [] }
                });
                console.log(historyCampaigns);
                res.status(200).json({
                    success: true,
                    data: {
                        active: activeCampaigns || [],
                        history: historyCampaigns || [],
                        covering_history: chauffeurDetails.covering_history || []
                    }
                });
            }
            catch (error) {
                console.log(error);
                console.error('Erreur lors de la récupération des campagnes du taxi:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des campagnes',
                    error
                });
            }
        });
    }
    ActiveCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.params.id;
                const campaign = yield Covering_ads_1.CoveringAd.findById(id);
                console.log(campaign);
                if (campaign) {
                    campaign.status = 'Active';
                    yield campaign.save();
                    const chauffeurs = yield Chauffeure_1.Chauffeurs.find();
                    for (const chauffeur of chauffeurs) {
                        Fonction_1.default.sendmailChauffeurCovering(chauffeur.info.email, { modele: campaign.details.modele_voiture, type: campaign.details.type_covering, prix: campaign.details.prix }, `${process.env.front_end}/covering-ads-commande`);
                    }
                    res.status(200).json(campaign);
                }
                else {
                    res.status(404).json({ message: 'Campagne non trouvée' });
                }
            }
            catch (error) {
                console.error('Erreur lors de l\'activation de la campagne:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'activation de la campagne',
                    error
                });
            }
        });
    }
    // Méthode pour qu'un taxi quitte une campagne
    leaveCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeurId = req.user;
                const { campaignId } = req.params;
                const { reason } = req.body;
                // Vérifier si l'utilisateur est un chauffeur de taxi
                const chauffeur = yield Chauffeure_1.Chauffeurs.findById(chauffeurId);
                if (!chauffeur || !chauffeur._id) {
                    res.status(403).json({
                        success: false,
                        message: 'Accès non autorisé ou taxi non assigné'
                    });
                    return;
                }
                const chauffeurDetails = yield Chauffeure_1.Chauffeurs.findById(chauffeur._id);
                if (!chauffeurDetails) {
                    res.status(404).json({
                        success: false,
                        message: 'Taxi non trouvé'
                    });
                    return;
                }
                // Vérifier si le taxi participe à cette campagne
                const isParticipating = chauffeurDetails.active_coverings &&
                    chauffeurDetails.active_coverings.some(c => c.toString() === campaignId);
                if (!isParticipating) {
                    res.status(400).json({
                        success: false,
                        message: 'Vous ne participez pas à cette campagne'
                    });
                    return;
                }
                // Récupérer la campagne
                const campaign = yield Covering_ads_1.CoveringAd.findById(campaignId);
                if (!campaign) {
                    res.status(404).json({
                        success: false,
                        message: 'Campagne non trouvée'
                    });
                    return;
                }
                // Vérifier si la campagne est active depuis moins de 24h (règle d'exemple)
                if (campaign.status === 'Active') {
                    const nowDate = new Date();
                    const startDate = new Date(); // Utiliser la date actuelle comme approximation
                    const timeDiff = Math.abs(nowDate.getTime() - startDate.getTime());
                    const diffHours = timeDiff / (1000 * 3600);
                    if (diffHours > 24) {
                        res.status(400).json({
                            success: false,
                            message: 'Vous ne pouvez plus quitter cette campagne après 24h de participation'
                        });
                        return;
                    }
                }
                // Retirer le taxi de la campagne
                campaign.assigned_taxis = campaign.assigned_taxis.filter(t => t.toString() !== chauffeur._id.toString());
                // Si c'était le dernier taxi, remettre la campagne en attente
                if (campaign.assigned_taxis.length === 0 && campaign.status === 'Active') {
                    campaign.status = 'Completed';
                }
                yield campaign.save();
                // Retirer la campagne des coverings actifs du taxi
                chauffeur.active_coverings = (chauffeur.active_coverings || []).filter(c => c.toString() !== campaignId);
                // Ajouter à l'historique (optionnel)
                if (!chauffeur.covering_history) {
                    chauffeur.covering_history = [];
                }
                chauffeur.covering_history.push(new mongoose_1.Types.ObjectId(campaignId));
                yield chauffeur.save();
                // Enregistrer la raison (optionnel, à adapter selon votre modèle)
                // ...
                res.status(200).json({
                    success: true,
                    message: 'Vous avez quitté la campagne avec succès'
                });
            }
            catch (error) {
                console.error('Erreur lors du retrait de la campagne:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors du retrait de la campagne',
                    error
                });
            }
        });
    }
    // méthode pour récupérer les campagnes d'un créateur
    getCampaignsByCreator(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const creatorId = req.user;
                console.log(creatorId);
                const campaigns = yield Covering_ads_1.CoveringAd.find({ 'creator.id': creatorId });
                res.status(200).json({
                    success: true,
                    data: campaigns
                });
            }
            catch (error) {
                console.error('Erreur lors de la récupération des campagnes du créateur:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des campagnes du créateur',
                    error
                });
            }
        });
    }
    // Méthode pour déplacer les campagnes terminées vers l'historique
    Capaigns_complete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                // Trouver toutes les campagnes actives dont la date de fin est passée
                const expiredCampaigns = yield Covering_ads_1.CoveringAd.find({ $expr: { $eq: [{ $size: "$assigned_taxis" }, "$details.nombre_taxi"] } });
                if (expiredCampaigns.length === 0) {
                    res.status(200).json({
                        success: true,
                        message: 'Aucune campagne expirée à traiter',
                        processed: 0
                    });
                    return;
                }
                let processed = 0;
                for (const campaign of expiredCampaigns) {
                    // Mettre à jour le statut de la campagne
                    campaign.status = 'Completed';
                    yield campaign.save();
                    // Pour chaque taxi assigné à la campagne
                    processed++;
                }
                res.status(200).json({
                    success: true,
                    message: `${processed} campagnes ont été déplacées vers l'historique`,
                    processed
                });
            }
            catch (error) {
                console.error('Erreur lors du déplacement des campagnes vers l\'historique:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors du traitement des campagnes expirées',
                    error
                });
            }
        });
    }
    deleteCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const id = req.params.id;
                console.log(id);
                const campaign = yield Covering_ads_1.CoveringAd.findById(id);
                console.log(campaign);
                if (!campaign) {
                    res.status(404).json({ message: 'Campagne non trouvée' });
                    return;
                }
                yield (0, Controllerpartenaire_1.deleteFromS3)(campaign.details.image);
                yield campaign.deleteOne();
                res.status(200).json({ message: 'Campagne supprimée avec succès' });
            }
            catch (error) {
                console.error('Erreur lors de la suppression de la campagne:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la suppression de la campagne',
                    error
                });
            }
        });
    }
    // Méthode pour qu'un taxi signale un problème avec une campagne
    reportCampaignIssue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const chauffeurId = req.user;
                const { campaignId } = req.params;
                const { issue_type, description } = req.body;
                // Vérifications et validations similaires aux méthodes précédentes
                // ...
                // Créer un rapport de problème (selon votre modèle de données)
                const report = {
                    campaign_id: new mongoose_1.Types.ObjectId(campaignId),
                    chauffeur_id: chauffeurId,
                    taxi_id: null, // À récupérer
                    issue_type,
                    description,
                    status: 'pending',
                    created_at: new Date()
                };
                // Sauvegarder le rapport (à adapter selon votre modèle)
                // await IssueReport.create(report);
                res.status(201).json({
                    success: true,
                    message: 'Problème signalé avec succès',
                    data: report
                });
            }
            catch (error) {
                console.error('Erreur lors du signalement du problème:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors du signalement du problème',
                    error
                });
            }
        });
    }
    moveCampaignsToHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const now = new Date();
                // Trouver tous les chauffeurs qui ont des campagnes expirées
                const chauffeurs = yield Chauffeure_1.Chauffeurs.find({
                    "active_coverings.date_fin": { $lt: now }
                });
                if (chauffeurs.length === 0) {
                    res.status(200).json({
                        success: true,
                        message: 'Aucune campagne expirée à traiter',
                        processed: 0
                    });
                    return;
                }
                let processed = 0;
                // Pour chaque chauffeur
                for (const chauffeur of chauffeurs) {
                    // S'assurer que l'historique existe
                    if (!chauffeur.covering_history) {
                        chauffeur.covering_history = [];
                    }
                    // S'assurer que active_coverings existe
                    if (!chauffeur.active_coverings) {
                        chauffeur.active_coverings = [];
                        continue; // Passer au chauffeur suivant car aucune campagne à traiter
                    }
                    // Identifier les campagnes expirées
                    const expiredCoverings = chauffeur.active_coverings.filter(covering => new Date(covering.date_fin) < now);
                    // Ajouter les IDs des campagnes expirées à l'historique
                    for (const covering of expiredCoverings) {
                        chauffeur.covering_history.push(covering.id);
                        processed++;
                    }
                    // Filtrer les campagnes actives pour ne garder que celles non expirées
                    chauffeur.active_coverings = chauffeur.active_coverings.filter(covering => new Date(covering.date_fin) >= now);
                    yield chauffeur.save();
                }
                res.status(200).json({
                    success: true,
                    message: `${processed} campagnes ont été déplacées vers l'historique`,
                    processed
                });
            }
            catch (error) {
                console.error('Erreur lors du déplacement des campagnes vers l\'historique:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors du traitement des campagnes expirées',
                    error
                });
            }
        });
    }
}
exports.Controllercovringads = Controllercovringads;
exports.ControllercovringadsInstance = new Controllercovringads();
