import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Touristes } from '../models/Touriste';

interface AuthRequest extends Request {
  touriste?: { _id: string };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt') as { id: string };
    const touriste = await Touristes.findById(decoded.id);

    if (!touriste) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    req.touriste = { _id: touriste._id.toString() };
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
}; 