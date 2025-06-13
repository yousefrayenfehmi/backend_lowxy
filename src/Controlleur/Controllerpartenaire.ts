import { Partenaires } from "../models/Partenaire";
import { dbConnection } from "../BDconnection/BDconnection";
import { NextFunction, Request, Response } from "express";
import Fonction from "../fonction/Fonction";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose, { Mongoose, Types } from 'mongoose';
import multer from "multer";
import path from "path";
import fs, { stat } from "fs";
import Stripe from 'stripe';
import { ObjectId } from 'mongodb';
import { S3 } from 'aws-sdk';

import dotenv from 'dotenv';
import ConfigPublicite from "../models/Configpublicite";

const stripe = new Stripe('sk_test_51RAG0WQ4fzXaDh6qqaSa4kETsLitTt3nAHAnaPoodCOrgstRL0puvbFYG6KoruYmawEgL3o8NJ5DmywcApPS2NjH00FKdOaX9O');

const s3 = new S3({
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
 export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
  }).fields([
    { name: 'banners', maxCount: 3 },
    { name: 'videos', maxCount: 3},
    {name:'covering',maxCount:1},
    {name:'facture',maxCount:1}
  ]);

export async function uploadToS3(file: Express.Multer.File, destination: string): Promise<string> {
  let fileBuffer: Buffer;
  
  // Gérer les deux types de stockage
  if (file.buffer) {
    // Stockage mémoire
    fileBuffer = file.buffer;
  } else if (file.path) {
    // Stockage local - lire le fichier
    console.log('file.path33', file.path);
    
    fileBuffer = fs.readFileSync(file.path);
    console.log('fileBuffer56', fileBuffer);
    
  } else {
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
    const result = await s3.upload(params).promise();
    console.log('Upload terminé:', result);
    
    if (!result || !result.Location) {
      throw new Error('Upload S3 réussi mais pas de Location retournée');
    }
    
    console.log('URL finale:', result.Location);
    return result.Location;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    const urlParts = new URL(fileUrl);
    const s3Path = urlParts.pathname.substring(1); 
    
    const params = {
      Bucket: 'lowxysas',
      Key: s3Path
    };

    await s3.deleteObject(params).promise();
    console.log(`File deleted successfully from S3: ${fileUrl}`);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

class ControllerPartenaire {
    constructor(){
        dotenv.config({ path: path.resolve(__dirname, '../../.env') });
        console.log('process.env.front_end'+process.env.front_end);
    }
    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
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
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
            const partenaire = await Partenaires.findById(id);
            if (!partenaire) {
                
                res.status(401).json({ message: 'Partenaire non trouvé' });
                return;
            }
            req.user = id;
            next();
        } catch (err) {
            res.status(403).json({ message: 'Token invalide' });
        } 
    }
    async enregisterstatistiques(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
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
                console.log("publiciteId"+publiciteId);
                
                if (statistiques.hasOwnProperty(publiciteId)) {
                    const { impressions, clics } = statistiques[publiciteId];
                    console.log(`Publicité ${publiciteId}: ${impressions} impressions, ${clics} clics`);
                    
                    // Méthode alternative pour mettre à jour la publicité
                    try {
                        const partenaire = await Partenaires.findOneAndUpdate(
                            { 'pub_quiz._id': publiciteId },
                            { 
                                $inc: { 
                                    'pub_quiz.$.impressions': impressions,
                                    'pub_quiz.$.clicks': clics 
                                } 
                            },
                            { new: true }
                        );
                        
                        if (!partenaire) {
                            console.log(`Publicité ${publiciteId} non trouvée`);
                        }
                    } catch (updateError) {
                        console.error(`Erreur lors de la mise à jour de la publicité ${publiciteId}:`, updateError);
                    }
                }
            }
            
            res.status(200).json({ message: 'Statistiques enregistrées avec succès' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error });
        }
    }
    
    

    createcovering(req: Request, res: Response): void {
        console.log("salut gays");
        
        upload(req, res, async (err) => {
            if (err) {
                console.error('Erreur multer:', err);
                res.status(400).json({ message: 'Erreur lors de l\'upload des fichiers: ' + err.message });
                return;
            }
            //recuperer les fichiers uploadés
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            //verifier s'il y a des fichiers
            if (!files || (!files['covering'] || files['covering'].length === 0)) {
                res.status(400).json({ message: 'Aucun fichier image ou vidéo envoyé' });
                return;
            }
            console.log(req.body);
            
            //Traiter les images avec S3
            const coveringFile = files['covering'][0];
            const fileName = `covering-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(coveringFile.originalname)}`;
            const destination = `covering_ads/${req.params.nom_societe}/images/${fileName}`;
            
            try {
                const fileUrl = await uploadToS3(coveringFile, destination);
                
                const covring = {
                    _id: new Types.ObjectId(),
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

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price_data: {
                                currency: 'eur',
                                product_data: {
                                    name: `Publicité ${req.params.nom_societe || ''}`,
                                    description: 'Campagne publicitaire',
                                },
                                unit_amount:  Math.round(covring.prix * 100), // Conversion en centimes et arrondi
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${req.headers.origin || process.env.front_end || 'http://a9aec0bf981024fcab3097aa85d37546-1960190977.eu-west-3.elb.amazonaws.com'}//paiment_sucesses/${covring._id}?data=${encodeURIComponent(JSON.stringify(covring))}&type=covering`,
                    cancel_url: `${process.env.front_end}/paiment_echouee/${covring._id}?type=covering`,
                });

                res.status(200).json({ id: session.id });
            } catch (error: any) {
                console.error('Erreur lors de l\'upload sur S3:', error);
                res.status(500).json({ message: 'Erreur lors de l\'upload: ' + error.message });
            }
        });
    }

    async createPubliciteetpay(req: Request, res: Response): Promise<void> {
        
        upload(req, res, async (err: any) => {
          
          try {
            if (err) {
              console.log("error");
              console.error('Erreur multer:', err);
              res.status(400).json({ message: 'Erreur lors de l\'upload des fichiers: ' + err.message });
              return;
            }
            console.log("salut");
            
            // Récupérer les fichiers uploadés
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
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
            const bannerUrls: string[] = [];
            
            // Upload des bannières vers S3
            for (const file of bannerFiles) {
              console.log("file", file);
              const fileName = `banners-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
              const destination = `compagne/${req.params.nom_societe}/banners/${fileName}`;
              const fileUrl = await uploadToS3(file, destination);
              bannerUrls.push(fileUrl);
            }
            
            // Traiter les vidéos avec S3
            const videoFiles = files['videos'] || [];
            const videoUrls: string[] = [];
            
            // Upload des vidéos vers S3
            for (const file of videoFiles) {
              const fileName = `videos-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
              const destination = `compagne/${req.params.nom_societe}/videos/${fileName}`;
              const fileUrl = await uploadToS3(file, destination);
              videoUrls.push(fileUrl);
            }
            
            const partenaire = await Partenaires.findOne({_id: req.user});
            
            // Récupérer et parser les données JSON
            const id = new mongoose.Types.ObjectId();
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
              periode: {debut: req.body.dateDebut, fin: req.body.dateFin},
              Budget_totale: Budget_totale,
              statu: 'En attente de validation',
              impressions: 0,
              clicks: 0
            };
            console.log(pub);
            
            // INTÉGRATION STRIPE ICI
            try {
              
              const budgetAmount = typeof Budget_totale === 'number' ? Budget_totale : parseFloat(Budget_totale || '0');
              
              
              
              const session = await stripe.checkout.sessions.create({
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
                success_url: `${process.env.front_end }/paiment_sucesses/${pub._id}?data=${encodeURIComponent(JSON.stringify(pub))}&type=publicite`,
                cancel_url: `${process.env.front_end }/paiment_echouee/${pub._id}?type=publicite`,
                
              });
              
              
             
              
              // Retourner l'ID de la session pour redirection
              res.status(201).json({
                message: 'Publicité créée avec succès',
                id: session.id,
                publicite_id: id
              });
              
            } catch (stripeError) {
              console.error('Erreur Stripe:', stripeError);
              res.status(400).json({ 
                message: 'Erreur lors de la création du paiement',
              });
            }
            
          } catch (error) {
            console.error('Erreur lors de la création de la publicité:', error);
            res.status(500).json({
              message: error, 
            });
          }
        });
      }


    async getpubAllquizvalide(req: Request, res: Response): Promise<void> {
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
          res.status(500).json({ error: 'Erreur de connexion à la base de données' });
          return;
        });
      }
      try {
        console.log('hhhhhhhhhhhhhhhhhhhh active' );
        
        // Trouver tous les partenaires avec des pub_quiz actives
        const partenaires = await Partenaires.find({'pub_quiz.statu': 'Active'});
        console.log(partenaires);
        
        const pubsQuizActives = [];
        
        for (const partenaire of partenaires) {
          const pubsActives = partenaire.pub_quiz.filter(quiz => quiz.statu === 'Active');
          pubsQuizActives.push(...pubsActives);
        }
        
        res.status(200).json(pubsQuizActives);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des publicités quiz' });
      }
    }

