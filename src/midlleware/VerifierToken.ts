import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface DecodedToken {
  userId: string;
  // Ajoutez d'autres propriétés selon la structure de votre token
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;
  
    if (!token) {
      res.status(401).json({ message: "Accès refusé. Token manquant." });
      return;
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
      
      // Vérifier que l'userId est un ObjectId valide
      if (!Types.ObjectId.isValid(decoded.userId)) {
        res.status(400).json({ message: "ID d'utilisateur invalide dans le token." });
        return;
      }
  
      // Ajouter les informations décodées à l'objet request
      (req as any).userId = decoded.userId;
      
      next();
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      res.status(403).json({ message: "Token invalide ou expiré." });
    }
  };

export default verifyToken;