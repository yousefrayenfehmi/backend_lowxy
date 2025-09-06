import { NextFunction, Request, Response } from "express";
import { Admin } from "../models/Admin";
import { dbConnection } from "../BDconnection/BDconnection";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import Fonction from "../fonction/Fonction";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { promises } from "dns";
import { Touristes } from "../models/Touriste";
import { Chauffeurs } from '../models/Chauffeure'; 
import { Partenaires } from "../models/Partenaire";
import { CoveringAd } from "../models/Covering_ads";
import { Emailtemplates } from "../fonction/EmailTemplates";

class Controlleradmin {
   
async validecovering(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }

    const { id } = req.params;
    
       try {
        const covering = await CoveringAd.findByIdAndUpdate(id, { $set: { status: 'active' } }, { new: true });
        if (!covering) {
            res.status(404).json({ error: 'Covering non trouvé' });
            return;
        }
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const coveringURL = `${baseUrl}/covering-ads-commande`;
        const chauffeurs = await Chauffeurs.find(
            { 'vehicule.modele': covering.details.modele_voiture }
          );
          let emailsSent = 0;

          for (const chauffeur of chauffeurs) {
            await Fonction.sendmail(
                chauffeur.info.email,
                'Nouvelle Opportunité Publicitaire pour votre Taxi',
                Emailtemplates.getNewCoveringNotification(
                  {
                    modele: covering.details.modele_voiture,
                    type: covering.details.type_covering,
                    prix: (covering.details.prix/2)/covering.details.nombre_taxi
                  },
                  coveringURL
                )
              );
              emailsSent++;
          }
        res.status(200).json({ message: 'Covering validé avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la validation du covering' });
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
            let admin = await Admin.findById(id);
    
            if (!admin) {
                res.status(404).json({ error: 'Chauffeur non trouvé' });
                return;
            }
    
            const updateFields = {
                'nom_complet': req.body.nom_complet ?? admin.nom_complet,
                
                'tel': req.body.tel ?? admin.tel
            };
    
            const updatedadmin = await Admin.findByIdAndUpdate(
                id, 
                { $set: updateFields }, 
                { 
                    new: true,  // Retourne le document mis à jour
                    runValidators: true  // Valide les champs mis à jour
                }
            );
    
            if (!updatedadmin) {
                res.status(404).json({ error: 'admin non trouvé' });
                return;
            }
    
            res.status(200).json({
                message: 'Profil mis à jour avec succès',
                chauffeur: updatedadmin
            });
    
        } catch (error) {
            console.error('Erreur lors de la mise à jour du admin:', error);
            res.status(500).json({ 
                error: 'Erreur lors de la mise à jour du admin'
                
            });
        }
    }




    async login(req: Request, res: Response):Promise<void> {
        console.log("admin try to login")
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        const { email, mot_de_passe } = req.body;
        console.log(email, mot_de_passe)

        try {
            const admin = await Admin.findOne({ 
                'email': email,
                
                'isAdmin': true
            });
            
            if (!admin) {
                res.status(404).json({ error: 'Admin non trouvé' });
                return 
            }

            const match = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
            if (!match) {
                 res.status(400).json({ error: 'Mot de passe incorrect' });
                 return
            }
            
            const token = Fonction.createtokenetcookies(res, admin._id);
            
            res.status(200).json({
                success: true,
                admin: {
                    _id: admin._id,
                    info: {
                        nom_complet: admin.nom_complet,
                        email: admin.email,
                        tel: admin.tel,
                        type: admin.type
                    }
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la connexion' });
        } 
    }

   

    
    

    async verifyAdminToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        console.log("verifyTokenAdmin")
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            });
        }

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        console.log(token)
        if (!token) {
            res.status(401).json({ message: 'Token manquant' });
            return;
        }

        try {
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
            const admin = await Admin.findById(id);
            
            if (!admin) {
                res.status(401).json({ message: 'Admin non trouvé' });
                return;
            }
            console.log("admin Token Verified   ")
            req.user = id;
            res.status(200).json({ message: 'Token valide', userId: id });

            
        } catch (err) {
            res.status(403).json({ message: 'Token invalide' });
        } 
    }

    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        console.log("verifyTokenAdmin")
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            });
        }

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        console.log(token)
        if (!token) {
            res.status(401).json({ message: 'Token manquant' });
            return;
        }

        try {
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
            const admin = await Admin.findById(id);
            
            if (!admin) {
                res.status(401).json({ message: 'Admin non trouvé' });
                return;
            }
            console.log("admin Token Verified   ")
            req.user = id;
            next();
            
        } catch (err) {
            res.status(403).json({ message: 'Token invalide' });
        } 
    }

    async createAdmin(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            });
        }
        console.log(req.body)
        const admin = new Admin(req.body);
        console.log(admin)
        try {
            admin.mot_de_passe = await bcrypt.hash(req.body.motdepasse, 10);
            console.log('hash')
            const savedAdmin = await admin.save();
            console.log('saved')
            res.status(201).json(savedAdmin);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: "Erreur lors de la création de l'admin" });
        } 
    }

    async getAllAdmins(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const admins = await Admin.find();
            if (!admins || admins.length === 0) {
                 res.status(404).json({ error: 'Aucun admin trouvé' });
                 return
            }
            res.status(200).json(admins);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération des admins' });
        } 
    }

    async getAdminById(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const admin = await Admin.findById(req.params.id);
            if (!admin) {
                 res.status(404).json({ error: 'Admin non trouvé' });
                 return
            }
            res.status(200).json(admin);
        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la recherche de l'admin" });
        } 
    }

    async updateAdmin(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!admin) {
                 res.status(404).json({ error: 'Admin non trouvé' });
                 return
            }
            res.status(200).json(admin);
        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la mise à jour de l'admin" });
        } 
    }

    async deleteAdmin(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const admin = await Admin.findByIdAndDelete(req.params.id);
            if (!admin) {
                 res.status(404).json({ error: 'Admin non trouvé' });
                 return
            }
            res.status(200).json(admin);
        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la suppression de l'admin" });
        } 
    }

    async logout(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
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

    async getTouristeNumberbyMatricule(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }
        try {
            const matricule=req.params.matricule;
            const touriste = await Touristes.find({ 'info.matricule_taxi': matricule });
            res.status(200).json(touriste.length);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération du touriste' });
        }
    }

    async getStatistics(req: Request, res: Response): Promise<void> {
        try {
            // Récupérer les statistiques à partir des collections MongoDB
            const usersCount = await Touristes.countDocuments();
            const newUsersCount = await Touristes.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    
            const driversCount = await Chauffeurs.countDocuments();
            const newDriversCount = await Chauffeurs.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    
            const partnersCount = await Partenaires.countDocuments();
            const newPartnersCount = await Partenaires.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    
            const toursCount = await Partenaires.aggregate([{ $unwind: "$tours" }, { $count: "count" }]);
            const newToursCount = await Partenaires.aggregate([{ $unwind: "$tours" }, { $match: { "tours.jours.date": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }, { $count: "count" }]);
    
            const adsCount = await Partenaires.aggregate([{ $unwind: "$publicites" }, { $count: "count" }]);
            const newAdsCount = await Partenaires.aggregate([{ $unwind: "$publicites" }, { $match: { "publicites.periode.debut": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }, { $count: "count" }]);
    
            const adsQuizCount = await Partenaires.aggregate([{ $unwind: "$pub_quiz" }, { $count: "count" }]);
            const newAdsQuizCount = await Partenaires.aggregate([{ $unwind: "$pub_quiz" }, { $match: { "pub_quiz.periode.debut": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }, { $count: "count" }]);
    
            res.status(200).json({
                users: usersCount,
                newUsers: newUsersCount,
                drivers: driversCount,
                newDrivers: newDriversCount,
                partners: partnersCount,
                newPartners: newPartnersCount,
                tours: toursCount[0]?.count || 0,
                newTours: newToursCount[0]?.count || 0,
                ads: adsCount[0]?.count || 0,
                newAds: newAdsCount[0]?.count || 0,
                adsQuiz: adsQuizCount[0]?.count || 0,
                newAdsQuiz: newAdsQuizCount[0]?.count || 0,
            });
    
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques :", error);
            res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
        }
    }
    

    
}

export const controllerAdminInstance = new Controlleradmin();