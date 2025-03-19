import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Preferences';
import  {dbConnection} from '../BDconnection/BDconnection';

export class CategoryController {
    // CREATE - Créer une nouvelle catégorie
    async createCategory(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const newCategory = new Category(req.body);
            const savedCategory = await newCategory.save();
            res.status(201).json(savedCategory);
        } catch (error) {
            console.log(error);

            res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
        }
    }

    // READ ALL - Récupérer toutes les catégories
    async getAllCategories(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const categories = await Category.find();
            res.status(200).json(categories);
        } catch (error) {
            
            res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
        }
    }

    // READ ONE - Récupérer une catégorie par ID
    async getCategoryById(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                res.status(404).json({ error: 'Catégorie non trouvée' });
                return;
            }
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération de la catégorie' });
        }
    }

    // READ ONE BY CUSTOM ID - Récupérer une catégorie par ID personnalisé
    async getCategoryByCustomId(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const category = await Category.findOne({ id: req.params.customId });
            if (!category) {
                res.status(404).json({ error: 'Catégorie non trouvée' });
                return;
            }
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération de la catégorie' });
        }
    }

    // UPDATE - Mettre à jour une catégorie
    async updateCategory(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const updatedCategory = await Category.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!updatedCategory) {
                res.status(404).json({ error: 'Catégorie non trouvée' });
                return;
            }
            
            res.status(200).json(updatedCategory);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
        }
    }

    // DELETE - Supprimer une catégorie
    async deleteCategory(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const deletedCategory = await Category.findByIdAndDelete(req.params.id);
            
            if (!deletedCategory) {
                res.status(404).json({ error: 'Catégorie non trouvée' });
                return;
            }
            
            res.status(200).json({ message: 'Catégorie supprimée avec succès' });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
        }
    }

    // ADD SUBCATEGORY - Ajouter une sous-catégorie à une catégorie existante
    async addSubcategory(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const category = await Category.findById(req.params.id);
            
            if (!category) {
                res.status(404).json({ error: 'Catégorie non trouvée' });
                return;
            }
            
            category.subcategories.push(req.body);
            await category.save();
            
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de l\'ajout de la sous-catégorie' });
        }
    }

    // REMOVE SUBCATEGORY - Supprimer une sous-catégorie
    async removeSubcategory(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            try {
                await dbConnection.getConnection();
            } catch (error) {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            }
        }

        try {
            const category = await Category.findById(req.params.categoryId);
            
            if (!category) {
                res.status(404).json({ error: 'Catégorie non trouvée' });
                return;
            }
            
            // Trouver l'index de la sous-catégorie à supprimer
            const subcategoryIndex = category.subcategories.findIndex(
                sub => sub.id === req.params.subcategoryId
            );
            
            if (subcategoryIndex === -1) {
                res.status(404).json({ error: 'Sous-catégorie non trouvée' });
                return;
            }
            
            // Supprimer la sous-catégorie et sauvegarder
            category.subcategories.splice(subcategoryIndex, 1);
            await category.save();
            
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la suppression de la sous-catégorie' });
        }
    }
}

export const categoryController = new CategoryController();