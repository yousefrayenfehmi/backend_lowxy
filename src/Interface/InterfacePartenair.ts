import { Types } from "mongoose";

interface IPartenaire extends Document {
    _id: Types.ObjectId;
    inforamtion: {
        inforegester: {
            nom_entreprise: string;
            Proprietaire: string;
            email: string;
            telephone: string;
            motdepasse: string;
        };
        info_societe: {
            numero_serie?: string;
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
    covering_ads: Array<{
        _id: Types.ObjectId;
        modele_voiture: string;
        type_covering: string;
        image: string;
        nombre_taxi: number;
        nombre_jour: number;
        prix: number;
    }>;
    pub_quiz: Array<{
        _id: Types.ObjectId;
        bannieres: string[];
        videos: string[];
        call_to_action: string[];
        keywords: string[];
        periode: {
            debut: Date;
            fin: Date;
        };
        statu: string;
        Budget_totale: number;
        impressions: number;
        clicks: number;
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