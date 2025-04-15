import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

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
}

export const VerifierTokenInstance = new VerifierToken();