import { Partenaires } from "../models/Partenaire";
import { dbConnection } from "../BDconnection/BDconnection";
import { NextFunction, Request, Response } from "express";
import Fonction from "../fonction/Fonction";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

class ControllerPartenaire {
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
            await Fonction.sendmail(email, 'password', resetToken);
            res.status(200).json({
                success: true,
                message: 'Email envoyé avec succès'
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de l\'envoi du mail de réinitialisation' });
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
}

export const ControllerpartenairInstance = new ControllerPartenaire();