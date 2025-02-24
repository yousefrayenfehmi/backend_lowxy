import { NextFunction, Request, Response } from "express";
import { dbConnection } from "../BDconnection/BDconnection";
import { Touristes } from "../models/Touriste";
import Fonction from "../fonction/Fonction";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import passport from "passport";
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';

class controllerclient {
    constructor() {
        dotenv.config({ path: path.resolve(__dirname, '../.env') });
        this.facebookStrategy();
    }

    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }
    
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
    
        if (!token) {
            res.status(401).json({ message: 'Token manquant' });
            return;
        }
    
        try {
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
            
            const touriste = await Touristes.findById(id);
            
            if (!touriste) {
                res.status(401).json({ message: 'Client non trouvé' });
                return;
            }
            
            req.user = id;
            next();
        } catch (err) {
            res.status(403).json({ message: 'Token invalide' });
        } 
    }

    async facebookStrategy() {
        passport.use(new FacebookStrategy({
            clientID: process.env.FACEBOOK_APP_ID as string,
            clientSecret: process.env.FACEBOOK_APP_SECRET as string,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL as string,
            profileFields: ['id', 'displayName', 'photos', 'email']
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            if (mongoose.connection.readyState !== 1) {
                try {
                    await dbConnection.getConnection();
                } catch (error) {
                    return done(error, null);
                }
            }

            try {
                const existingTouriste = await Touristes.findOne({ 'info.facebookId': profile.id });
                
                if (existingTouriste) {
                    return done(null, existingTouriste);
                }

                const touriste = new Touristes({
                    info: {
                        nom_complet: profile.displayName,
                        email: profile.emails ? profile.emails[0].value : '',
                        facebookId: profile.id,
                        motdepasse: bcrypt.hashSync("facebook", 10),
                        strategy: 'facebook',
                        telephone: '',
                        adresse: {
                            ville: '',
                            pays: ''
                        }
                    },
                    securites: {
                        isverified: true
                    }
                });

                await touriste.save();
                return done(null, touriste);
            } catch (error) {
                return done(error, null);
            }
        }));
    }

    

    

    async logout(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
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

    async login(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const { email, motdepasse } = req.body;
            const touriste = await Touristes.findOne({ 'info.email': email, 'securites.isverified': true });

            if (!touriste || !touriste.info || !touriste.info.motdepasse) {
                res.status(404).json({ error: 'touriste non trouvé' });
                return;
            }

            const match = await bcrypt.compare(motdepasse, touriste.info.motdepasse);
            if (!match) {
                res.status(400).json({ error: 'Mot de passe incorrect' });
                return;
            }

            const token = Fonction.createtokenetcookies(res, touriste._id);

            res.status(200).json({
                success: true,
                touriste: {
                    _id: touriste._id,
                    info: {
                        nom_complet: touriste.info.nom_complet,
                        email: touriste.info.email,
                        telephone: touriste.info.telephone
                    }
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la connexion' });
        }
    }

    async forgetpassword(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const { email } = req.body;
            const touriste = await Touristes.findOne({ 'info.email': email });

            if (!touriste) {
                res.status(404).json({ error: 'touriste non trouvé' });
                return;
            }

            const resetToken = crypto.randomBytes(20).toString("hex");
            const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
            touriste.resetPasswordToken = resetToken;
            touriste.resetPasswordTokenExpire = resetTokenExpiresAt;

            await touriste.save();
            Fonction.sendmail(email, 'password', "kmslqdkmlskfmdsfkmdskf");

            res.status(200).json({
                success: true,
                message: 'email envoyé avec success'
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de l\'envoi du mail de réinitialisation' });
        }
    }

    async resetpassword(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const { token } = req.params;
            const { motdepasse } = req.body;

            const touriste = await Touristes.findOne({
                resetPasswordToken: token,
                resetPasswordTokenExpire: { $gt: Date.now() },
            });

            if (!touriste || !touriste.info) {
                res.status(400).json({ success: false, message: "Invalid or expired reset token" });
                return;
            }

            const hashedPassword = await bcrypt.hash(motdepasse, 10);
            touriste.info.motdepasse = hashedPassword;
            touriste.resetPasswordToken = undefined;
            touriste.resetPasswordTokenExpire = undefined as any;

            await touriste.save();

            res.status(200).json({ success: true, message: "Password reset successful" });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
        }
    }

    async renvoyeruncode(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const id = req.user;
            const touriste = await Touristes.findById(id);

            if (!touriste) {
                res.status(404).json({ error: 'touriste non trouvé' });
                return;
            }

            const Code: string = Fonction.generecode();
            touriste.securites = {
                code: Code,
                date: new Date(),
                isverified: false,
            };

            await touriste.save();
            Fonction.sendmail(touriste.info.email, 'Inscription', Code);

            res.status(200).json({
                success: true,
                message: 'email envoyé avec success'
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de l\'envoi du nouveau code' });
        }
    }

    async Signup(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const { email } = req.body.info;
            const touristeExistant = await Touristes.findOne({ 'info.email': email });

            if (touristeExistant) {
                res.status(400).json({ error: 'Un touriste avec cet email existe déjà' });
                return;
            }

            const touriste = new Touristes(req.body);
            const Code: string = Fonction.generecode();
            touriste.securites = {
                code: Code,
                date: new Date(),
                isverified: false,
            };
            touriste.info.strategy = "local";
            touriste.info.motdepasse = await bcrypt.hash(touriste.info.motdepasse, 10);

            const savedTouriste = await touriste.save();
            const token = Fonction.createtokenetcookies(res, savedTouriste._id);
            await Fonction.sendmail(email, 'Inscription', Code);
            
            res.status(201).json({
                touriste: {
                    _id: savedTouriste._id,
                    info: {
                        nom_complet: savedTouriste.info.nom_complet,
                        email: savedTouriste.info.email,
                        tel: savedTouriste.info.telephone
                    }
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la création du touriste' });
        }
    }

    async VeriffieEmail(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const id = req.user;
            const { code } = req.body;

            const tourist = await Touristes.findOne({
                '_id': id,
                'securites.code': code,
                'securites.date': { $gt: new Date(Date.now() - 15 * 60 * 1000) }
            });

            if (!tourist) {
                res.status(400).json({
                    success: false,
                    message: 'Le code est invalide ou a expiré'
                });
                return;
            }

            tourist.securites = {
                isverified: true
            };

            await tourist.save();
            
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

    async createTouristes(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const touriste = new Touristes(req.body);
            const savedTouriste = await touriste.save();
            res.status(201).json(savedTouriste);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la création du touriste' });
        }
    }

    async getAllTouristes(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const touristes = await Touristes.find();
            res.status(200).json(touristes);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération des touristes' });
        }
    }

    async getTouristeById(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const touriste = await Touristes.findById(req.params.id);
            if (!touriste) {
                res.status(404).json({ error: 'touriste non trouvé' });
                return;
            }
            res.status(200).json(touriste);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération du touriste' });
        }
    }

    async updateTouriste(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const touriste = await Touristes.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!touriste) {
                res.status(404).json({ error: 'touriste non trouvé' });
                return;
            }
            res.status(200).json(touriste);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la mise à jour du touriste' });
        }
    }

    async deleteTouriste(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const touriste = await Touristes.findByIdAndDelete(req.params.id);
            if (!touriste) {
                res.status(404).json({ error: 'touriste non trouvé' });
                return;
            }
            res.status(200).json(touriste);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la suppression du touriste' });
        }
    }
}

export const controllerclientInstance = new controllerclient();