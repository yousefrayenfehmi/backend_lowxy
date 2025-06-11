import mongoose, { Schema, Document } from 'mongoose';
import { IVilleArticle, ILieuTouristique, IGastronomie, IEvenement, IPhotos, IHotel, IRestaurant } from '../Interface/InterfaceVilleAticle.'; 



const EvenementSchema = new Schema<IEvenement>({
    nom: { type: String, required: false },
    date: { type: String, required: false },
    description: { type: String,required:false }
});

const PhotosSchema = new Schema<IPhotos>({
    photo_principale: { type: String,required:false },
    galerie_photos: [{ type: String,required:false }]
});
const LieuTouristiqueSchema = new Schema<ILieuTouristique>({
    nom: { type: String, required: false },
    description: { type: String },
    adresse: { type: String },
    photo: { type: PhotosSchema }
});

const GastronomieSchema = new Schema<IGastronomie>({
    plat: { type: String, required: false },
    description: { type: String,required:false },
    photo:{ type: PhotosSchema }
});
const HotelSchema = new Schema<IHotel>({
        nom: { type: String, required: false },
    adresse: { type: String, required: false },
    categorie: { type: String,required:false },
    contact: { type: String,required:false },
    photos: { type: PhotosSchema }
});

const RestaurantSchema = new Schema<IRestaurant>({
    nom: { type: String,required:false },
    adresse: { type: String,required:false },
    specialite: { type: String,required:false },
    contact: { type: String,required:false },
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
        description: { type: String,required:true },
        histoire: { type: String,required:true },
        culture: { type: String,required:true },
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
    crèepar: { type: String },
    meta: {
        nombre_vues: { type: Number, default: 0 },
        derniere_mise_a_jour: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

// Création du modèle
export const VilleArticle = mongoose.model<IVilleArticle>('VilleArticle', VilleArticleSchema);