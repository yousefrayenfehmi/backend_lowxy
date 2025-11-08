"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = exports.CategoryController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Preferences_1 = require("../models/Preferences");
const BDconnection_1 = require("../BDconnection/BDconnection");
class CategoryController {
    // CREATE - Créer une nouvelle catégorie
    createCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const newCategory = new Preferences_1.Category(req.body);
                const savedCategory = yield newCategory.save();
                res.status(201).json(savedCategory);
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
            }
        });
    }
    // READ ALL - Récupérer toutes les catégories
    getAllCategories(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const categories = yield Preferences_1.Category.find();
                res.status(200).json(categories);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
            }
        });
    }
    // READ ONE - Récupérer une catégorie par ID
    getCategoryById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const category = yield Preferences_1.Category.findById(req.params.id);
                if (!category) {
                    res.status(404).json({ error: 'Catégorie non trouvée' });
                    return;
                }
                res.status(200).json(category);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération de la catégorie' });
            }
        });
    }
    // READ ONE BY CUSTOM ID - Récupérer une catégorie par ID personnalisé
    getCategoryByCustomId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const category = yield Preferences_1.Category.findOne({ id: req.params.customId });
                if (!category) {
                    res.status(404).json({ error: 'Catégorie non trouvée' });
                    return;
                }
                res.status(200).json(category);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération de la catégorie' });
            }
        });
    }
    // UPDATE - Mettre à jour une catégorie
    updateCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const updatedCategory = yield Preferences_1.Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
                if (!updatedCategory) {
                    res.status(404).json({ error: 'Catégorie non trouvée' });
                    return;
                }
                res.status(200).json(updatedCategory);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
            }
        });
    }
    // DELETE - Supprimer une catégorie
    deleteCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const deletedCategory = yield Preferences_1.Category.findByIdAndDelete(req.params.id);
                if (!deletedCategory) {
                    res.status(404).json({ error: 'Catégorie non trouvée' });
                    return;
                }
                res.status(200).json({ message: 'Catégorie supprimée avec succès' });
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
            }
        });
    }
    // ADD SUBCATEGORY - Ajouter une sous-catégorie à une catégorie existante
    addSubcategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const category = yield Preferences_1.Category.findById(req.params.id);
                if (!category) {
                    res.status(404).json({ error: 'Catégorie non trouvée' });
                    return;
                }
                category.subcategories.push(req.body);
                yield category.save();
                res.status(200).json(category);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de l\'ajout de la sous-catégorie' });
            }
        });
    }
    // REMOVE SUBCATEGORY - Supprimer une sous-catégorie
    removeSubcategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                try {
                    yield BDconnection_1.dbConnection.getConnection();
                }
                catch (error) {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                }
            }
            try {
                const category = yield Preferences_1.Category.findById(req.params.categoryId);
                if (!category) {
                    res.status(404).json({ error: 'Catégorie non trouvée' });
                    return;
                }
                // Trouver l'index de la sous-catégorie à supprimer
                const subcategoryIndex = category.subcategories.findIndex(sub => sub.id === req.params.subcategoryId);
                if (subcategoryIndex === -1) {
                    res.status(404).json({ error: 'Sous-catégorie non trouvée' });
                    return;
                }
                // Supprimer la sous-catégorie et sauvegarder
                category.subcategories.splice(subcategoryIndex, 1);
                yield category.save();
                res.status(200).json(category);
            }
            catch (error) {
                res.status(500).json({ error: 'Erreur lors de la suppression de la sous-catégorie' });
            }
        });
    }
}
exports.CategoryController = CategoryController;
exports.categoryController = new CategoryController();
