import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Chauffeurs } from '../models/Chauffeure';
import { dbConnection } from '../BDconnection/BDconnection';
import mongoose from 'mongoose';

class ChauffeurDocumentController {
    // Multer storage configuration
    private storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../uploads/chauffeurs');
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });

    // File filter to validate image uploads
    private fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            req.fileValidationError = 'Seuls les fichiers image sont autorisés!';
            return cb(null, false);
        }
        cb(null, true);
    };

    // Multer upload configuration
    private upload = multer({ 
        storage: this.storage,
        fileFilter: this.fileFilter,
        limits: { 
            fileSize: 5 * 1024 * 1024 // Limite de 5MB
        }
    });

    // Middleware pour vérifier la connexion à la base de données
    private async ensureDatabaseConnection(req: Request, res: Response, next: NextFunction) {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
        }
        next();
    }

    // Téléchargement de document
    uploadDocument = (documentType: 'permis' | 'assurance' | 'carte_taxi') => {
        return [
            this.ensureDatabaseConnection,
            this.upload.single(documentType),
            async (req: Request, res: Response) => {
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
                    const chauffeur = await Chauffeurs.findById(id);

                    if (!chauffeur) {
                        // Supprimer le fichier téléchargé si le chauffeur n'est pas trouvé
                        fs.unlinkSync(req.file.path);
                        return res.status(404).json({ error: 'Chauffeur non trouvé' });
                    }

                    // Supprimer le document précédent s'il existe
                    const previousDocPath = chauffeur.documents[documentType].imagePath;
                    if (previousDocPath && fs.existsSync(previousDocPath)) {
                        fs.unlinkSync(previousDocPath);
                    }

                    // Mettre à jour le chemin du document
                    chauffeur.documents[documentType].imagePath = req.file.path;
                    await chauffeur.save();

                    res.status(200).json({
                        message: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} téléchargé avec succès`,
                        filePath: req.file.path
                    });
                } catch (error) {
                    console.error(`Erreur lors du téléchargement de ${documentType}:`, error);
                    
                    // Supprimer le fichier téléchargé en cas d'erreur
                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }

                    res.status(500).json({ 
                        error: `Erreur lors du téléchargement de ${documentType}`
                    });
                }
            }
        ];
    }

    // Récupérer un document
    getDocument = async (req: Request, res: Response) => {
        try {
            const { id, docType } = req.params;
            const chauffeur = await Chauffeurs.findById(id);
    
            if (!chauffeur) {
                return res.status(404).json({ error: 'Chauffeur non trouvé' });
            }
    
            const documentPath = chauffeur.documents[docType as 'permis' | 'assurance' | 'carte_taxi'].imagePath;
    
            if (!documentPath) {
                return res.status(404).json({ error: 'Document non trouvé' });
            }
    
            // Read file as base64
            const fileBuffer = fs.readFileSync(documentPath);
            const base64Image = fileBuffer.toString('base64');
            
            // Determine MIME type
            const mimeType = path.extname(documentPath).replace('.', '');
            const fullBase64 = `data:image/${mimeType};base64,${base64Image}`;
    
            res.json({ 
                base64: fullBase64,
                originalName: path.basename(documentPath)
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du document:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération du document' });
        }
    }

    // Supprimer un document
    removeDocument = async (req: Request, res: Response) => {
        await this.ensureDatabaseConnection(req, res, async () => {
            try {
                const { id, docType } = req.params;
                const chauffeur = await Chauffeurs.findById(id);

                if (!chauffeur) {
                    return res.status(404).json({ error: 'Chauffeur non trouvé' });
                }

                const documentPath = chauffeur.documents[docType as 'permis' | 'assurance' | 'carte_taxi'].imagePath;

                // Supprimer le fichier du système de fichiers
                if (documentPath && fs.existsSync(documentPath)) {
                    fs.unlinkSync(documentPath);
                }

                // Effacer le chemin du document dans la base de données
                chauffeur.documents[docType as 'permis' | 'assurance' | 'carte_taxi'].imagePath = undefined;
                await chauffeur.save();

                res.status(200).json({ 
                    message: `${docType.charAt(0).toUpperCase() + docType.slice(1)} supprimé avec succès` 
                });
            } catch (error) {
                console.error('Erreur lors de la suppression du document:', error);
                res.status(500).json({ error: 'Erreur lors de la suppression du document' });
            }
        });
    }
}

export const chauffeurDocumentController = new ChauffeurDocumentController();