import { Types } from "mongoose";

interface IChauffeurs extends Document {
    _id: Types.ObjectId
    info: {
        nom_complet: string;
        email: string;
        telephone: string;
        motdepasse: string;
        strategy?: string;
        google_id?: string;
        naissance?: Date;
        adresse: {
            ville?: string;
            pays?: string;
        };
        facebook_id?: string;
        matricule?: string;
        Rib?: string;
    };
    vehicule: {
        matricule?: string;
        modele?: string;
        places?: number;
    };
    documents: {
        permis: {
            numero?: string;
            expiration?: Date;
            imagePath?: string; // New field for permis image path
        };
        assurance: {
            nom?: string;
            numero?: string;
            expiration?: Date;
            imagePath?: string; // New field for assurance image path
        };
        carte_taxi: {
            numero?: string;
            expiration?: Date;
            imagePath?: string; // New field for carte taxi image path
        };
    };
    securites: {
        code?: string;
        date?: Date;
        isverified: boolean;
    };
    resetPasswordToken?: string;
    resetPasswordTokenExpire?: Date;
}

  export default IChauffeurs;