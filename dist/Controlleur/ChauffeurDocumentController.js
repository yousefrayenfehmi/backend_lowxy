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
exports.chauffeurDocumentController = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Chauffeure_1 = require("../models/Chauffeure");
const BDconnection_1 = require("../BDconnection/BDconnection");
const mongoose_1 = __importDefault(require("mongoose"));
class ChauffeurDocumentController {
    constructor() {
        // Multer storage configuration
        this.storage = multer_1.default.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = path_1.default.join(__dirname, '../uploads/chauffeurs');
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
            }
        });
        // File filter to validate image uploads
        this.fileFilter = (req, file, cb) => {
            // Accept images only
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                req.fileValidationError = 'Seuls les fichiers image sont autorisés!';
                return cb(null, false);
            }
            cb(null, true);
        };
        // Multer upload configuration
        this.upload = (0, multer_1.default)({
            storage: this.storage,
            fileFilter: this.fileFilter,
            limits: {
                fileSize: 5 * 1024 * 1024 // Limite de 5MB
            }
        });
        // Téléchargement de document
        this.uploadDocument = (documentType) => {
            return [
                this.ensureDatabaseConnection,
                this.upload.single(documentType),
                (req, res) => __awaiter(this, void 0, void 0, function* () {
                    // Gérer les erreurs de multer
                    if (req.fileValidationError) {
                        return res.status(400).json({ message: req.fileValidationError });
                    }
                    // Vérifier si un fichier a été téléchargé
                    if (!req.file) {
                        return res.status(400).json({ message: 'Aucun fichier téléchargé' });
                    }
                    try {
                        const { id } = req.params;
                        const chauffeur = yield Chauffeure_1.Chauffeurs.findById(id);
                        if (!chauffeur) {
                            // Supprimer le fichier téléchargé si le chauffeur n'est pas trouvé
                            fs_1.default.unlinkSync(req.file.path);
                            return res.status(404).json({ error: 'Chauffeur non trouvé' });
                        }
                        // Supprimer le document précédent s'il existe
                        const previousDocPath = chauffeur.documents[documentType].imagePath;
                        if (previousDocPath && fs_1.default.existsSync(previousDocPath)) {
                            fs_1.default.unlinkSync(previousDocPath);
                        }
                        // Mettre à jour le chemin du document
                        chauffeur.documents[documentType].imagePath = req.file.path;
                        yield chauffeur.save();
                        res.status(200).json({
                            message: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} téléchargé avec succès`,
                            filePath: req.file.path
                        });
                    }
                    catch (error) {
                        console.error(`Erreur lors du téléchargement de ${documentType}:`, error);
                        // Supprimer le fichier téléchargé en cas d'erreur
                        if (req.file) {
                            fs_1.default.unlinkSync(req.file.path);
                        }
                        res.status(500).json({
                            error: `Erreur lors du téléchargement de ${documentType}`
                        });
                    }
                })
            ];
        };
        // Récupérer un document
        this.getDocument = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, docType } = req.params;
                const chauffeur = yield Chauffeure_1.Chauffeurs.findById(id);
                if (!chauffeur) {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
                const documentPath = chauffeur.documents[docType].imagePath;
                if (!documentPath) {
                    res.status(404).json({ error: 'Document non trouvé' });
                    return;
                }
                // Read file as base64
                const fileBuffer = fs_1.default.readFileSync(documentPath);
                const base64Image = fileBuffer.toString('base64');
                // Determine MIME type
                const mimeType = path_1.default.extname(documentPath).replace('.', '');
                const fullBase64 = `data:image/${mimeType};base64,${base64Image}`;
                res.json({
                    base64: fullBase64,
                    originalName: path_1.default.basename(documentPath)
                });
            }
            catch (error) {
                console.error('Erreur lors de la récupération du document:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération du document' });
            }
        });
        // Supprimer un document
        this.removeDocument = (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDatabaseConnection(req, res, () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { id, docType } = req.params;
                    const chauffeur = yield Chauffeure_1.Chauffeurs.findById(id);
                    if (!chauffeur) {
                        res.status(404).json({ error: 'Chauffeur non trouvé' });
                        return;
                    }
                    const documentPath = chauffeur.documents[docType].imagePath;
                    // Supprimer le fichier du système de fichiers
                    if (documentPath && fs_1.default.existsSync(documentPath)) {
                        fs_1.default.unlinkSync(documentPath);
                    }
                    // Effacer le chemin du document dans la base de données
                    chauffeur.documents[docType].imagePath = undefined;
                    yield chauffeur.save();
                    res.status(200).json({
                        message: `${docType.charAt(0).toUpperCase() + docType.slice(1)} supprimé avec succès`
                    });
                }
                catch (error) {
                    console.error('Erreur lors de la suppression du document:', error);
                    res.status(500).json({ error: 'Erreur lors de la suppression du document' });
                    return;
                }
            }));
        });
    }
    // Middleware pour vérifier la connexion à la base de données
    ensureDatabaseConnection(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                }
            }
            next();
        });
    }
}
exports.chauffeurDocumentController = new ChauffeurDocumentController();
