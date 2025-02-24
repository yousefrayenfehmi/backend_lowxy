import { Document, Types } from 'mongoose';

interface ITouriste extends Document {
    _id: Types.ObjectId;

    securites: {
        code?: string;
        date?: Date;
        isverified: boolean;
    };
    info: {
        nom_complet: string;
        email: string;
        motdepasse: string;
        telephone: string;
        naissance: Date;
        adresse: {
            ville: string;
            pays: string;
        };
        strategy:string
        google_id:string
    };
    resetPasswordToken?: string;
    resetPasswordTokenExpire?: Date | null;
    preferences: {
        langue?: string;
        langue_preferee?: string;
        centres_interet?: string[];
        activites?: string[];
    };
    pack_ia: {
        actif: boolean;
        mode?: 'Live' | 'Itinéraire Personnalisé';
        preferences?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

export default ITouriste;