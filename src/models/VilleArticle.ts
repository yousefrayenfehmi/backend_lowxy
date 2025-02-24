import mongoose, { Schema, Document } from 'mongoose';
import { IVilleArticle, ILieuTouristique, IGastronomie, IEvenement, IPhotos, IHotel, IRestaurant } from '../Interface/InterfaceVilleAticle.'; 



const EvenementSchema = new Schema<IEvenement>({
    nom: { type: String, required: true },
    date: { type: String, required: true },
    description: { type: String }
});

const PhotosSchema = new Schema<IPhotos>({
    photo_principale: { type: String },
    galerie_photos: [{ type: String }]
});
const LieuTouristiqueSchema = new Schema<ILieuTouristique>({
    nom: { type: String, required: true },
    description: { type: String },
    adresse: { type: String },
    photo: { type: PhotosSchema }
});

const GastronomieSchema = new Schema<IGastronomie>({
    plat: { type: String, required: true },
    description: { type: String },
    photo:{ type: PhotosSchema }
});
const HotelSchema = new Schema<IHotel>({
    nom: { type: String, required: true },
    adresse: { type: String, required: true },
    categorie: { type: String },
    contact: { type: String },
    photos: { type: PhotosSchema }
});

const RestaurantSchema = new Schema<IRestaurant>({
    nom: { type: String, required: true },
    adresse: { type: String, required: true },
    specialite: { type: String },
    contact: { type: String },
    photos: { type: PhotosSchema }
});

// Schéma principal
const VilleArticleSchema = new Schema<IVilleArticle>({
    ville: {
        nom: { type: String, required: true },
        region: { type: String, required: true },
        pays: { type: String, required: true }
    },
    contenu: {
        titre: { type: String, required: true },
        description: { type: String },
        histoire: { type: String },
        culture: { type: String },
        lieux_touristiques: [LieuTouristiqueSchema],
        gastronomie: [GastronomieSchema],
        evenements: [EvenementSchema]
    },
    informations_pratiques: {
        hotels_recommandes: [HotelSchema],
        restaurants_recommandes: [RestaurantSchema]
    },
    medias: {
        photos: [{ type: String }],
        videos: [{ type: String }]
    },
    meta: {
        nombre_vues: { type: Number, default: 0 },
        derniere_mise_a_jour: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

// Création du modèle
export const VilleArticle = mongoose.model<IVilleArticle>('VilleArticle', VilleArticleSchema);