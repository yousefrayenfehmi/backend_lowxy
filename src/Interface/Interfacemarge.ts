import { Document } from 'mongoose';

export interface TourMarge {
    _id?: string;
    tourId: string;
    pourcentage: number;  // Valeur entre 0 et 100
    montantFixe?: number; // Montant fixe optionnel (valeur par défaut: 0)
    dateModification: Date;
    modifiePar: string;  // ID ou nom de l'administrateur qui a modifié
    actif: boolean;     // Si cette marge est active (valeur par défaut: true)
  }

