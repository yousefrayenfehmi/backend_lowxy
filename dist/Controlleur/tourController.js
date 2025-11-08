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
exports.tourControllerInstance = void 0;
const Partenaire_1 = require("../models/Partenaire");
const BDconnection_1 = require("../BDconnection/BDconnection");
const mongoose_1 = __importStar(require("mongoose"));
// Configuration pour le téléchargement des fichiers
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Controllerpartenaire_1 = require("./Controllerpartenaire");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
// Créer le dossier uploads s'il n'existe pas
const uploadDir = path_1.default.join(__dirname, '../uploads/Tours_Photos');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configuration de multer pour le stockage des fichiers
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
// Filtrer les fichiers pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(null, false);
        // Nous ne passons pas d'erreur directement au callback car multer s'attend à ce que le premier paramètre soit null
        // L'erreur est gérée via le second paramètre false
    }
};
// Limiter la taille des fichiers à 2MB
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: fileFilter
});
class TourController {
    // Méthode pour vérifier la connexion à la BD
    checkDBConnection(res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                    return true;
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return false;
                }
            }
            return true;
        });
    }
    // Récupérer le partenaire à partir du token
    getPartenaireFromToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Récupérer l'ID du partenaire depuis le token (déjà vérifié par le middleware)
                const partenaireId = req.user;
                if (!partenaireId || !mongoose_1.Types.ObjectId.isValid(partenaireId)) {
                    res.status(400).json({ error: 'ID partenaire invalide ou manquant' });
                    return null;
                }
                const partenaire = yield Partenaire_1.Partenaires.findById(partenaireId);
                if (!partenaire) {
                    res.status(404).json({ error: 'Partenaire non trouvé' });
                    return null;
                }
                return partenaire;
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération du partenaire' });
                return null;
            }
        });
    }
    // Créer un tour pour le partenaire connecté
    creerTour(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const partenaire = yield this.getPartenaireFromToken(req, res);
                if (!partenaire)
                    return;
                const tourData = req.body;
                console.log(tourData);
                //ajouter commission
                tourData.commission = 20;
                // Valider les données du tour
                if (!tourData.nom || !tourData.description || !tourData.ville || !tourData.duree) {
                    console.log("Données du tour incomplètes");
                    console.log(tourData.nom, tourData.description, tourData.ville, tourData.duree);
                    res.status(400).json({ error: 'Données du tour incomplètes' });
                    return;
                }
                // Initialiser le tableau d'images si non défini
                if (!tourData.images) {
                    tourData.images = [];
                }
                // Ajouter le tour au partenaire
                partenaire.tours.push(tourData);
                yield partenaire.save();
                // Récupérer le tour créé (le dernier ajouté)
                const nouveauTour = partenaire.tours[partenaire.tours.length - 1];
                res.status(201).json({
                    success: true,
                    message: 'Tour créé avec succès',
                    tour: nouveauTour
                });
            }
            catch (error) {
                console.log(error);
                console.error('Erreur lors de la création du tour:', error);
                res.status(500).json({ error: 'Erreur lors de la création du tour' });
            }
        });
    }
    // Récupérer tous les tours du partenaire connecté
    getMesTours(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const partenaire = yield this.getPartenaireFromToken(req, res);
                if (!partenaire)
                    return;
                res.status(200).json({
                    success: true,
                    tours: partenaire.tours
                });
            }
            catch (error) {
                console.error('Erreur lors de la récupération des tours:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération des tours' });
            }
        });
    }
    // Récupérer un tour spécifique du partenaire connecté
    getMonTourById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const tourId = req.params.tourId;
                if (!mongoose_1.Types.ObjectId.isValid(tourId)) {
                    res.status(400).json({ error: 'ID tour invalide' });
                    return;
                }
                const partenaire = yield this.getPartenaireFromToken(req, res);
                if (!partenaire)
                    return;
                const tour = partenaire.tours.id(tourId);
                if (!tour) {
                    res.status(404).json({ error: 'Tour non trouvé' });
                    return;
                }
                res.status(200).json({
                    success: true,
                    tour: tour
                });
            }
            catch (error) {
                console.error('Erreur lors de la récupération du tour:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération du tour' });
            }
        });
    }
    // Mettre à jour un tour du partenaire connecté
    updateTour(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const tourId = req.params.tourId;
                if (!mongoose_1.Types.ObjectId.isValid(tourId)) {
                    res.status(400).json({ error: 'ID tour invalide' });
                    return;
                }
                const partenaire = yield this.getPartenaireFromToken(req, res);
                if (!partenaire)
                    return;
                const tour = partenaire.tours.id(tourId);
                if (!tour) {
                    res.status(404).json({ error: 'Tour non trouvé' });
                    return;
                }
                const updateData = req.body;
                // Vérifier si on essaie de modifier des dates passées
                const maintenant = new Date();
                if (updateData.jours) {
                    // Identifier les jours existants qui sont déjà passés
                    const joursExistants = tour.jours.filter((jour) => new Date(jour.date) < maintenant);
                    // Vérifier si les dates passées sont modifiées
                    const datesPasseesModifiees = joursExistants.some((jourExistant) => {
                        const jourModifie = updateData.jours.find((jour) => jour._id && jour._id.toString() === jourExistant._id.toString());
                        return jourModifie && JSON.stringify(jourModifie) !== JSON.stringify(jourExistant);
                    });
                    if (datesPasseesModifiees) {
                        res.status(400).json({
                            success: false,
                            message: 'Les dates passées ne peuvent pas être modifiées'
                        });
                        return;
                    }
                }
                // Mettre à jour les champs du tour
                Object.keys(updateData).forEach(key => {
                    if (key !== '_id') { // Ne pas modifier l'ID
                        tour[key] = updateData[key];
                    }
                });
                yield partenaire.save();
                res.status(200).json({
                    success: true,
                    message: 'Tour mis à jour avec succès',
                    tour: tour
                });
            }
            catch (error) {
                console.error('Erreur lors de la mise à jour du tour:', error);
                res.status(500).json({ error: 'Erreur lors de la mise à jour du tour' });
            }
        });
    }
    // Supprimer un tour du partenaire connecté
    deleteTour(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const tourId = req.params.tourId;
                if (!mongoose_1.Types.ObjectId.isValid(tourId)) {
                    res.status(400).json({ error: 'ID tour invalide' });
                    return;
                }
                const partenaire = yield this.getPartenaireFromToken(req, res);
                if (!partenaire)
                    return;
                // Trouver l'index du tour dans le tableau
                const tourIndex = partenaire.tours.findIndex((tour) => tour._id.toString() === tourId);
                if (tourIndex === -1) {
                    res.status(404).json({ error: 'Tour non trouvé' });
                    return;
                }
                // Vérifier si le tour a des réservations
                if (partenaire.tours[tourIndex].reservations && partenaire.tours[tourIndex].reservations.length > 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Impossible de supprimer un tour avec des réservations existantes'
                    });
                    return;
                }
                // Supprimer les images associées au tour
                if (partenaire.tours[tourIndex].images && partenaire.tours[tourIndex].images.length > 0) {
                    // Tenter de supprimer les fichiers physiques
                    partenaire.tours[tourIndex].images.forEach((imageUrl) => {
                        try {
                            // Extraire le nom de fichier de l'URL
                            const fileName = path_1.default.basename(imageUrl);
                            const filePath = path_1.default.join(uploadDir, fileName);
                            if (fs_1.default.existsSync(filePath)) {
                                fs_1.default.unlinkSync(filePath);
                            }
                        }
                        catch (fileError) {
                            console.error('Erreur lors de la suppression du fichier image:', fileError);
                            // Continuer même si la suppression du fichier échoue
                        }
                    });
                }
                // Supprimer le tour
                partenaire.tours.splice(tourIndex, 1);
                yield partenaire.save();
                res.status(200).json({
                    success: true,
                    message: 'Tour supprimé avec succès'
                });
            }
            catch (error) {
                console.error('Erreur lors de la suppression du tour:', error);
                res.status(500).json({ error: 'Erreur lors de la suppression du tour' });
            }
        });
    }
    // Récupérer un tour spécifique pour n'importe quel utilisateur (public)
    getTourById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const tourId = req.params.tourId;
                console.log(req.params);
                if (!mongoose_1.Types.ObjectId.isValid(tourId)) {
                    res.status(400).json({ error: 'ID tour invalide' });
                    return;
                }
                const partenaire = yield Partenaire_1.Partenaires.findOne({ 'tours._id': tourId }, 'inforamtion.inforegester.nom_entreprise tours.$');
                if (!partenaire) {
                    res.status(404).json({ error: 'Tour non trouvé' });
                    return;
                }
                const tour = partenaire.tours[0]; // Le premier (et seul) élément du sous-tableau filtré
                res.status(200).json({
                    success: true,
                    tour: Object.assign(Object.assign({}, JSON.parse(JSON.stringify(tour))), { partenaire: {
                            id: partenaire._id,
                            nom: partenaire.information.inforegester.nom_entreprise
                        } })
                });
            }
            catch (error) {
                console.log(error);
                console.error('Erreur lors de la récupération du tour:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération du tour' });
            }
        });
    }
    // Récupérer tous les tours (tous partenaires confondus)
    getAllTours(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                // Récupérer tous les partenaires avec leurs tours
                const partenaires = yield Partenaire_1.Partenaires.find({}, 'inforamtion.inforegester.nom_entreprise tours');
                for (const partenaire of partenaires) {
                    console.log(partenaire.tours);
                }
                // Construire un tableau avec tous les tours et le nom du partenaire associé
                const allTours = [];
                partenaires.forEach(partenaire => {
                    partenaire.tours.forEach((tour) => {
                        allTours.push({
                            _id: tour._id,
                            partenaireId: partenaire._id,
                            partenaireNom: partenaire.inforamtion.inforegester.nom_entreprise,
                            nom: tour.nom,
                            description: tour.description,
                            commission: tour.commission,
                            ville: tour.ville,
                            duree: tour.duree,
                            itineraire: tour.itineraire,
                            images: tour.images || [], // Inclure les images
                            jours: tour.jours.map((jour) => ({
                                _id: jour._id,
                                date: jour.date,
                                depart: jour.depart,
                                capacite: jour.capacite,
                                prix: jour.prix,
                                supplements: jour.supplements
                            }))
                        });
                    });
                });
                res.status(200).json({
                    success: true,
                    count: allTours.length,
                    tours: allTours
                });
            }
            catch (error) {
                console.error('Erreur lors de la récupération de tous les tours:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération de tous les tours' });
            }
        });
    }
    // Récupérer tous les tours par ville
    getToursByVille(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const { ville } = req.params;
                console.log(ville);
                // Recherche insensible à la casse
                const partenaires = yield Partenaire_1.Partenaires.find({ "tours.ville": { $regex: new RegExp(ville, "i") } }, 'inforamtion.inforegester.nom_entreprise tours');
                const toursFiltered = [];
                partenaires.forEach(partenaire => {
                    // Filtrer les tours correspondant à la ville
                    const filteredTours = partenaire.tours.filter((tour) => tour.ville.toLowerCase().includes(ville.toLowerCase()));
                    // Ajouter chaque tour avec les informations du partenaire
                    filteredTours.forEach((tour) => {
                        toursFiltered.push({
                            tourId: tour._id,
                            partenaireId: partenaire._id,
                            partenaireNom: partenaire.information.inforegester.nom_entreprise,
                            nom: tour.nom,
                            description: tour.description,
                            ville: tour.ville,
                            duree: tour.duree,
                            itineraire: tour.itineraire,
                            images: tour.images || [], // Inclure les images
                            jours: tour.jours
                        });
                    });
                });
                res.status(200).json({
                    success: true,
                    count: toursFiltered.length,
                    tours: toursFiltered
                });
            }
            catch (error) {
                console.error('Erreur lors de la recherche des tours par ville:', error);
                res.status(500).json({ error: 'Erreur lors de la recherche des tours par ville' });
            }
        });
    }
    // Télécharger une image pour un tour
    uploadTourImage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Utiliser multer comme middleware
            upload.single('image')(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    if (err instanceof multer_1.default.MulterError) {
                        // Erreur Multer
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            return res.status(400).json({
                                success: false,
                                message: 'La taille du fichier dépasse la limite (2MB)'
                            });
                        }
                        return res.status(400).json({
                            success: false,
                            message: `Erreur lors du téléchargement: ${err.message}`
                        });
                    }
                    else {
                        // Autre erreur
                        return res.status(400).json({
                            success: false,
                            message: err.message
                        });
                    }
                }
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'Aucune image n\'a été téléchargée'
                    });
                }
                try {
                    const tourId = req.params.tourId;
                    if (!mongoose_1.Types.ObjectId.isValid(tourId)) {
                        // Supprimer le fichier si l'ID est invalide
                        fs_1.default.unlinkSync(req.file.path);
                        return res.status(400).json({
                            success: false,
                            message: 'ID tour invalide'
                        });
                    }
                    if (!(yield this.checkDBConnection(res))) {
                        // Supprimer le fichier en cas d'erreur de connexion à la BD
                        fs_1.default.unlinkSync(req.file.path);
                        return;
                    }
                    const partenaire = yield this.getPartenaireFromToken(req, res);
                    if (!partenaire) {
                        // Supprimer le fichier si le partenaire n'est pas trouvé
                        fs_1.default.unlinkSync(req.file.path);
                        return;
                    }
                    const tour = partenaire.tours.id(tourId);
                    if (!tour) {
                        // Supprimer le fichier si le tour n'est pas trouvé
                        fs_1.default.unlinkSync(req.file.path);
                        return res.status(404).json({
                            success: false,
                            message: 'Tour non trouvé'
                        });
                    }
                    // Créer l'URL du fichier
                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                    const fileName = path_1.default.basename(req.file.path);
                    const imageUrl = `${baseUrl}/uploads/Tours_Photos/${fileName}`;
                    // Initialiser le tableau d'images s'il n'existe pas
                    if (!tour.images) {
                        tour.images = [];
                    }
                    // Limiter le nombre d'images à 5 par tour
                    if (tour.images.length >= 5) {
                        // Supprimer le fichier si la limite est atteinte
                        fs_1.default.unlinkSync(req.file.path);
                        return res.status(400).json({
                            success: false,
                            message: 'Nombre maximum d\'images atteint (5 images par tour)'
                        });
                    }
                    // Ajouter l'URL au tableau d'images
                    tour.images.push(imageUrl);
                    yield partenaire.save();
                    return res.status(200).json({
                        success: true,
                        message: 'Image téléchargée avec succès',
                        imageUrl: imageUrl
                    });
                }
                catch (error) {
                    console.error('Erreur lors du téléchargement de l\'image:', error);
                    // Supprimer le fichier en cas d'erreur
                    if (req.file) {
                        fs_1.default.unlinkSync(req.file.path);
                    }
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors du téléchargement de l\'image'
                    });
                }
            }));
        });
    }
    // Supprimer une image d'un tour
    deleteTourImage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const tourId = req.params.tourId;
                const imageUrl = req.query.imageUrl;
                if (!imageUrl) {
                    res.status(400).json({
                        success: false,
                        message: 'URL de l\'image manquante'
                    });
                    return;
                }
                if (!mongoose_1.Types.ObjectId.isValid(tourId)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID tour invalide'
                    });
                    return;
                }
                const partenaire = yield this.getPartenaireFromToken(req, res);
                if (!partenaire)
                    return;
                const tour = partenaire.tours.id(tourId);
                if (!tour) {
                    res.status(404).json({
                        success: false,
                        message: 'Tour non trouvé'
                    });
                    return;
                }
                // Vérifier si l'image existe dans le tableau
                if (!tour.images || !tour.images.includes(imageUrl)) {
                    res.status(404).json({
                        success: false,
                        message: 'Image non trouvée pour ce tour'
                    });
                    return;
                }
                // Supprimer l'image du tableau
                tour.images = tour.images.filter((img) => img !== imageUrl);
                yield partenaire.save();
                // Tenter de supprimer le fichier du serveur
                try {
                    // Extraire le nom de fichier de l'URL
                    const fileName = path_1.default.basename(imageUrl);
                    const filePath = path_1.default.join(uploadDir, fileName);
                    if (fs_1.default.existsSync(filePath)) {
                        fs_1.default.unlinkSync(filePath);
                    }
                }
                catch (fileError) {
                    console.error('Erreur lors de la suppression du fichier:', fileError);
                    // On continue même si la suppression du fichier échoue
                }
                res.status(200).json({
                    success: true,
                    message: 'Image supprimée avec succès'
                });
                return;
            }
            catch (error) {
                console.error('Erreur lors de la suppression de l\'image:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la suppression de l\'image'
                });
                return;
            }
        });
    }
    // Télécharger une image pour un tour directement sur S3
    uploadTourImageS3(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Configuration de multer pour la mémoire temporaire
            const s3Upload = (0, multer_1.default)({
                storage: multer_1.default.memoryStorage(),
                limits: {
                    fileSize: 2 * 1024 * 1024 // 2MB
                },
                fileFilter: fileFilter
            }).single('image');
            s3Upload(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    if (err instanceof multer_1.default.MulterError) {
                        // Erreur Multer
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            res.status(400).json({
                                success: false,
                                message: 'La taille du fichier dépasse la limite (2MB)'
                            });
                            return;
                        }
                        res.status(400).json({
                            success: false,
                            message: `Erreur lors du téléchargement: ${err.message}`
                        });
                        return;
                    }
                    else {
                        // Autre erreur
                        res.status(400).json({
                            success: false,
                            message: err.message
                        });
                        return;
                    }
                }
                if (!req.file) {
                    res.status(400).json({
                        success: false,
                        message: 'Aucune image n\'a été téléchargée'
                    });
                    return;
                }
                try {
                    const tourId = req.params.tourId;
                    if (!mongoose_1.Types.ObjectId.isValid(tourId)) {
                        res.status(400).json({
                            success: false,
                            message: 'ID tour invalide'
                        });
                        return;
                    }
                    if (!(yield this.checkDBConnection(res))) {
                        return;
                    }
                    const partenaire = yield this.getPartenaireFromToken(req, res);
                    if (!partenaire) {
                        return;
                    }
                    const tour = partenaire.tours.id(tourId);
                    if (!tour) {
                        res.status(404).json({
                            success: false,
                            message: 'Tour non trouvé'
                        });
                        return;
                    }
                    // Initialiser le tableau d'images s'il n'existe pas
                    if (!tour.images) {
                        tour.images = [];
                    }
                    // Limiter le nombre d'images à 5 par tour
                    if (tour.images.length >= 5) {
                        res.status(400).json({
                            success: false,
                            message: 'Nombre maximum d\'images atteint (5 images par tour)'
                        });
                        return;
                    }
                    // Télécharger l'image sur S3
                    try {
                        const fileName = `tour-image-${tourId}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path_1.default.extname(req.file.originalname)}`;
                        const destination = `tours/${partenaire._id}/images/${fileName}`;
                        const imageUrl = yield (0, Controllerpartenaire_1.uploadToS3)(req.file, destination);
                        // Ajouter l'URL au tableau d'images
                        tour.images.push(imageUrl);
                        yield partenaire.save();
                        res.status(200).json({
                            success: true,
                            message: 'Image téléchargée avec succès',
                            imageUrl: imageUrl
                        });
                    }
                    catch (s3Error) {
                        console.error('Erreur S3 lors du téléchargement de l\'image:', s3Error);
                        // Gestion spécifique des erreurs S3
                        if (s3Error.code === 'AccessDenied' || s3Error.statusCode === 403) {
                            res.status(403).json({
                                success: false,
                                message: 'Accès refusé à S3. Vérifiez les permissions IAM.',
                                error: s3Error.message
                            });
                        }
                        else if (s3Error.code === 'ThrottlingException') {
                            res.status(429).json({
                                success: false,
                                message: 'Trop de requêtes vers S3. Veuillez réessayer plus tard.',
                                error: s3Error.message
                            });
                        }
                        else {
                            res.status(500).json({
                                success: false,
                                message: 'Erreur lors du téléchargement vers S3',
                                error: s3Error.message
                            });
                        }
                        return;
                    }
                }
                catch (error) {
                    console.error('Erreur lors du téléchargement de l\'image:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Erreur lors du téléchargement de l\'image',
                        error: error.message
                    });
                }
            }));
        });
    }
    // Supprimer une image de S3 pour un tour
    deleteTourImageS3(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.checkDBConnection(res)))
                return;
            try {
                const tourId = req.params.tourId;
                const imageUrl = req.query.imageUrl;
                if (!imageUrl) {
                    res.status(400).json({
                        success: false,
                        message: 'URL de l\'image manquante'
                    });
                    return;
                }
                if (!mongoose_1.Types.ObjectId.isValid(tourId)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID tour invalide'
                    });
                    return;
                }
                const partenaire = yield this.getPartenaireFromToken(req, res);
                if (!partenaire)
                    return;
                const tour = partenaire.tours.id(tourId);
                if (!tour) {
                    res.status(404).json({
                        success: false,
                        message: 'Tour non trouvé'
                    });
                    return;
                }
                // Vérifier si l'image existe dans le tableau
                if (!tour.images || !tour.images.includes(imageUrl)) {
                    res.status(404).json({
                        success: false,
                        message: 'Image non trouvée pour ce tour'
                    });
                    return;
                }
                // Supprimer l'image du tableau
                tour.images = tour.images.filter((img) => img !== imageUrl);
                try {
                    // Extraction du chemin S3 depuis l'URL
                    // L'URL est généralement de la forme: https://bucket-name.s3.region.amazonaws.com/uploads/path/to/file
                    const urlParts = new URL(imageUrl);
                    const s3Path = urlParts.pathname.substring(1); // Enlever le slash initial
                    // Configurer l'objet S3 (normalement déjà disponible via l'import)
                    const s3 = new aws_sdk_1.default.S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION || 'eu-west-3'
                    });
                    // Extraire le nom du bucket à partir de l'URL
                    const bucketName = process.env.AWS_S3_BUCKET || 'lowxysas';
                    // Paramètres pour la suppression
                    const params = {
                        Bucket: bucketName,
                        Key: s3Path
                    };
                    // Supprimer l'objet de S3
                    yield s3.deleteObject(params).promise();
                    // Sauvegarder les modifications dans la base de données
                    yield partenaire.save();
                    res.status(200).json({
                        success: true,
                        message: 'Image supprimée avec succès de S3 et de la base de données'
                    });
                }
                catch (s3Error) {
                    console.error('Erreur lors de la suppression du fichier S3:', s3Error);
                    // On continue même si l'image n'a pas pu être supprimée de S3
                    // Sauvegarder les modifications dans la base de données pour supprimer au moins la référence
                    yield partenaire.save();
                    res.status(200).json({
                        success: true,
                        message: 'Image supprimée de la base de données, mais erreur lors de la suppression sur S3',
                        error: s3Error.message
                    });
                }
            }
            catch (error) {
                console.error('Erreur lors de la suppression de l\'image:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la suppression de l\'image',
                    error: error.message
                });
            }
        });
    }
}
exports.tourControllerInstance = new TourController();
