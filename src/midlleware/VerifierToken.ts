import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Touristes } from '../models/Touriste';
import { Partenaires } from '../models/Partenaire';
import { Chauffeurs } from '../models/Chauffeure';

interface DecodedToken {
  userId: string;
  // Ajoutez d'autres propriétés selon la structure de votre token
}

class VerifierToken {
    verifyToken(req: Request, res: Response, next: NextFunction): void {
        console.log("Verifier Token Midleware");
        
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        console.log(token);
        
        console.log("Verifier Token Midleware")
        if (!token) {
            res.status(401).json({ message: "Accès refusé. Token manquant." });
            return;
        }
        try {
          const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
          console.log(decoded);
          
          const { id } = decoded as { id: string };
          req.user = id;
            next();
        } catch (error) {
            res.status(403).json({ message: "Token invalide ou expiré." });
        }
    }
   async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        console.log(token);
        
        console.log("Verifier Token Midleware")
        if (!token) {
            res.status(401).json({ message: "Accès refusé. Token manquant." });
            return;
        }
        else{
        }
        try {
            
            
            const touriste = await Touristes.findOne({resetPasswordToken: token})
            const partenaire = await Partenaires.findOne({resetPasswordToken: token})
            const chauffeur = await Chauffeurs.findOne({resetPasswordToken: token})
            if(touriste){
                res.status(200).json({
                    success: true,
                    user:'Touriste',
                    message: 'Token valide',
                    touriste: touriste
                });
            }
            if(partenaire){
                res.status(200).json({
                    success: true,
                    user:'Partenaire',
                    message: 'Token valide',
                    partenaire: partenaire
                });
            }
            if(chauffeur){
                res.status(200).json({
                    success: true,
                    user:'Chauffeur',
                    message: 'Token valide',
                    chauffeur: chauffeur
                });
            }
        } catch (error) {
            res.status(403).json({ message: "Token invalide ou expiré." });
        }
        
    }
}

export const VerifierTokenInstance = new VerifierToken();