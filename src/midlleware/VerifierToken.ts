import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface DecodedToken {
  userId: string;
  // Ajoutez d'autres propriétés selon la structure de votre token
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  console.log("Verifier Token Midleware")
  if (!token) {
    return res.status(401).json({ message: "Accès refusé. Token manquant." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    console.log('Decoded Token:', decoded);  // Log decoded token

    if (!Types.ObjectId.isValid(decoded.userId)) {
      return res.status(400).json({ message: "ID d'utilisateur invalide dans le token." });
    }

    // Attach decoded information to req.user
    (req as any).user = decoded
    console.log('User from decoded token:', decoded.userId);

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return res.status(403).json({ message: "Token invalide ou expiré." });
  }
};



export default verifyToken;