import { Request, Response } from "express";
import { VilleArticle } from "../models/VilleArticle";
import { dbConnection } from "../BDconnection/BDconnection";
import mongoose from "mongoose";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { uploadToS3 } from "./Controllerpartenaire";
import { Admin } from "../models/Admin";
// Configuration pour S3
const s3Config = {
  region: process.env.AWS_REGION || 'eu-west-3',
  bucketName: process.env.AWS_S3_BUCKET || 'lowxysas'
};

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

// Configuration pour le stockage en mémoire (pour S3)
const memoryStorage = multer.memoryStorage();

// Créer le middleware multer pour stockage local
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 50 MB max
}).any();

// Créer le middleware multer pour S3
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 50 MB max
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
                console.log('📊 Données article reçues:', articleData);
                
                // Vérifier si l'article existe
                const existingArticle = await VilleArticle.findById(articleId);
                if (!existingArticle) {
                    res.status(404).json({ message: 'Article non trouvé' });
                    return;
                }
    
                // Traiter les fichiers uploadés
                const files = req.files as Express.Multer.File[];
                console.log('📁 Fichiers reçus:', files?.length || 0);
    
                // 🔥 GESTION DES MÉDIAS PRINCIPAUX DE LA VILLE
                console.log('📊 Médias existants reçus:', articleData.medias);
    
                // Récupérer les médias existants depuis les données du frontend
                const existingMedias = articleData.medias || { photos: [], videos: [] };
    
                // Initialiser avec les médias existants (ne pas écraser !)
                const medias = {
                    photos: [...(existingMedias.photos || [])] as string[],
                    videos: [...(existingMedias.videos || [])] as string[]
                };
    
                console.log('📷 Photos existantes à préserver:', medias.photos);
                console.log('🎥 Vidéos existantes à préserver:', medias.videos);
    
                // Traitement des nouveaux fichiers
                if (files && files.length > 0) {
                    console.log('📁 Traitement des nouveaux fichiers...');
                    
                    for (const file of files) {
                        console.log('🔄 Traitement du fichier:', file.fieldname);
                        
                        const filePath = file.path.replace(/\\/g, '/');
                        
                        if (file.fieldname.startsWith('ville_photo_')) {
                            console.log('📷 Ajout nouvelle photo de ville');
                            const fileUrl = await uploadToS3(file, filePath);
                            medias.photos.push(fileUrl); // AJOUTER à la liste existante
                            
                        } else if (file.fieldname.startsWith('ville_video_')) {
                            console.log('🎥 Ajout nouvelle vidéo de ville');
                            const fileUrl = await uploadToS3(file, filePath);
                            medias.videos.push(fileUrl); // AJOUTER à la liste existante
                        }
                    }
    
                    // Traitement des médias à supprimer
                    if (req.body.mediaToDelete) {
                        console.log('🗑️ Traitement des suppressions...');
                        const mediaToDelete = JSON.parse(req.body.mediaToDelete);
                        
                        mediaToDelete.forEach((mediaItem: any) => {
                            console.log('🗑️ Suppression:', mediaItem);
                            if (mediaItem.type === 'ville_photo') {
                                medias.photos = medias.photos.filter(photo => photo !== mediaItem.path);
                            } else if (mediaItem.type === 'ville_video') {
                                medias.videos = medias.videos.filter(video => video !== mediaItem.path);
                            }
                        });
                    }
    
                    console.log('✅ Médias finaux de la ville:', medias);
    
                    // Mettre à jour les médias dans articleData
                    const admin = await Admin.findById(req.user);
                    articleData.crèepar = admin?.nom_complet;
                    articleData.medias = medias;
    
                    // 🔥 TRAITEMENT DES LIEUX TOURISTIQUES
                    if (articleData.contenu && articleData.contenu.lieux_touristiques) {
                        const newLieux = [];
                        for (let index = 0; index < articleData.contenu.lieux_touristiques.length; index++) {
                            const lieu = articleData.contenu.lieux_touristiques[index];
                            
                            // PRÉSERVER les photos existantes
                            const existingPhoto = lieu.photo || { photo_principale: null, galerie_photos: [] };
                            lieu.photo = {
                                photo_principale: existingPhoto.photo_principale,
                                galerie_photos: [...(existingPhoto.galerie_photos || [])]
                            };
                            
                            console.log(`📷 Lieu ${index} - Photos existantes:`, lieu.photo);
                            
                            // Traiter la nouvelle photo principale
                            const photoFile = files.find(file => file.fieldname === `lieu_${index}_photo_principale`);
                            if (photoFile) {
                                console.log(`📷 Upload nouvelle photo principale lieu ${index}`);
                                const fileUrl = await uploadToS3(photoFile, photoFile.path.replace(/\\/g, '/'));
                                lieu.photo.photo_principale = fileUrl;
                            }
                            
                            // Traiter les nouvelles photos de galerie
                            const galerieFiles = files.filter(file => file.fieldname.startsWith(`lieu_${index}_photo_galerie_`));
                            for (const file of galerieFiles) {
                                console.log(`🖼️ Upload nouvelle photo galerie lieu ${index}`);
                                const fileUrl = await uploadToS3(file, file.path.replace(/\\/g, '/'));
                                lieu.photo.galerie_photos.push(fileUrl);
                            }
                            
                            console.log(`✅ Lieu ${index} - Photos finales:`, lieu.photo);
                            newLieux.push(lieu);
                        }
                        articleData.contenu.lieux_touristiques = newLieux;
                    }
    
                    // 🔥 TRAITEMENT DE LA GASTRONOMIE
                    if (articleData.contenu && articleData.contenu.gastronomie) {
                        const newGastro = [];
                        for (let index = 0; index < articleData.contenu.gastronomie.length; index++) {
                            const plat = articleData.contenu.gastronomie[index];
                            
                            // PRÉSERVER les photos existantes
                            const existingPhoto = plat.photo || { photo_principale: null, galerie_photos: [] };
                            plat.photo = {
                                photo_principale: existingPhoto.photo_principale,
                                galerie_photos: [...(existingPhoto.galerie_photos || [])]
                            };
                            
                            console.log(`🍽️ Gastro ${index} - Photos existantes:`, plat.photo);
                            
                            // Traiter la nouvelle photo principale
                            const photoFile = files.find(file => file.fieldname === `gastro_${index}_photo_principale`);
                            if (photoFile) {
                                console.log(`📷 Upload nouvelle photo principale gastro ${index}`);
                                const fileUrl = await uploadToS3(photoFile, photoFile.path.replace(/\\/g, '/'));
                                plat.photo.photo_principale = fileUrl;
                            }
                            
                            // Traiter les nouvelles photos de galerie
                            const galerieFiles = files.filter(file => file.fieldname.startsWith(`gastro_${index}_photo_galerie_`));
                            for (const file of galerieFiles) {
                                console.log(`🖼️ Upload nouvelle photo galerie gastro ${index}`);
                                const fileUrl = await uploadToS3(file, file.path.replace(/\\/g, '/'));
                                plat.photo.galerie_photos.push(fileUrl);
                            }
                            
                            console.log(`✅ Gastro ${index} - Photos finales:`, plat.photo);
                            newGastro.push(plat);
                        }
                        articleData.contenu.gastronomie = newGastro;
                    }
    
                    // 🔥 TRAITEMENT DES HÔTELS
                    if (articleData.informations_pratiques && articleData.informations_pratiques.hotels_recommandes) {
                        const newHotels = [];
                        for (let index = 0; index < articleData.informations_pratiques.hotels_recommandes.length; index++) {
                            const hotel = articleData.informations_pratiques.hotels_recommandes[index];
                            
                            // PRÉSERVER les photos existantes
                            const existingPhotos = hotel.photos || { photo_principale: null, galerie_photos: [] };
                            hotel.photos = {
                                photo_principale: existingPhotos.photo_principale,
                                galerie_photos: [...(existingPhotos.galerie_photos || [])]
                            };
                            
                            console.log(`🏨 Hôtel ${index} - Photos existantes:`, hotel.photos);
                            
                            // Traiter la nouvelle photo principale
                            const photoFile = files.find(file => file.fieldname === `hotel_${index}_photo_principale`);
                            if (photoFile) {
                                console.log(`📷 Upload nouvelle photo principale hôtel ${index}`);
                                const fileUrl = await uploadToS3(photoFile, photoFile.path.replace(/\\/g, '/'));
                                hotel.photos.photo_principale = fileUrl;
                            }
                            
                            // Traiter les nouvelles photos de galerie
                            const galerieFiles = files.filter(file => file.fieldname.startsWith(`hotel_${index}_photo_galerie_`));
                            for (const file of galerieFiles) {
                                console.log(`🖼️ Upload nouvelle photo galerie hôtel ${index}`);
                                const fileUrl = await uploadToS3(file, file.path.replace(/\\/g, '/'));
                                hotel.photos.galerie_photos.push(fileUrl);
                            }
                            
                            console.log(`✅ Hôtel ${index} - Photos finales:`, hotel.photos);
                            newHotels.push(hotel);
                        }
                        articleData.informations_pratiques.hotels_recommandes = newHotels;
                    }
                    
                    // 🔥 TRAITEMENT DES RESTAURANTS
                    if (articleData.informations_pratiques && articleData.informations_pratiques.restaurants_recommandes) {
                        const newRestaurants = [];
                        for (let index = 0; index < articleData.informations_pratiques.restaurants_recommandes.length; index++) {
                            const restaurant = articleData.informations_pratiques.restaurants_recommandes[index];
                            
                            // PRÉSERVER les photos existantes
                            const existingPhotos = restaurant.photos || { photo_principale: null, galerie_photos: [] };
                            restaurant.photos = {
                                photo_principale: existingPhotos.photo_principale,
                                galerie_photos: [...(existingPhotos.galerie_photos || [])]
                            };
                            
                            console.log(`🍽️ Restaurant ${index} - Photos existantes:`, restaurant.photos);
                            
                            // Traiter la nouvelle photo principale
                            const photoFile = files.find(file => file.fieldname === `restaurant_${index}_photo_principale`);
                            if (photoFile) {
                                console.log(`📷 Upload nouvelle photo principale restaurant ${index}`);
                                const fileUrl = await uploadToS3(photoFile, photoFile.path.replace(/\\/g, '/'));
                                restaurant.photos.photo_principale = fileUrl;
                            }
                            
                            // Traiter les nouvelles photos de galerie
                            const galerieFiles = files.filter(file => file.fieldname.startsWith(`restaurant_${index}_photo_galerie_`));
                            for (const file of galerieFiles) {
                                console.log(`🖼️ Upload nouvelle photo galerie restaurant ${index}`);
                                const fileUrl = await uploadToS3(file, file.path.replace(/\\/g, '/'));
                                restaurant.photos.galerie_photos.push(fileUrl);
                            }
                            
                            console.log(`✅ Restaurant ${index} - Photos finales:`, restaurant.photos);
                            newRestaurants.push(restaurant);
                        }
                        articleData.informations_pratiques.restaurants_recommandes = newRestaurants;
                    }
                } else {
                    // Pas de nouveaux fichiers, mais garder les médias existants
                    console.log('📄 Aucun nouveau fichier, conservation des médias existants');
                    articleData.medias = medias;
                    
                    const admin = await Admin.findById(req.user);
                    articleData.crèepar = admin?.nom_complet;
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
    
                const admin = await Admin.findById(req.user);
                console.log('👤 Admin:', admin);
                
                if (updatedArticle) {
                    updatedArticle.crèepar = admin?.nom_complet || 'Admin inconnu';
                    await updatedArticle.save();
                }
                
                console.log('✅ Article mis à jour:', updatedArticle);
    
                res.status(200).json({
                    success: true,
                    message: 'Article mis à jour avec succès',
                    article: updatedArticle
                });
    
            } catch (error) {
                console.log('❌ Erreur:', error);
                console.error('Erreur lors de la mise à jour de l\'article:', error);
                res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
            }
        });
    }

    async createVilleArticle(req: Request, res: Response): Promise<void> {
        // Utiliser multer pour gérer les fichiers en mémoire (pour S3)
        uploadMemory(req, res, async (err) => {
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
                    for (const file of files) {
                        if (file.fieldname.startsWith('ville_photo_')) {
                            const destination = `ville-articles/${articleData.ville.nom}/photos/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                            const fileUrl = await uploadToS3(file, destination);
                            medias.photos.push(fileUrl);
                        } else if (file.fieldname.startsWith('ville_video_')) {
                            const destination = `ville-articles/${articleData.ville.nom}/videos/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                            const fileUrl = await uploadToS3(file, destination);
                            medias.videos.push(fileUrl);
                        }
                    }
                    // Ajout des chemins de médias à l'objet articleData
                    articleData.medias = medias;

                    // Traitement des photos des lieux touristiques
                    if (articleData.contenu && articleData.contenu.lieux_touristiques) {
                        const newLieux = [];
                        for (let index = 0; index < articleData.contenu.lieux_touristiques.length; index++) {
                            const lieu = articleData.contenu.lieux_touristiques[index];
                            lieu.photo = { photo_principale: null, galerie_photos: [] };
                            const photoFile = files.find(file => file.fieldname === `lieu_${index}_photo_principale`);
                            if (photoFile) {
                                const destination = `ville-articles/${articleData.ville.nom}/lieux/principale/${photoFile.fieldname}-${Date.now()}${path.extname(photoFile.originalname)}`;
                                const fileUrl = await uploadToS3(photoFile, destination);
                                lieu.photo.photo_principale = fileUrl;
                            }
                            for (const file of files.filter(file => file.fieldname.startsWith(`lieu_${index}_photo_galerie_`))) {
                                const destination = `ville-articles/${articleData.ville.nom}/lieux/galerie/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                                const fileUrl = await uploadToS3(file, destination);
                                lieu.photo.galerie_photos.push(fileUrl);
                            }
                            newLieux.push(lieu);
                        }
                        articleData.contenu.lieux_touristiques = newLieux;
                    }

                    // Traitement des photos de gastronomie
                    if (articleData.contenu && articleData.contenu.gastronomie) {
                        const newGastro = [];
                        for (let index = 0; index < articleData.contenu.gastronomie.length; index++) {
                            const plat = articleData.contenu.gastronomie[index];
                            plat.photo = { photo_principale: null, galerie_photos: [] };
                            const photoFile = files.find(file => file.fieldname === `gastro_${index}_photo_principale`);
                            if (photoFile) {
                                const destination = `ville-articles/${articleData.ville.nom}/gastronomie/principale/${photoFile.fieldname}-${Date.now()}${path.extname(photoFile.originalname)}`;
                                const fileUrl = await uploadToS3(photoFile, destination);
                                plat.photo.photo_principale = fileUrl;
                            }
                            for (const file of files.filter(file => file.fieldname.startsWith(`gastro_${index}_photo_galerie_`))) {
                                const destination = `ville-articles/${articleData.ville.nom}/gastronomie/galerie/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                                const fileUrl = await uploadToS3(file, destination);
                                plat.photo.galerie_photos.push(fileUrl);
                            }
                            newGastro.push(plat);
                        }
                        articleData.contenu.gastronomie = newGastro;
                    }

                    // Traitement similaire pour les hôtels
                    if (articleData.informations_pratiques && articleData.informations_pratiques.hotels_recommandes) {
                        const newHotels = [];
                        for (let index = 0; index < articleData.informations_pratiques.hotels_recommandes.length; index++) {
                            const hotel = articleData.informations_pratiques.hotels_recommandes[index];
                            hotel.photos = { photo_principale: null, galerie_photos: [] };
                            const photoFile = files.find(file => file.fieldname === `hotel_${index}_photo_principale`);
                            if (photoFile) {
                                const destination = `ville-articles/${articleData.ville.nom}/hotels/principale/${photoFile.fieldname}-${Date.now()}${path.extname(photoFile.originalname)}`;
                                const fileUrl = await uploadToS3(photoFile, destination);
                                hotel.photos.photo_principale = fileUrl;
                            }
                            for (const file of files.filter(file => file.fieldname.startsWith(`hotel_${index}_photo_galerie_`))) {
                                const destination = `ville-articles/${articleData.ville.nom}/hotels/galerie/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                                const fileUrl = await uploadToS3(file, destination);
                                hotel.photos.galerie_photos.push(fileUrl);
                            }
                            newHotels.push(hotel);
                        }
                        articleData.informations_pratiques.hotels_recommandes = newHotels;
                    }

                    // Traitement similaire pour les restaurants
                    if (articleData.informations_pratiques && articleData.informations_pratiques.restaurants_recommandes) {
                        const newRestaurants = [];
                        for (let index = 0; index < articleData.informations_pratiques.restaurants_recommandes.length; index++) {
                            const restaurant = articleData.informations_pratiques.restaurants_recommandes[index];
                            restaurant.photos = { photo_principale: null, galerie_photos: [] };
                            const photoFile = files.find(file => file.fieldname === `restaurant_${index}_photo_principale`);
                            if (photoFile) {
                                const destination = `ville-articles/${articleData.ville.nom}/restaurants/principale/${photoFile.fieldname}-${Date.now()}${path.extname(photoFile.originalname)}`;
                                const fileUrl = await uploadToS3(photoFile, destination);
                                restaurant.photos.photo_principale = fileUrl;
                            }
                            for (const file of files.filter(file => file.fieldname.startsWith(`restaurant_${index}_photo_galerie_`))) {
                                const destination = `ville-articles/${articleData.ville.nom}/restaurants/galerie/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                                const fileUrl = await uploadToS3(file, destination);
                                restaurant.photos.galerie_photos.push(fileUrl);
                            }
                            newRestaurants.push(restaurant);
                        }
                        articleData.informations_pratiques.restaurants_recommandes = newRestaurants;
                    }
                }
               
                articleData.meta = {
                    nombre_vues: 0,
                    derniere_mise_a_jour: new Date()
                };
                
                // Sauvegarder dans la base de données
                const newArticle = new VilleArticle(articleData);
                const admin=await Admin.findById(req.user);
                newArticle.crèepar=admin?.nom_complet||'Admin inconnu';
                const savedArticle = await newArticle.save();
                
                res.status(201).json({
                    success: true,
                    message: 'Article créé avec succès',
                    article: savedArticle
                });
            } catch (error) {
                console.log('error', error);
                
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

    // Nouvelle méthode pour créer un article avec stockage des images sur S3
    async createVilleArticleS3(req: Request, res: Response): Promise<void> {
        // Utiliser multer avec stockage en mémoire pour S3
        uploadMemory(req, res, async (err) => {
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
                
                // Traiter tous les fichiers en les envoyant vers S3
                if (files && files.length > 0) {
                    // Pour chaque fichier, upload vers S3 et obtenir l'URL
                    const uploadPromises = files.map(async (file) => {
                        const fieldname = file.fieldname;
                        let destination = '';
                        
                        if (fieldname.startsWith('ville_photo_')) {
                            destination = `ville-articles/${articleData.ville.nom}/photos/${fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                        } else if (fieldname.startsWith('ville_video_')) {
                            destination = `ville-articles/${articleData.ville.nom}/videos/${fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                        } else if (fieldname.includes('_photo_principale')) {
                            const section = fieldname.split('_')[0]; // Extraire lieu, gastro, hotel, restaurant
                            destination = `ville-articles/${articleData.ville.nom}/${section}/principale/${fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                        } else if (fieldname.includes('_photo_galerie_')) {
                            const section = fieldname.split('_')[0]; // Extraire lieu, gastro, hotel, restaurant
                            destination = `ville-articles/${articleData.ville.nom}/${section}/galerie/${fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                        }
                        
                        try {
                            const fileUrl = await uploadToS3(file, destination);
                            return { fieldname, fileUrl };
                        } catch (uploadError) {
                            console.error(`Erreur lors de l'upload du fichier ${fieldname} vers S3:`, uploadError);
                            throw uploadError;
                        }
                    });
                    
                    // Attendre que tous les uploads soient terminés
                    const uploadResults = await Promise.all(uploadPromises);
                    
                    // Traitement similaire à la méthode originale, mais avec des URLs S3
                    uploadResults.forEach(({ fieldname, fileUrl }) => {
                        if (fieldname.startsWith('ville_photo_')) {
                            medias.photos.push(fileUrl);
                        } else if (fieldname.startsWith('ville_video_')) {
                            medias.videos.push(fileUrl);
                        }
                    });
                    
                    // Mise à jour des données d'article avec les URLs S3
                    articleData.medias = medias;
                    
                    // Traitement des photos des lieux touristiques
                    if (articleData.contenu && articleData.contenu.lieux_touristiques) {
                        articleData.contenu.lieux_touristiques = articleData.contenu.lieux_touristiques.map((lieu: any, index: number) => {
                            lieu.photo = {
                                photo_principale: null,
                                galerie_photos: []
                            };
                            
                            // Rechercher la photo principale
                            const photoResult = uploadResults.find(r => r.fieldname === `lieu_${index}_photo_principale`);
                            if (photoResult) {
                                lieu.photo.photo_principale = photoResult.fileUrl;
                            }
                            
                            // Rechercher les photos de galerie
                            uploadResults
                                .filter(r => r.fieldname.startsWith(`lieu_${index}_photo_galerie_`))
                                .forEach(r => {
                                    lieu.photo.galerie_photos.push(r.fileUrl);
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
                            const photoResult = uploadResults.find(r => r.fieldname === `gastro_${index}_photo_principale`);
                            if (photoResult) {
                                plat.photo.photo_principale = photoResult.fileUrl;
                            }
                            
                            // Rechercher les photos de galerie
                            uploadResults
                                .filter(r => r.fieldname.startsWith(`gastro_${index}_photo_galerie_`))
                                .forEach(r => {
                                    plat.photo.galerie_photos.push(r.fileUrl);
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
                            
                            const photoResult = uploadResults.find(r => r.fieldname === `hotel_${index}_photo_principale`);
                            if (photoResult) {
                                hotel.photos.photo_principale = photoResult.fileUrl;
                            }
                            
                            uploadResults
                                .filter(r => r.fieldname.startsWith(`hotel_${index}_photo_galerie_`))
                                .forEach(r => {
                                    hotel.photos.galerie_photos.push(r.fileUrl);
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
                            
                            const photoResult = uploadResults.find(r => r.fieldname === `restaurant_${index}_photo_principale`);
                            if (photoResult) {
                                restaurant.photos.photo_principale = photoResult.fileUrl;
                            }
                            
                            uploadResults
                                .filter(r => r.fieldname.startsWith(`restaurant_${index}_photo_galerie_`))
                                .forEach(r => {
                                    restaurant.photos.galerie_photos.push(r.fileUrl);
                                });
                            
                            return restaurant;
                        });
                    }
                }
                
                // Ajouter les métadonnées
                articleData.meta = {
                    nombre_vues: 0,
                    derniere_mise_a_jour: new Date(),
                    stockage: 's3' // Marquer que les fichiers sont stockés sur S3
                };
                
                // Sauvegarder dans la base de données
                const newArticle = new VilleArticle(articleData);
                const savedArticle = await newArticle.save();
                
                res.status(201).json({
                    success: true,
                    message: 'Article créé avec succès avec stockage S3',
                    article: savedArticle
                });
            } catch (error) {
                console.error('Erreur lors de la création de l\'article:', error);
                res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
            }
        });
    }

    // Méthode pour mettre à jour un article avec stockage des images sur S3
    async updateVilleArticleS3(req: Request, res: Response): Promise<void> {
        uploadMemory(req, res, async (err) => {
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
                    photos: [...(existingArticle.medias?.photos || [])],
                    videos: [...(existingArticle.medias?.videos || [])]
                };
    
                // Traiter tous les fichiers en les envoyant vers S3
                if (files && files.length > 0) {
                    // Pour chaque fichier, upload vers S3 et obtenir l'URL
                    const uploadPromises = files.map(async (file) => {
                        const fieldname = file.fieldname;
                        let destination = '';
                        
                        if (fieldname.startsWith('ville_photo_')) {
                            destination = `ville-articles/${articleData.ville.nom}/photos/${fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                        } else if (fieldname.startsWith('ville_video_')) {
                            destination = `ville-articles/${articleData.ville.nom}/videos/${fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                        } else if (fieldname.includes('_photo_principale')) {
                            const section = fieldname.split('_')[0]; // Extraire lieu, gastro, hotel, restaurant
                            destination = `ville-articles/${articleData.ville.nom}/${section}/principale/${fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                        } else if (fieldname.includes('_photo_galerie_')) {
                            const section = fieldname.split('_')[0]; // Extraire lieu, gastro, hotel, restaurant
                            destination = `ville-articles/${articleData.ville.nom}/${section}/galerie/${fieldname}-${Date.now()}${path.extname(file.originalname)}`;
                        }
                        
                        try {
                            const fileUrl = await uploadToS3(file, destination);
                            return { fieldname, fileUrl };
                        } catch (uploadError) {
                            console.error(`Erreur lors de l'upload du fichier ${fieldname} vers S3:`, uploadError);
                            throw uploadError;
                        }
                    });
                    
                    // Attendre que tous les uploads soient terminés
                    const uploadResults = await Promise.all(uploadPromises);
                    
                    // Traitement des fichiers uploadés
                    uploadResults.forEach(({ fieldname, fileUrl }) => {
                        if (fieldname.startsWith('ville_photo_')) {
                            medias.photos.push(fileUrl);
                        } else if (fieldname.startsWith('ville_video_')) {
                            medias.videos.push(fileUrl);
                        }
                    });
                    
                    // Mise à jour des données d'article avec les URLs S3
                    articleData.medias = medias;
                    
                    // Traitement des photos des lieux touristiques
                    if (articleData.contenu && articleData.contenu.lieux_touristiques) {
                        articleData.contenu.lieux_touristiques = articleData.contenu.lieux_touristiques.map((lieu: any, index: number) => {
                            lieu.photo = {
                                photo_principale: existingArticle.contenu?.lieux_touristiques?.[index]?.photo?.photo_principale || null,
                                galerie_photos: [...(existingArticle.contenu?.lieux_touristiques?.[index]?.photo?.galerie_photos || [])]
                            };
    
                            // Rechercher la photo principale
                            const photoResult = uploadResults.find(r => r.fieldname === `lieu_${index}_photo_principale`);
                            if (photoResult) {
                                lieu.photo.photo_principale = photoResult.fileUrl;
                            }
                            
                            // Rechercher les photos de galerie
                            uploadResults
                                .filter(r => r.fieldname.startsWith(`lieu_${index}_photo_galerie_`))
                                .forEach(r => {
                                    lieu.photo.galerie_photos.push(r.fileUrl);
                                });
                            
                            return lieu;
                        });
                    }
    
                    // Traitement des photos de gastronomie - similaire à lieux_touristiques
                    if (articleData.contenu && articleData.contenu.gastronomie) {
                        articleData.contenu.gastronomie = articleData.contenu.gastronomie.map((plat: any, index: number) => {
                            plat.photo = {
                                photo_principale: existingArticle.contenu?.gastronomie?.[index]?.photo?.photo_principale || null,
                                galerie_photos: [...(existingArticle.contenu?.gastronomie?.[index]?.photo?.galerie_photos || [])]
                            };
    
                            // Rechercher la photo principale
                            const photoResult = uploadResults.find(r => r.fieldname === `gastro_${index}_photo_principale`);
                            if (photoResult) {
                                plat.photo.photo_principale = photoResult.fileUrl;
                            }
                            
                            // Rechercher les photos de galerie
                            uploadResults
                                .filter(r => r.fieldname.startsWith(`gastro_${index}_photo_galerie_`))
                                .forEach(r => {
                                    plat.photo.galerie_photos.push(r.fileUrl);
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
    
                            const photoResult = uploadResults.find(r => r.fieldname === `hotel_${index}_photo_principale`);
                            if (photoResult) {
                                hotel.photos.photo_principale = photoResult.fileUrl;
                            }
                            
                            uploadResults
                                .filter(r => r.fieldname.startsWith(`hotel_${index}_photo_galerie_`))
                                .forEach(r => {
                                    hotel.photos.galerie_photos.push(r.fileUrl);
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
    
                            const photoResult = uploadResults.find(r => r.fieldname === `restaurant_${index}_photo_principale`);
                            if (photoResult) {
                                restaurant.photos.photo_principale = photoResult.fileUrl;
                            }
                            
                            uploadResults
                                .filter(r => r.fieldname.startsWith(`restaurant_${index}_photo_galerie_`))
                                .forEach(r => {
                                    restaurant.photos.galerie_photos.push(r.fileUrl);
                                });
                            
                            return restaurant;
                        });
                    }
                }
    
                // Mettre à jour les métadonnées
                articleData.meta = {
                    ...existingArticle.meta,
                    derniere_mise_a_jour: new Date(),
                    stockage: 's3' // Marquer que les fichiers sont stockés sur S3
                };
    
                // Mettre à jour l'article dans la base de données
                const updatedArticle = await VilleArticle.findByIdAndUpdate(
                    articleId,
                    articleData,
                    { new: true, runValidators: true }
                );
                const admin=await Admin.findById(req.user);
                console.log('admin', req.user);
                
                if (updatedArticle) {
                    updatedArticle.crèepar = admin?.nom_complet || 'Admin inconnu';
                }
                updatedArticle?.save();
    
                res.status(200).json({
                    success: true,
                    message: 'Article mis à jour avec succès via S3',
                    article: updatedArticle
                });
    
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'article:', error);
                res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
            }
        });
    }

    
}

export const controllerVilleArticleInstance = new ControllerVilleArticle();