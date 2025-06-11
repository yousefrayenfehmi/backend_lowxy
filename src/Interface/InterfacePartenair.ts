import { Document, Types } from "mongoose";

export interface IPartenaire extends Document {
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
            domaines?: string[];
            adresse: {
                pays?: string;
                ville?: string;
                rue?: string;
            };
        };
    };
    tours: Array<{
        _id?: Types.ObjectId;
        nom: string;
        description: string;
        ville: string;
        duree: number;
        itineraire: {
            depart: string;
            arrivee: string;
            plan: string;
        };
        commission: number;
        images: string[];
        jours: Array<{
            _id?: Types.ObjectId;
            date: Date;
            depart: string;
            capacite: {
                adultes: number;
                enfants: number;
            };
            prix: {
                adulte: number;
                enfant: number;
            };
            supplements: string[];
            reservations: Array<{
                _id?: Types.ObjectId;
                client_id: Types.ObjectId;
                date: Date;
                participants: {
                    adultes: number;
                    enfants: number;
                };
                prix_total: number;
                statut: 'en attente de paiement' | 'confirmée' | 'annulée';
                payment_id?: string;
                payment_date?: Date;
            }>;
        }>;
    }>;
    covering_ads: Array<{
        _id?: Types.ObjectId;
        image: string;
        modele_voiture: string;
        type_covering: string;
        nombre_taxi: number;
        nombre_jour: number;
        prix: number;
    }>;
    pub_quiz: Array<{
        _id?: Types.ObjectId;
        bannieres: string[];
        videos: string[];
        call_to_action: string[];
        keywords: any[];
        periode: {
            debut: Date;
            fin: Date;
        };
        Budget_totale: number;
        statu: string;
        impressions: number;
        clicks: number;
        facturation?: string;
    }>;
    securites: {
        code?: string;
        date?: Date;
        isverified: boolean;
    };
    resetPasswordToken?: string;
    resetPasswordTokenExpire?: Date;
}