import mongoose, { Schema } from "mongoose";

// Sous-schéma pour les sous-catégories
const SubcategorySchema = new Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    selected: {
        type: Boolean,
        default: false
    },
    popular: {
        type: Boolean,
        default: false
    }
});

// Schéma principal pour les catégories
const CategorySchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    subcategories: [SubcategorySchema]
}, {
    timestamps: true
});

// Définition des index
CategorySchema.index({id: 1}, {unique: true});
CategorySchema.index({_id: 1}, {unique: true});
CategorySchema.index({name: 1});

const CategoryModel = mongoose.model('Category', CategorySchema);

export const Category = CategoryModel;