import { NextFunction, Request, Response } from "express";
import { Admin } from "../models/Admin";
import { dbConnection } from "../BDconnection/BDconnection";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import Fonction from "../fonction/Fonction";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { promises } from "dns";

class Controlleradmin {
    async Signup(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        const { email } = req.body;
        const admin = new Admin(req.body);

        try {
            const adminExistant = await Admin.findOne({ 'email': email });
            
            if (adminExistant) {
                 res.status(400).json({ error: 'Un admin avec cet email existe déjà' });
                 return
            }
            
            const Code: string = Fonction.generecode(100000,900000);
            
            admin.securites = {
                code: Code,
                date: new Date(),
                isverified: false,
            };
            admin.isAdmin = false;
            
            admin.mot_de_passe = await bcrypt.hash(admin.mot_de_passe, 10);

            const savedAdmin = await admin.save();
            const token = Fonction.createtokenetcookies(res, savedAdmin._id);
            
            await Fonction.sendmail(email, 'Inscription', Code);
            
            res.status(201).json({ 
                admin: {
                    _id: savedAdmin._id,
                    info: {
                        nom_complet: savedAdmin.nom_complet,
                        email: savedAdmin.email,
                        tel: savedAdmin.tel
                    }
                }, 
                token 
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la création de l\'admin' });
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
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        const { email, mot_de_passe } = req.body;

        try {
            const admin = await Admin.findOne({ 
                'email': email,
                'securites.isverified': true,
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
                        tel: admin.tel
                    }
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la connexion' });
        } 
    }

    async renvoyeruncode(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        const id = req.user;

        try {
            const admin = await Admin.findById(id);
            if (!admin) {
                 res.status(404).json({ error: 'Admin non trouvé' });
                 return
            }
            const Code: string = Fonction.generecode(100000,900000);;
            admin.securites = {
                code: Code,
                date: new Date(),
                isverified: false,
            };
            await admin.save();
            await Fonction.sendmail(admin.email, 'Inscription', Code);
            res.status(200).json({
                success: true,
                message: 'Email envoyé avec succès'    
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

        const id = req.user;
        const { code } = req.body;

        try {
            const admin = await Admin.findOne({
                '_id': id,
                'securites.code': code,
                'securites.date': { $gt: new Date(Date.now() - 15 * 60 * 1000) }
            });
            
            if (!admin) {
                 res.status(400).json({
                    success: false,
                    message: 'Le code est invalide ou a expiré'
                });
                return
            }
            
            admin.securites = {
                isverified: true
            };
            
            await admin.save();
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

    async forgetpassword(req: Request, res: Response):Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                 res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                 return
            });
        }

        const { email } = req.body;

        try {
            const admin = await Admin.findOne({ 'email': email });
            
            if (!admin) {
                 res.status(404).json({ error: 'Admin non trouvé' });
                 return
            }
            
            const resetToken = crypto.randomBytes(20).toString("hex");
            const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
            
            admin.resetPasswordToken = resetToken;
            admin.resetPasswordTokenExpire = resetTokenExpiresAt;
            
            await admin.save();
            
            await Fonction.sendmail(email, 'password', resetToken);
            
            res.status(200).json({
                success: true,
                message: 'Email envoyé avec succès'
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

        const { token } = req.params;
        const { motdepasse } = req.body;

        try {
            const admin = await Admin.findOne({
                resetPasswordToken: token,
                resetPasswordTokenExpire: { $gt: Date.now() },
            });
            
            if (!admin) {
                 res.status(400).json({ 
                    success: false, 
                    message: "Token de réinitialisation invalide ou expiré" 
                });
                return
            }
            
            const hashedPassword = await bcrypt.hash(motdepasse, 10);
            
            admin.mot_de_passe = hashedPassword;
            admin.resetPasswordToken = undefined;
            admin.resetPasswordTokenExpire = undefined as any;
            
            await admin.save();
            
            res.status(200).json({ 
                success: true, 
                message: "Mot de passe réinitialisé avec succès" 
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
        } 
    }

    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
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
            const admin = await Admin.findById(id);
            
            if (!admin) {
                res.status(401).json({ message: 'Admin non trouvé' });
                return;
            }
            
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

        const admin = new Admin(req.body);

        try {
            const savedAdmin = await admin.save();
            res.status(201).json(savedAdmin);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la création de l\'admin' });
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
            res.status(500).json({ error: 'Erreur lors de la recherche de l\'admin' });
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
            res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'admin' });
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
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'admin' });
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
}

export const controllerAdminInstance = new Controlleradmin();