async pubcomplete(req: Request, res: Response): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await dbConnection.getConnection().catch(error => {
      res.status(500).json({ error: 'Erreur de connexion à la base de données' });
      return;
    });
  }
  try {
        const partenaires = await Partenaires.find();
        const configads=await ConfigPublicite.find();
        for(const partenaire of partenaires){
            for(const pub of partenaire.pub_quiz){
                console.log(pub.periode.fin<new Date());
                console.log(new Date());
                
                if(pub.periode.fin < new Date() || (pub.clicks*configads[0].prixClic>pub.Budget_totale || pub.impressions*configads[0].prixImpression>pub.Budget_totale)){
                    pub.statu = 'Complete';
                    console.log("pub complete", pub);
                    
                }
            }
            await partenaire.save();
        }
        res.status(200).json(partenaires);
  } catch (error) { 
    console.log(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des publicités quiz' });
  }
}

async Pubsauvgarde(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }

    try {
        console.log('hhhhhhhhhhhhhhhhhhhh');
        
        const id = req.user;
        const data = req.body.data;
        console.log("data", data);
        
        const pub = await Partenaires.findOne({'_id': id});
        pub?.pub_quiz.push(data);
        await pub?.save();
        res.status(200).json(pub);
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ error: error });
    }
}

async covringsave(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }
    try {
        const id = req.user;
        const data = req.body.data;
        console.log("data"+data);
        const partenaire = await Partenaires.findOne({'_id': id});
        await partenaire?.save();
        res.status(200).json(partenaire);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

async pubetatchanger(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }

    try {    
        const id = req.params.id;
        console.log('id'+id);
        
        const objectIdFromString = new ObjectId(id);
        const pub = await Partenaires.findOne({'pub_quiz._id': objectIdFromString});
        console.log(pub);
        
        console.log('mazelet mactivetch');
        
        if (pub) {
             pub.pub_quiz.filter(quiz => {
              // Convert both to strings before comparing
              if(quiz._id?.toString() === objectIdFromString.toString()){
                if(quiz.statu === 'En attente de validation'){
                    console.log('rahi active sayer');
                    
                    quiz.statu = 'Active'}
                 
              } 
            });
            await pub.save();
        }
        if (!pub) {
            res.status(404).json({ error: 'Publicité non trouvée' });
            return;
        }
        res.status(200).json(pub);
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ error: error });
    }
}
async tourbypartenaire(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }
    try {
        const id = req.params.id;
        const partenaire = await Partenaires.findById(id);
        if (!partenaire) {
            res.status(404).json({ error: 'Partenaire non trouvé' });
            return;
        }
        const tours = partenaire.tours;
        res.status(200).json({tours:tours,nom_societe:partenaire.inforamtion.inforegester.nom_entreprise});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

async deleteTour(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }
    try {
        const id = req.params.id;
        const partenaire = await Partenaires.findOne({ 'tours._id': id });
        if (!partenaire) {
            res.status(404).json({ error: 'tour non trouvé' });
            return;
        }
        const tour = partenaire.tours.find(tour => tour._id?.toString() === id);
        for (const image of tour?.images || []) {
            await deleteFromS3(image);
        }
        partenaire.tours = partenaire.tours.filter(tour => tour._id?.toString() !== id);
        await partenaire.save();
        
        res.status(200).json({ message: 'Tour supprimé avec succès' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}
async deletepubquiz(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }

    try {
        const id = req.params.id;
        const partenaire = await Partenaires.findOne({ 'pub_quiz._id': id });
        
        if (!partenaire) {
            res.status(404).json({ error: 'Publicité non trouvée' });
            return;
        }

        // Trouver la publicité à supprimer
        const pubquiz = partenaire.pub_quiz.find(quiz => quiz._id?.toString() === id);
        
        if (pubquiz) {
            // Supprimer les fichiers de S3
            for (const banner of pubquiz.bannieres) {
                await deleteFromS3(banner);
            }
            for (const video of pubquiz.videos) {
                await deleteFromS3(video);
            }
            

            // Supprimer la publicité du tableau pub_quiz
            partenaire.pub_quiz = partenaire.pub_quiz.filter(quiz => quiz._id?.toString() !== id);
            await partenaire.save();
        }

        res.status(200).json({ message: 'Publicité supprimée avec succès' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

    async Signup(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { email } = req.body.inforamtion.inforegester;
            const partenaireExistant = await Partenaires.findOne({ 'inforamtion.inforegester.email': email });
            
            if (partenaireExistant) {
                res.status(400).json({ error: 'Un partenaire avec cet email existe déjà' });
                return;
            }

            const partenaire = new Partenaires(req.body);
            console.log(partenaire);
            
            const Code: string = Fonction.generecode(100000,900000);;
            partenaire.securites = {
                code: Code,
                date: new Date(),
                isverified: false,
            };

            partenaire.inforamtion.inforegester.motdepasse = await bcrypt.hash(partenaire.inforamtion.inforegester.motdepasse, 10);

            const savedPartenaire = await partenaire.save();
            const token = Fonction.createtokenetcookies(res, savedPartenaire._id);
            await Fonction.sendmail(email, 'Inscription', Code);

            res.status(201).json({ partenaire: savedPartenaire, token });
        } catch (error) {
            console.log(error);
            
            res.status(500).json({ error: 'Erreur lors de la création du partenaire' });
        } 
    }

    

    async login(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { email, motdepasse } = req.body;
            const partenaire = await Partenaires.findOne({ 
                'inforamtion.inforegester.email': email,
                'securites.isverified': true 
            });

            if (!partenaire) {
                res.status(404).json({ error: 'Partenaire non trouvé ou non vérifié' });
                return;
            }

            const match = await bcrypt.compare(motdepasse, partenaire.inforamtion.inforegester.motdepasse);
            if (!match) {
                res.status(400).json({ error: 'Mot de passe incorrect' });
                return;
            }

            const token = Fonction.createtokenetcookies(res, partenaire._id);

            res.status(200).json({
                success: true,
                partenaire: {
                    _id: partenaire._id,
                    inforamtion: {
                        inforegester: {
                            nom_entreprise: partenaire.inforamtion.inforegester.nom_entreprise,
                            email: partenaire.inforamtion.inforegester.email,
                            telephone: partenaire.inforamtion.inforegester.telephone
                        }
                    }
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la connexion' });
        } 
    }


    async completerprofil(req: Request, res: Response): Promise<void> {
            if (mongoose.connection.readyState !== 1) {
                await dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
        
            try {
                const id = req.params.id;
                let partenaire = await Partenaires.findById(id);
        
                if (!partenaire) {
                    res.status(404).json({ error: 'Chauffeur non trouvé' });
                    return;
                }
        
                // Mise à jour sélective des champs
                const updateFields = {
                    // Mise à jour des informations de registre (si nécessaire)
                    'information.inforegester.nom_entreprise': 
                        req.body.information?.inforegester?.nom_entreprise ?? 
                        partenaire.inforamtion.inforegester.nom_entreprise,
                    
                    'information.inforegester.Propriétaire': 
                        req.body.information?.inforegester?.Proprietaire
                        ?? 
                        partenaire.inforamtion.inforegester.Proprietaire
                        ,
                    
                    'information.inforegester.email': 
                        req.body.information?.inforegester?.email ?? 
                        partenaire.inforamtion.inforegester.email,
                    
                    'information.inforegester.telephone': 
                        req.body.information?.inforegester?.telephone ?? 
                        partenaire.inforamtion.inforegester.telephone,
                
                    // Ne pas mettre à jour le mot de passe
                    
                    // Mise à jour des informations de société
                    'information.info_societe.numero_serie': 
                        req.body.information?.info_societe?.numero_serie ?? 
                        partenaire.inforamtion.info_societe.numero_serie,
                    
                    'information.info_societe.domaines': 
                        req.body.information?.info_societe?.domaines ?? 
                        partenaire.inforamtion.info_societe.domaines,
                    
                    // Mise à jour de l'adresse
                    'information.info_societe.adresse': {
                        'ville': 
                            req.body.information?.info_societe?.adresse?.ville ?? 
                            partenaire.inforamtion.info_societe.adresse.ville,
                        
                        'pays': 
                            req.body.information?.info_societe?.adresse?.pays ?? 
                            partenaire.inforamtion.info_societe.adresse.pays,
                        
                        'rue': 
                            req.body.information?.info_societe?.adresse?.rue ?? 
                            partenaire.inforamtion.info_societe.adresse.rue
                    }
                }
        
                // Mise à jour partielle
                const updatedpartenaire = await Partenaires.findByIdAndUpdate(
                    id, 
                    { $set: updateFields }, 
                    { 
                        new: true,  // Retourne le document mis à jour
                        runValidators: true  // Valide les champs mis à jour
                    }
                );
        
                if (!updatedpartenaire) {
                    res.status(404).json({ error: 'partenaire non trouvé' });
                    return;
                }
        
                res.status(200).json({
                    message: 'Profil mis à jour avec succès',
                    chauffeur: updatedpartenaire
                });
        
            } catch (error) {
                console.error('Erreur lors de la mise à jour du partenaire:', error);
                res.status(500).json({ 
                    error: 'Erreur lors de la mise à jour du partenaire'
                    
                });
            }
        }
        

    async logout(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
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
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la déconnexion'
            });
        } 
    }

    async renvoyeruncode(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const id = req.user;
            const partenaire = await Partenaires.findById(id);
            if (!partenaire) {
                res.status(404).json({ error: 'Partenaire non trouvé' });
                return;
            }
            const Code: string = Fonction.generecode(100000,900000);;
            partenaire.securites.code = Code;
            await partenaire.save();
            await Fonction.sendmail(partenaire.inforamtion.inforegester.email, 'Inscription', Code);
            res.status(200).json({
                success: true,
                message: 'Email envoyé avec succès'
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
        } 
    }

    async VeriffieEmail(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const id = req.user;
            const { code } = req.body;
            const partenaire = await Partenaires.findOne({
                '_id': id,
                'securites.code': code,
                'securites.date': { $gt: new Date(Date.now() - 15 * 60 * 1000) }
            });

            if (!partenaire) {
                res.status(400).json({
                    success: false,
                    message: 'Le code est invalide ou a expiré'
                });
                return;
            }

            partenaire.securites = {
                isverified: true
            } as any;

            await partenaire.save();
            res.status(200).json({
                success: true,
                message: 'Email vérifié avec succès'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification'
            });
        } 
    }

    async forgetpassword(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { email } = req.body;
            const partenaire = await Partenaires.findOne({ 'inforamtion.inforegester.email': email });
            if (!partenaire) {
                res.status(404).json({ error: 'Partenaire non trouvé' });
                return;
            }
            const resetToken = crypto.randomBytes(20).toString("hex");
            const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
            partenaire.resetPasswordToken = resetToken;
            partenaire.resetPasswordTokenExpire = resetTokenExpiresAt;
            await partenaire.save();
            await Fonction.sendmail(email, 'password', process.env.front_end+"/changepassword/" + resetToken);
            res.status(200).json({
                success: true,
                message: 'Email envoyé avec succès'
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Erreur lors de l'envoi du mail de réinitialisation", errors: error });
        } 
    }

    async resetpassword(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { token } = req.params;
            const { motdepasse } = req.body;
            const partenaire = await Partenaires.findOne({
                resetPasswordToken: token,
                resetPasswordTokenExpire: { $gt: Date.now() },
            });

            if (!partenaire || !partenaire.inforamtion || !partenaire.inforamtion.inforegester) {
                res.status(400).json({ success: false, message: "Token de réinitialisation invalide ou expiré" });
                return;
            }
            const hashedPassword = await bcrypt.hash(motdepasse, 10);
            partenaire.inforamtion.inforegester.motdepasse = hashedPassword;
            partenaire.resetPasswordToken = undefined;
            partenaire.resetPasswordTokenExpire = undefined as any;
            await partenaire.save();

            res.status(200).json({ success: true, message: "Mot de passe réinitialisé avec succès" });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
        } 
    }

    async Createpartenaire(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const partenaire = new Partenaires(req.body);
            const savedPartenaire = await partenaire.save();
            res.status(201).json(savedPartenaire);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la création du partenaire' });
        } 
    }

    async getAllPartenaires(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const partenaires = await Partenaires.find();
            res.status(200).json(partenaires);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération des partenaires' });
        } 
    }

    async getPartenaireById(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            const partenaire = await Partenaires.findById(id);
            if (!partenaire) {
                res.status(404).json({ error: 'Partenaire non trouvé' });
                return;
            }
            res.status(200).json(partenaire);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération du partenaire' });
        } 
    }

    async updatePartenaire(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            const updatedPartenaire = await Partenaires.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedPartenaire) {
                res.status(404).json({ error: 'Partenaire non trouvé' });
                return;
            }
            res.status(200).json(updatedPartenaire);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la mise à jour du partenaire' });
        } 
    }

    async deletePartenaire(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            const deletedPartenaire = await Partenaires.findByIdAndDelete(id);
            if (!deletedPartenaire) {
                res.status(404).json({ error: 'Partenaire non trouvé' });
                return;
            }
            res.status(200).json({ message: 'Partenaire supprimé avec succès' });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la suppression du partenaire' });
        } 
    }


    async getPartenaireByToken(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
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
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
            const partenaire = await Partenaires.findById(id).select('-motdepasse');;
            if (!partenaire) {
                res.status(401).json({ message: 'Partenaire non trouvé' });
                return;
            }
            res.status(200).json(partenaire);
        } catch (err) {
            res.status(403).json({ message: 'Token invalide' });
        } 
        
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
    
        if (!token) {
            res.status(401).json({ message: 'Token manquant' });
            return
        }
    
        const { currentPassword, newPassword } = req.body;
    
        if (!newPassword || newPassword.length < 8) {
            res.status(400).json({ message: 'New password must be at least 8 characters long' });

            return
        }
    
        try {

            // Decode the token
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
    
            // Ensure the id is a valid ObjectId
            if (!Types.ObjectId.isValid(id)) {
                res.status(400).json({ message: 'Invalid user ID in token' });
                return 
            }
    
            // Find the user by id, excluding the password
            const user = await Partenaires.findById(id);
    
            if (!user) {
                res.status(404).json({ message: 'partenaire non trouvé' });
                return 
            }
    
            // Check if the current password matches
            const isMatch = await bcrypt.compare(currentPassword, user.inforamtion.inforegester.motdepasse);
            if (!isMatch) {
                res.status(400).json({ message: 'Current password is incorrect' });
                return 
            }
    
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.inforamtion.inforegester.motdepasse = hashedPassword;
            await user.save();
    
            res.status(200).json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'An error occurred while changing the password' });
        }
    }
    
}

export const ControllerpartenairInstance = new ControllerPartenaire();
