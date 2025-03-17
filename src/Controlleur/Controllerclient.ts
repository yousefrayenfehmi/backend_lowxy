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
import mongoose, { Types } from 'mongoose';
import { Chauffeurs } from "../models/Chauffeure";

class controllerclient {
    constructor() {
        dotenv.config({ path: path.resolve(__dirname, '../.env') });
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

    
    async getTouristeByToken(req: Request, res: Response): Promise<void> {
        try {
            if (mongoose.connection.readyState !== 1) {
                await dbConnection.getConnection();
            }
    
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
    
            if (!token) {
                return res.status(401).json({ message: 'Token manquant' });
            }
    
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
    
            const touriste = await Touristes.findById(id).select('-motdepasse'); // Exclure le mot de passe
    
            if (!touriste) {
                return res.status(404).json({ message: 'Touriste non trouvé' });
            }
    
            res.status(200).json(touriste);
        } catch (err) {
            return res.status(403).json({ message: 'Token invalide' });
        }
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
            const resetToken = jwt.sign({ userId: touriste._id,type:'touriste' }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
            const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
            touriste.resetPasswordToken = resetToken;
            touriste.resetPasswordTokenExpire = resetTokenExpiresAt;

            await touriste.save();
            Fonction.sendmail(email, 'password', "http://localhost:4200/changepassword/" + resetToken);

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

   
    
    async changePassword(req: Request, res: Response): Promise<void> {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
    
        if (!token) {
            return res.status(401).json({ message: 'Token manquant' });
        }
    
        const { currentPassword, newPassword } = req.body;
    
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long' });
        }
    
        try {
            // Decode the token
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
            const { id } = decoded as { id: string };
    
            // Ensure the id is a valid ObjectId
            if (!Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid user ID in token' });
            }
    
            // Find the user by id, excluding the password
            const user = await Touristes.findById(id);
    
            if (!user) {
                return res.status(404).json({ message: 'Touriste non trouvé' });
            }
    
            // Check if the current password matches
            const isMatch = await bcrypt.compare(currentPassword, user.info.motdepasse);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
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
    
      

  async reenvoyeruncode(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }
    try {
        const id=req.user;
        const touriste = await Touristes.findOne({ '_id': id });

        if (!touriste) {
            res.status(404).json({ error: 'touriste non trouveè' });
            return;
        }
        const code = Fonction.generecode(100000, 999999);
        touriste.securites.code = code;
        Fonction.sendmail(touriste.info.email, 'Inscription', code.toString());
        await touriste.save();
        res.status(200).json({ success: true, message: 'Code envoyé avec success' });
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
            let touriste = await Touristes.findById(id);
    
            if (!touriste) {
                res.status(404).json({ error: 'Chauffeur non trouvé' });
                return;
            }
    
            // Mise à jour sélective des champs
            const updateFields = {
                // Champs textuels simples
                'info.nom_complet': req.body.info?.nom_complet ?? touriste.info.nom_complet,
                'info.telephone': req.body.info?.telephone ?? touriste.info.telephone,
                
                // Champs de date
                'info.naissance': req.body.info?.naissance ?? touriste.info.naissance,
                
                // Adresse imbriquée
                'info.adresse': {
                    'ville': req.body.info?.adresse?.ville ?? touriste.info.adresse.ville,
                    'pays': req.body.info?.adresse?.pays ?? touriste.info.adresse.pays
                },
                
                // Champs additionnels
                'info.Rib': req.body.info?.Rib ?? touriste.info.Rib
            };
            
    
            // Mise à jour partielle
            const updatedChauffeur = await Touristes.findByIdAndUpdate(
                id, 
                { $set: updateFields }, 
                { 
                    new: true,  // Retourne le document mis à jour
                    runValidators: true  // Valide les champs mis à jour
                }
            );
    
            if (!updatedChauffeur) {
                res.status(404).json({ error: 'touriste non trouvé' });
                return;
            }
    
            res.status(200).json({
                message: 'Profil mis à jour avec succès',
                chauffeur: updatedChauffeur
            });
    
        } catch (error) {
            console.error('Erreur lors de la mise à jour du touriste:', error);
            res.status(500).json({ 
                error: 'Erreur lors de la mise à jour du touriste'
                
            });
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
        const touriste=await Touristes.findOne({'info.email':email});

        if( touriste && touriste.info.strategy=='facebook'){
            res.status(400).json({ error: 'Un touriste avec cet email existe déjà' });
                return;
        }
        else if(touriste && touriste.info.strategy=='google'){
            const token=Fonction.createtokenetcookies(res,touriste._id);
            res.status(200).json({ success: true, touriste: touriste, token: token });
                return;
        }
        const touristee = new Touristes(req.body);
        touristee.info.strategy="google";
        touristee.info.motdepasse=await bcrypt.hash("google", 10);
        touristee.securites.isverified=true;
        await touristee.save();
        const token=Fonction.createtokenetcookies(res, touristee._id);
        res.status(201).json({ success: true, touriste: touristee, token: token });

    } catch (error) {
        console.log('Erreur lors de la création du touriste:', error);
        
        res.status(500).json({ error: 'Erreur lors de la création du touriste' });

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
        const touriste=await Touristes.findOne({'info.email':email});
        if(touriste && touriste.info.strategy=='google'){
            res.status(400).json({ error: 'Un touriste avec cet email existe déjà' });
                return;
        }
        else if(touriste && touriste.info.strategy=='facebook'){
            const token=Fonction.createtokenetcookies(res,touriste._id);
            res.status(200).json({ success: true, touriste: touriste, token: token });
                return;
        }
        const touristee = new Touristes(req.body);
        touristee.info.strategy="facebook";
        touristee.info.motdepasse=await bcrypt.hash("facebook", 10);
        touristee.securites.isverified=true;
        await touristee.save();
        const token=Fonction.createtokenetcookies(res, touristee._id);
        res.status(201).json({ success: true, touriste: touristee, token: token });

    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création du touriste' });

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
            /*
            const chauffeur=await Chauffeurs.findOne({ 'info.matricule': req.body.info.matricule_taxi });
            if (!chauffeur) {
                res.status(400).json({ error: "Un chauffeur avec cette matricule n'existe pas " });
                return;
            }*/

            const touriste = new Touristes(req.body);
            const Code: string = Fonction.generecode(100000,900000);;
            touriste.securites = {
                code: Code,
                date: new Date(),
                isverified: false,
            };
            touriste.info.strategy = "local";
            touriste.info.motdepasse = await bcrypt.hash(touriste.info.motdepasse, 10);
            touriste.info.matricule_taxi=req.body.info.matricule_taxi;
            const savedTouriste = await touriste.save();
            const token = Fonction.createtokenetcookies(res, savedTouriste._id);
            await Fonction.sendmail(email, 'Inscription', Code);
            
            res.status(201).json({
                touriste: savedTouriste,
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