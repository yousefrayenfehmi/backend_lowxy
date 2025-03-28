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
import mongoose, { Types } from 'mongoose';

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
            console.log(email, motdepasse);
            
            const chauffeur = await Chauffeurs.findOne({ 'info.email': email, 'securites.isverified': true });
            console.log(chauffeur);
            
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
                        email: chauffeur.info.email,
                        telephone: chauffeur.info.telephone,
                        matricule: chauffeur.info.matricule
                    }
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la connexion' });
        } 
    }

    async authavecgoogle(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
        })
    }
    try {
        const {email}=req.body.info;
        const chauffeur=await Chauffeurs.findOne({'info.email':email});
        if(chauffeur && chauffeur.info.strategy!=='google'){
            res.status(400).json({ error: 'Un chauffeur avec cet email existe déjà' });
                return;
        }
        else if(chauffeur && chauffeur.info.strategy==='google'){
            const token=Fonction.createtokenetcookies(res, chauffeur._id);
            res.status(201).json({ success: true, chauffeur: chauffeur, token: token });
        }

        const chauffeure = new Chauffeurs(req.body);
        chauffeure.info.strategy="google";
        chauffeure.info.motdepasse=await bcrypt.hash("google", 10);
        chauffeure.info.matricule="";
        chauffeure.securites.isverified=true;
        const savechauvveure=await chauffeure.save();
        if(savechauvveure){
            const matricule=Fonction.generermatricle();
            Fonction.sendmail(email, 'matricule', matricule);
            chauffeure.info.matricule=matricule;
            await chauffeure.save();
            const token=Fonction.createtokenetcookies(res, chauffeure._id);
            res.status(201).json({ success: true, chauffeur: chauffeure, token: token });
        }

        

    } catch (error) {
        console.log(error);
        
        res.status(500).json({ error: 'Erreur lors de la création du chauffeur' });

    }

}


async authavecfacebook(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
    })
}
try {
    const {email}=req.body.info;
    const chauffeur=await Chauffeurs.findOne({'info.email':email});
    if(chauffeur && chauffeur.info.strategy!=='facebook'){
        res.status(400).json({ error: 'Un chauffeur avec cet email existe déjà' });
            return;
    }
    else if(chauffeur && chauffeur.info.strategy==='facebook'){
        const token=Fonction.createtokenetcookies(res, chauffeur._id);
        res.status(201).json({ success: true, chauffeur: chauffeur, token: token });
    }
    const chauffeure = new Chauffeurs(req.body);
    chauffeure.info.strategy="facebook";
    chauffeure.info.motdepasse=await bcrypt.hash("google", 10);
    chauffeure.info.matricule="";
    chauffeure.securites.isverified=true;
    const savechauvveure=await chauffeure.save();

    if(savechauvveure){
        const matricule=Fonction.generermatricle();
        Fonction.sendmail(email, 'matricule', matricule);
        chauffeure.info.matricule=matricule;
        await chauffeure.save();
        const token=Fonction.createtokenetcookies(res, chauffeure._id);
        res.status(201).json({ success: true, chauffeur: chauffeure, token: token });
    }

    

} catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Erreur lors de la création du chauffeur' });

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
            const Code: string = Fonction.generecode(100000,900000);;
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
                chauffeur: savedChauffeur,
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
            const Code: string = Fonction.generecode(100000,900000);;
            chauffeur.securites.code = Code;
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


    async completerprofil(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
    
        try {
            const id = req.params.id;
            let chauffeur = await Chauffeurs.findById(id);
    
            if (!chauffeur) {
                res.status(404).json({ error: 'Chauffeur non trouvé' });
                return;
            }
    
            // Mise à jour sélective des champs
            const updateFields = {
                // Champs textuels simples
                'info.nom_complet': req.body.info?.nom_complet ?? chauffeur.info.nom_complet,
                'info.telephone': req.body.info?.telephone ?? chauffeur.info.telephone,
                
                // Champs de date
                'info.naissance': req.body.info?.naissance ?? chauffeur.info.naissance,
                
                // Adresse imbriquée
                'info.adresse': {
                    'ville': req.body.info?.adresse?.ville ?? chauffeur.info.adresse.ville,
                    'pays': req.body.info?.adresse?.pays ?? chauffeur.info.adresse.pays
                },
                
                // Champs additionnels
                'info.Rib': req.body.info?.Rib ?? chauffeur.info.Rib,
            };
            
    
            // Mise à jour partielle
            const updatedChauffeur = await Chauffeurs.findByIdAndUpdate(
                id, 
                { $set: updateFields }, 
                { 
                    new: true,  // Retourne le document mis à jour
                    runValidators: true  // Valide les champs mis à jour
                }
            );
    
            if (!updatedChauffeur) {
                res.status(404).json({ error: 'Chauffeur non trouvé' });
                return;
            }
    
            res.status(200).json({
                message: 'Profil mis à jour avec succès',
                chauffeur: updatedChauffeur
            });
    
        } catch (error) {
            console.error('Erreur lors de la mise à jour du chauffeur:', error);
            res.status(500).json({ 
                error: 'Erreur lors de la mise à jour du chauffeur'
                
            });
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
            let matricule=Fonction.generermatricle();
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
            while(await Chauffeurs.findOne({info:{matricule:matricule}})){
                matricule=Fonction.generermatricle();
            }

            chauffeur.securites = {
                isverified: true
            } as any;

            chauffeur.info.matricule=matricule

            await chauffeur.save();
            Fonction.sendmail(chauffeur.info.email, 'matricule', matricule);
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
            const user = await Chauffeurs.findById(id);
    
            if (!user) {
                 res.status(404).json({ message: 'Chauffeur non trouvé' });
                 return
            }
    
            // Check if the current password matches
            const isMatch = await bcrypt.compare(currentPassword, user.info.motdepasse);
            if (!isMatch) {
                 res.status(400).json({ message: 'Current password is incorrect' });
                 return
            }
    
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.info.motdepasse = hashedPassword;
            await user.save();
    
            res.status(200).json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'An error occurred while changing the password' });
        }
    }
    
    
    
    async getChauffeurByToken(req: Request, res: Response): Promise<void> {
        try {
            if (mongoose.connection.readyState !== 1) {
                await dbConnection.getConnection();
            }
    
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
    
            if (!token) {
                 res.status(401).json({ message: 'Token manquant' });
                return
            }
    
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
            const chauffeur = await Chauffeurs.findById(id).select('-motdepasse'); // Exclure le mot de passe
    
            if (!chauffeur) {
                
                 res.status(404).json({ message: 'Chauffeur non trouvé' });
                 return
            }
    
            res.status(200).json(chauffeur);
        } catch (err) {
             res.status(403).json({ message: 'Token invalide' });
             return
        }
    }
}

export const controllerchauffeurInstance = new controllerchauffeur();