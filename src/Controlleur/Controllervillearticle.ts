import { Request, Response } from "express";
import { VilleArticle } from "../models/VilleArticle";
import { dbConnection } from "../BDconnection/BDconnection";
import mongoose from "mongoose";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";

// Configuration du stockage pour multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath = 'src/uploads/';
    
    // Créer des dossiers différents selon le type de fichier
    if (file.fieldname.startsWith('ville_photo_')) {
      uploadPath += 'ville/photos/';
    } else if (file.fieldname.startsWith('ville_video_')) {
      uploadPath += 'ville/videos/';
    } else if (file.fieldname.includes('_photo_principale')) {
      uploadPath += 'photos_principales/';
    } else if (file.fieldname.includes('_photo_galerie_')) {
      uploadPath += 'galerie_photos/';
    }
    
    // Créer le dossier s'il n'existe pas
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Créer le middleware multer
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB max
}).any();

class ControllerVilleArticle {
    async getVilleArticleByLocalitation(req: Request, res: Response): Promise<void> {
        const ville = req.params.ville;
        console.log("Recherche pour la ville:", ville);
        
        if(mongoose.connection.readyState !== 1){
            console.log('Connexion à la base de données requise');
            
            await dbConnection.getConnection().catch(error => {
                console.log('Erreur de connexion:', error);
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
    
        try {
            console.log('Exécution de la requête avec nom de ville:', ville);
            
            const villeResults = await VilleArticle.find({
                'ville.nom': ville
            });
            
            console.log('Nombre de résultats trouvés:', villeResults.length);
            
            if(villeResults.length === 0) {
                res.status(404).json({ message: 'Aucun article trouvé pour cette ville' });
                return;
            }
            console.log(villeResults);
            
            res.status(200).json(villeResults);
        } catch (error) {
            console.log("Erreur lors de la recherche:", error);
            res.status(500).json({ error: 'Erreur lors de la recherche de l\'article' });
        }
    }

    async getAllVilleArticles(req: Request, res: Response): Promise<void> {
        if(mongoose.connection.readyState !== 1){
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const articles = await VilleArticle.find();
            if (articles.length === 0) {
                res.status(404).json({ message: 'Aucun article trouvé' });
                return;
            }
            res.status(200).json(articles);
        } catch (error) {
            console.error('Erreur lors de la récupération des articles:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
        }
    }

    async getVilleArticleById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        if(mongoose.connection.readyState !== 1){
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const article = await VilleArticle.findById(id);
            if (!article) {
                res.status(404).json({ message: 'Article non trouvé' });
                return;
            }
            res.status(200).json(article);
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'article:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
        }
    }

    async updateVilleArticle(req: Request, res: Response): Promise<void> {
        upload(req, res, async (err) => {
            if (err) {
                console.error('Erreur lors de l\'upload des fichiers:', err);
                res.status(400).json({ error: 'Erreur lors de l\'upload des fichiers' });
                return;
            }
    
            if (mongoose.connection.readyState !== 1) {
                await dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
    
            try {
                const articleId = req.body.articleId;
                const articleData = JSON.parse(req.body.data);
    
                // Vérifier si l'article existe
                const existingArticle = await VilleArticle.findById(articleId);
                if (!existingArticle) {
                    res.status(404).json({ message: 'Article non trouvé' });
                    return;
                }
    
                // Traiter les fichiers uploadés
                const files = req.files as Express.Multer.File[];
                if (!files || files.length === 0) {
                    console.log('Aucun fichier trouvé, continuation avec les données textuelles uniquement');
                }
    
                // Initialiser les structures pour stocker les chemins des fichiers
                const medias = {
                    photos: [] as string[],
                    videos: [] as string[]
                };
    
                // Traitement des photos et vidéos principales de la ville
                if (files && files.length > 0) {
                    files.forEach(file => {
                        const filename = file.filename;
                        const filePath = file.path.replace(/\\/g, '/'); // Normaliser les chemins
    
                        if (file.fieldname.startsWith('ville_photo_')) {
                            medias.photos.push(filePath);
                        } else if (file.fieldname.startsWith('ville_video_')) {
                            medias.videos.push(filePath);
                        }
                    });
    
                    // Ajout des chemins de médias à l'objet articleData
                    articleData.medias = medias;
    
                    // Traitement des photos des lieux touristiques
                    if (articleData.contenu && articleData.contenu.lieux_touristiques) {
                        articleData.contenu.lieux_touristiques = articleData.contenu.lieux_touristiques.map((lieu: any, index: number) => {
                            lieu.photo = {
                                photo_principale: existingArticle.contenu?.lieux_touristiques?.[index]?.photo?.photo_principale || null,
                                galerie_photos: [...(existingArticle.contenu?.lieux_touristiques?.[index]?.photo?.galerie_photos || [])]
                            };
    
                            // Rechercher la photo principale
                            const photoFile = files.find(file => file.fieldname === `lieu_${index}_photo_principale`);
                            if (photoFile) {
                                lieu.photo.photo_principale = photoFile.path.replace(/\\/g, '/');
                            }
    
                            // Rechercher les photos de galerie
                            files.filter(file => file.fieldname.startsWith(`lieu_${index}_photo_galerie_`))
                                .forEach(file => {
                                    lieu.photo.galerie_photos.push(file.path.replace(/\\/g, '/'));
                                });
    
                            return lieu;
                        });
                    }
    
                    // Traitement des photos de gastronomie
                    if (articleData.contenu && articleData.contenu.gastronomie) {
                        articleData.contenu.gastronomie = articleData.contenu.gastronomie.map((plat: any, index: number) => {
                            plat.photo = {
                                photo_principale: existingArticle.contenu?.gastronomie?.[index]?.photo?.photo_principale || null,
                                galerie_photos: [...(existingArticle.contenu?.gastronomie?.[index]?.photo?.galerie_photos || [])]
                            };
    
                            // Rechercher la photo principale
                            const photoFile = files.find(file => file.fieldname === `gastro_${index}_photo_principale`);
                            if (photoFile) {
                                plat.photo.photo_principale = photoFile.path.replace(/\\/g, '/');
                            }
    
                            // Rechercher les photos de galerie
                            files.filter(file => file.fieldname.startsWith(`gastro_${index}_photo_galerie_`))
                                .forEach(file => {
                                    plat.photo.galerie_photos.push(file.path.replace(/\\/g, '/'));
                                });
    
                            return plat;
                        });
                    }
    
                    // Traitement similaire pour les hôtels
                    if (articleData.informations_pratiques && articleData.informations_pratiques.hotels_recommandes) {
                        articleData.informations_pratiques.hotels_recommandes = articleData.informations_pratiques.hotels_recommandes.map((hotel: any, index: number) => {
                            hotel.photos = {
                                photo_principale: existingArticle.informations_pratiques?.hotels_recommandes?.[index]?.photos?.photo_principale || null,
                                galerie_photos: [...(existingArticle.informations_pratiques?.hotels_recommandes?.[index]?.photos?.galerie_photos || [])]
                            };
    
                            const photoFile = files.find(file => file.fieldname === `hotel_${index}_photo_principale`);
                            if (photoFile) {
                                hotel.photos.photo_principale = photoFile.path.replace(/\\/g, '/');
                            }
    
                            files.filter(file => file.fieldname.startsWith(`hotel_${index}_photo_galerie_`))
                                .forEach(file => {
                                    hotel.photos.galerie_photos.push(file.path.replace(/\\/g, '/'));
                                });
    
                            return hotel;
                        });
                    }
    
                    // Traitement similaire pour les restaurants
                    if (articleData.informations_pratiques && articleData.informations_pratiques.restaurants_recommandes) {
                        articleData.informations_pratiques.restaurants_recommandes = articleData.informations_pratiques.restaurants_recommandes.map((restaurant: any, index: number) => {
                            restaurant.photos = {
                                photo_principale: existingArticle.informations_pratiques?.restaurants_recommandes?.[index]?.photos?.photo_principale || null,
                                galerie_photos: [...(existingArticle.informations_pratiques?.restaurants_recommandes?.[index]?.photos?.galerie_photos || [])]
                            };
    
                            const photoFile = files.find(file => file.fieldname === `restaurant_${index}_photo_principale`);
                            if (photoFile) {
                                restaurant.photos.photo_principale = photoFile.path.replace(/\\/g, '/');
                            }
    
                            files.filter(file => file.fieldname.startsWith(`restaurant_${index}_photo_galerie_`))
                                .forEach(file => {
                                    restaurant.photos.galerie_photos.push(file.path.replace(/\\/g, '/'));
                                });
    
                            return restaurant;
                        });
                    }
                }
    
                // Mettre à jour les métadonnées
                articleData.meta = {
                    ...existingArticle.meta,
                    derniere_mise_a_jour: new Date()
                };
    
                // Mettre à jour l'article dans la base de données
                const updatedArticle = await VilleArticle.findByIdAndUpdate(
                    articleId,
                    articleData,
                    { new: true, runValidators: true }
                );
    
                res.status(200).json({
                    success: true,
                    message: 'Article mis à jour avec succès',
                    article: updatedArticle
                });
    
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'article:', error);
                res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
            }
        });
    }
    async createVilleArticle(req: Request, res: Response): Promise<void> {
        // Utiliser multer pour gérer les fichiers
        upload(req, res, async (err) => {
            if (err) {
                console.error('Erreur lors de l\'upload des fichiers:', err);
                res.status(400).json({ error: 'Erreur lors de l\'upload des fichiers' });
                return;
            }

            if(mongoose.connection.readyState !== 1){
                await dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }

            try {
                // Récupérer les données JSON
                const articleData = JSON.parse(req.body.data);
                
                // Traiter les fichiers uploadés
                const files = req.files as Express.Multer.File[];
                if (!files || files.length === 0) {
                    console.log('Aucun fichier trouvé, continuation avec les données textuelles uniquement');
                }
                
                // Initialiser les structures pour stocker les chemins des fichiers
                const medias = {
                    photos: [] as string[],
                    videos: [] as string[]
                };
                
                // Traitement des photos et vidéos principales de la ville
                if (files && files.length > 0) {
                    files.forEach(file => {
                        const filename = file.filename;
                        const filePath = file.path.replace(/\\/g, '/'); // Normaliser les chemins
                        
                        if (file.fieldname.startsWith('ville_photo_')) {
                            medias.photos.push(filePath);
                        } else if (file.fieldname.startsWith('ville_video_')) {
                            medias.videos.push(filePath);
                        }
                    });
                    
                    // Ajout des chemins de médias à l'objet articleData
                    articleData.medias = medias;
                    
                    // Traitement des photos des lieux touristiques
                    if (articleData.contenu && articleData.contenu.lieux_touristiques) {
                        articleData.contenu.lieux_touristiques = articleData.contenu.lieux_touristiques.map((lieu: any, index: number) => {
                            lieu.photo = {
                                photo_principale: null,
                                galerie_photos: []
                            };
                            
                            // Rechercher la photo principale
                            const photoFile = files.find(file => file.fieldname === `lieu_${index}_photo_principale`);
                            if (photoFile) {
                                lieu.photo.photo_principale = photoFile.path.replace(/\\/g, '/');
                            }
                            
                            // Rechercher les photos de galerie
                            files.filter(file => file.fieldname.startsWith(`lieu_${index}_photo_galerie_`))
                                .forEach(file => {
                                    lieu.photo.galerie_photos.push(file.path.replace(/\\/g, '/'));
                                });
                            
                            return lieu;
                        });
                    }
                    
                    // Traitement des photos de gastronomie
                    if (articleData.contenu && articleData.contenu.gastronomie) {
                        articleData.contenu.gastronomie = articleData.contenu.gastronomie.map((plat: any, index: number) => {
                            plat.photo = {
                                photo_principale: null,
                                galerie_photos: []
                            };
                            
                            // Rechercher la photo principale
                            const photoFile = files.find(file => file.fieldname === `gastro_${index}_photo_principale`);
                            if (photoFile) {
                                plat.photo.photo_principale = photoFile.path.replace(/\\/g, '/');
                            }
                            
                            // Rechercher les photos de galerie
                            files.filter(file => file.fieldname.startsWith(`gastro_${index}_photo_galerie_`))
                                .forEach(file => {
                                    plat.photo.galerie_photos.push(file.path.replace(/\\/g, '/'));
                                });
                            
                            return plat;
                        });
                    }
                    
                    // Traitement similaire pour les hôtels
                    if (articleData.informations_pratiques && articleData.informations_pratiques.hotels_recommandes) {
                        articleData.informations_pratiques.hotels_recommandes = articleData.informations_pratiques.hotels_recommandes.map((hotel: any, index: number) => {
                            hotel.photos = {
                                photo_principale: null,
                                galerie_photos: []
                            };
                            
                            const photoFile = files.find(file => file.fieldname === `hotel_${index}_photo_principale`);
                            if (photoFile) {
                                hotel.photos.photo_principale = photoFile.path.replace(/\\/g, '/');
                            }
                            
                            files.filter(file => file.fieldname.startsWith(`hotel_${index}_photo_galerie_`))
                                .forEach(file => {
                                    hotel.photos.galerie_photos.push(file.path.replace(/\\/g, '/'));
                                });
                            
                            return hotel;
                        });
                    }
                    
                    // Traitement similaire pour les restaurants
                    if (articleData.informations_pratiques && articleData.informations_pratiques.restaurants_recommandes) {
                        articleData.informations_pratiques.restaurants_recommandes = articleData.informations_pratiques.restaurants_recommandes.map((restaurant: any, index: number) => {
                            restaurant.photos = {
                                photo_principale: null,
                                galerie_photos: []
                            };
                            
                            const photoFile = files.find(file => file.fieldname === `restaurant_${index}_photo_principale`);
                            if (photoFile) {
                                restaurant.photos.photo_principale = photoFile.path.replace(/\\/g, '/');
                            }
                            
                            files.filter(file => file.fieldname.startsWith(`restaurant_${index}_photo_galerie_`))
                                .forEach(file => {
                                    restaurant.photos.galerie_photos.push(file.path.replace(/\\/g, '/'));
                                });
                            
                            return restaurant;
                        });
                    }
                }
                
                // Ajouter les métadonnées
                articleData.meta = {
                    nombre_vues: 0,
                    derniere_mise_a_jour: new Date()
                };
                
                // Sauvegarder dans la base de données
                const newArticle = new VilleArticle(articleData);
                const savedArticle = await newArticle.save();
                
                res.status(201).json({
                    success: true,
                    message: 'Article créé avec succès',
                    article: savedArticle
                });
            } catch (error) {
                console.error('Erreur lors de la création de l\'article:', error);
                res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
            }
        });
    }
    
    async deleteVilleArticle(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        if(mongoose.connection.readyState !== 1){
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const article = await VilleArticle.findByIdAndDelete(id);
            if (!article) {
                res.status(404).json({ message: 'Article non trouvé' });
                return;
            }
            res.status(200).json({ message: 'Article supprimé avec succès' });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'article:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
        }
    }
}

export const controllerVilleArticleInstance = new ControllerVilleArticle();