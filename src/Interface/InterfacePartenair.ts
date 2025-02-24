import { Types } from "mongoose";

interface IPartenaire extends Document {
    _id: Types.ObjectId;
    inforamtion: {
        inforegester: {
            nom_entreprise: string;
            Propriétaire: string;
            email: string;
            telephone: string;
            motdepasse: string;
        };
        info_societe: {
            numero_serie: string;
            domaines: string[];
            adresse: {
                pays: string;
                ville: string;
                rue: string;
            };
        };
    };
    tours: Array<{
        nom: string;
        description: string;
        ville: string;
        duree: number;
        itineraire: {
            depart: string;
            arrivee: string;
            plan: string;
        };
        jours: Array<{
            date: Date;
            depart: string;
            capacite: {
                adultes: number;
                enfants: number;
            };
            prix: number;
            supplements: string[];
        }>;
        reservations: Array<{
            client_id: Types.ObjectId;
            date: Date;
            participants: {
                adultes: number;
                enfants: number;
            };
            prix_total: number;
        }>;
    }>;
    publicites: Array<{
        contenu: {
            bannieres: string[];
            videos: string[];
        };
        config: {
            taille: string;
            duree: number;
            nbrTaxi: number;
        };
        periode: {
            debut: Date;
            fin: Date;
        };
        chauffeurs: Array<{
            chauffeur_id: Types.ObjectId;
            date_debut: Date;
        }>;
    }>;
    pub_quiz: Array<{
        bannieres: string[];
        videos: string[];
        call_to_action: string[];
        keywords: string[];
        periode: {
            debut: Date;
            fin: Date;
        };
    }>;
    securites: {
        code?: string;
        date?: Date;
        isverified: boolean;
    };
    resetPasswordToken?: string;
    resetPasswordTokenExpire?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export default IPartenaire;