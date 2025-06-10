import { Document } from 'mongoose';



export interface IEvenement {
    nom: string;
    date: string;
    description: string;
}

export interface IPhotos {
    photo_principale: string;
    galerie_photos: string[];
}
export interface ILieuTouristique {
    nom: string;
    description: string;
    adresse: string;
    photo: IPhotos;
}

export interface IGastronomie {
    plat: string;
    description: string;
    photo: IPhotos;
}
 export interface IHotel {
    nom: string;
    adresse: string;
    categorie: string;
    contact: string;
    photos: IPhotos;
}

 export interface IRestaurant {
    nom: string;
    adresse: string;
    specialite: string;
    contact: string;
    photos: IPhotos;
}

export interface IVilleArticle extends Document {
    ville: {
        nom: string;
        region: string;
        pays: string;
    };
    contenu: {
        titre: string;
        description: string;
        histoire: string;
        culture: string;
        lieux_touristiques: ILieuTouristique[];
        gastronomie: IGastronomie[];
        evenements: IEvenement[];
    };
    informations_pratiques: {
        hotels_recommandes: IHotel[];
        restaurants_recommandes: IRestaurant[];
    };
    
    medias: {
        photos: string[];
        videos: string[];
    };
    meta: {
        nombre_vues: number;
        derniere_mise_a_jour: Date;
    };
    crèepar:string;
}