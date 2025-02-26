import { dbConnection } from '../BDconnection/BDconnection';
import Fonction from '../fonction/Fonction';
import { Chauffeurs } from '../models/Chauffeure'; 
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import passport from 'passport';

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

class controllerchauffeur {
    constructor() {
        dotenv.config({ path: path.resolve(__dirname, '../.env') });
    }
    
    
    async verifyToken(req: Request, res: Response, next: NextFunction):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            });
        }

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
             res.status(401).json({ message: 'Token manquant' });
             return
        }

        try {
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
            const chauffeur = await Chauffeurs.findById(id);
            if (!chauffeur) {
                 res.status(401).json({ message: 'chauffeur non trouvé' });
                 return
            }
            req.user = id;
            next();
        } catch (err) {
            res.status(403).json({ message: 'Token invalide' });
        } 
    }

    

    async login(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            });
        }

        try {
            const { email, motdepasse } = req.body;
            const chauffeur = await Chauffeurs.findOne({ 'info.email': email, 'info.securites.isverified': true });

            if (!chauffeur) {
                 res.status(404).json({ error: 'chauffeur non trouvé' });
                 return
            }

            const match = await bcrypt.compare(motdepasse, chauffeur.info.motdepasse);
            if (!match) {
                 res.status(400).json({ error: 'Mot de passe incorrect' });
                 return
            }

            const token = Fonction.createtokenetcookies(res, chauffeur._id);

            res.status(200).json({
                success: true,
                chauffeur: {
                    _id: chauffeur._id,
                    info: {
                        nom: chauffeur.info.nom_complet,
                        prenom: chauffeur.info.email,
                        email: chauffeur.info.telephone
                    }
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la connexion' });
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

    async forgetpassword(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const { email } = req.body;
            const chauffeur = await Chauffeurs.findOne({ 'info.email': email });
            if (!chauffeur) {
                 res.status(404).json({ error: 'chauffeur non trouvé' });
                 return
            }
            const resetToken = crypto.randomBytes(20).toString("hex");
            const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
            chauffeur.resetPasswordToken = resetToken;
            chauffeur.resetPasswordTokenExpire = resetTokenExpiresAt;
            await chauffeur.save();
            Fonction.sendmail(email, 'password', resetToken);
            res.status(200).json({
                success: true,
                message: 'email envoyé avec succès'
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de l\'envoi du mail de réinitialisation' });
        } 
    }

    async resetpassword(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const { token } = req.params;
            const { motdepasse } = req.body;
            const chauffeur = await Chauffeurs.findOne({
                resetPasswordToken: token,
                resetPasswordTokenExpire: { $gt: Date.now() },
            });

            if (!chauffeur || !chauffeur.info) {
                 res.status(400).json({ success: false, message: "Token de réinitialisation invalide ou expiré" });
                 return
            }
            const hashedPassword = await bcrypt.hash(motdepasse, 10);
            chauffeur.info.motdepasse = hashedPassword;
            chauffeur.resetPasswordToken = undefined;
            chauffeur.resetPasswordTokenExpire = undefined as any;
            await chauffeur.save();

            res.status(200).json({ success: true, message: "Mot de passe réinitialisé avec succès" });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
        } 
    }

    async Signup(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const { email } = req.body.info;
            const chauffeur = new Chauffeurs(req.body);
            const chauffeurExistant = await Chauffeurs.findOne({ 'info.email': email });

            if (chauffeurExistant || !chauffeur.info || !chauffeur.info.motdepasse) {
                 res.status(400).json({ error: 'Un chauffeur avec cet email existe déjà' });
                 return
            }
            const Code: string = Fonction.generecode();
            chauffeur.securites = {
                code: Code,
                date: new Date(),
                isverified: false,
            };
            chauffeur.info.motdepasse = await bcrypt.hash(chauffeur.info.motdepasse, 10);
            const savedChauffeur = await chauffeur.save();
            const token = Fonction.createtokenetcookies(res, savedChauffeur._id);
            await Fonction.sendmail(email, 'Inscription', Code);
            res.status(201).json({
                chauffeur: {
                    _id: savedChauffeur._id,
                    info: {
                        nom: savedChauffeur.info.nom_complet,
                        prenom: savedChauffeur.info.email,
                        email: savedChauffeur.info.telephone
                    }
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la création du chauffeur' });
        } 
    }

    

    

    async renvoyeruncode(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const id = req.user;
            const chauffeur = await Chauffeurs.findById(id);
            if (!chauffeur) {
                 res.status(404).json({ error: 'chauffeur non trouvé' });
                 return
            }
            const Code: string = Fonction.generecode();
            chauffeur.securites = {
                code: Code,
                date: new Date(),
                isverified: false,
            };
            await chauffeur.save();
            await Fonction.sendmail(chauffeur.info.email, 'Inscription', Code);
            res.status(200).json({
                success: true,
                message: 'email envoyé avec succès'    
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
        } 
    }

    async VeriffieEmail(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const id = req.user;
            const { code } = req.body;
            const chauffeur = await Chauffeurs.findOne({
                '_id': id,
                'securites.code': code,
                'securites.date': { $gt: new Date(Date.now() - 15 * 60 * 1000) }
            });

            if (!chauffeur) {
                 res.status(400).json({
                    success: false,
                    message: 'Le code est invalide ou a expiré'
                });
                return
            }

            chauffeur.securites = {
                isverified: true
            } as any;

            await chauffeur.save();
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

    async createChauffeur(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const chauffeur = new Chauffeurs(req.body);
            const savedChauffeur = await chauffeur.save();
            res.status(201).json(savedChauffeur);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la création du chauffeur' });
        } 
    }

    async getAllChauffeurs(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const chauffeurs = await Chauffeurs.find();
            if (!chauffeurs || chauffeurs.length === 0) {
                 res.status(404).json({ error: 'Aucun chauffeur trouvé' });
                 return
            }
            res.status(200).json(chauffeurs);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération des chauffeurs' });
        } 
    }

    async getChauffeurById(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const chauffeur = await Chauffeurs.findById(req.params.id);
            if (!chauffeur) {
                 res.status(404).json({ error: 'Chauffeur non trouvé' });
                 return
            }
            res.status(200).json(chauffeur);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération du chauffeur' });
        } 
    }

    async updateChauffeur(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const chauffeur = await Chauffeurs.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!chauffeur) {
                 res.status(404).json({ error: 'Chauffeur non trouvé' });
                 return
            }
            res.status(200).json(chauffeur);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la mise à jour du chauffeur' });
        } 
    }

    async deleteChauffeur(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        try {
            const chauffeur = await Chauffeurs.findByIdAndDelete(req.params.id);
            if (!chauffeur) {
                 res.status(404).json({ error: 'Chauffeur non trouvé' });
                return
            }
            res.status(200).json(chauffeur);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la suppression du chauffeur' });
        } 
    }
}

export const controllerchauffeurInstance = new controllerchauffeur();