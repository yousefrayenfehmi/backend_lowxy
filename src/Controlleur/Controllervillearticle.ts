import { Request, Response } from "express";
import { VilleArticle } from "../models/VilleArticle";
import { dbConnection } from "../BDconnection/BDconnection";
import mongoose from "mongoose";

class ControllerVilleArticle {
    async getVilleArticleByLocalitation(req: Request, res: Response): Promise<void> {
        const ville = req.params.ville;
        console.log("Recherche pour la ville:", ville);
        
        if(mongoose.connection.readyState !== 1){
            console.log('Connexion à la base de données requise');
            
            await dbConnection.getConnection().catch(error => {
                console.log('Erreur de connexion:', error);
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
    
        try {
            console.log('Exécution de la requête avec nom de ville:', ville);
            
            const villeResults = await VilleArticle.find({
                'ville.nom': ville
            });
            
            console.log('Nombre de résultats trouvés:', villeResults.length);
            
            if(villeResults.length === 0) {
                res.status(404).json({ message: 'Aucun article trouvé pour cette ville' });
                return;
            }
            
            res.status(200).json(villeResults);
        } catch (error) {
            console.log("Erreur lors de la recherche:", error);
            res.status(500).json({ error: 'Erreur lors de la recherche de l\'article' });
        }
        // Suppression du bloc finally avec closeConnection
    }

    async getAllVilleArticles(req: Request, res: Response): Promise<void> {
        if(mongoose.connection.readyState !== 1){
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const articles = await VilleArticle.find();
            if (articles.length === 0) {
                res.status(404).json({ message: 'Aucun article trouvé' });
                return;
            }
            res.status(200).json(articles);
        } catch (error) {
            console.error('Erreur lors de la récupération des articles:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
        }
        // Suppression du bloc finally avec closeConnection
    }

    async getVilleArticleById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        if(mongoose.connection.readyState !== 1){
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const article = await VilleArticle.findById(id);
            if (!article) {
                res.status(404).json({ message: 'Article non trouvé' });
                return;
            }
            res.status(200).json(article);
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'article:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
        }
        // Suppression du bloc finally avec closeConnection
    }

    async updateVilleArticle(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        if(mongoose.connection.readyState !== 1){
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const article = await VilleArticle.findByIdAndUpdate(
                id, 
                req.body, 
                { new: true, runValidators: true }
            );
            if (!article) {
                res.status(404).json({ message: 'Article non trouvé' });
                return;
            }
            res.status(200).json(article);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'article:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
        }
        // Suppression du bloc finally avec closeConnection
    }

    async createVilleArticle(req: Request, res: Response): Promise<void> {
        if(mongoose.connection.readyState !== 1){
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const articleData = req.body;
            const newArticle = new VilleArticle(articleData);
            const savedArticle = await newArticle.save();
            res.status(201).json(savedArticle);
        } catch (error) {
            console.error('Erreur lors de la création de l\'article:', error);
            res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
        }
        // Suppression du bloc finally avec closeConnection
    }
    
    async deleteVilleArticle(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        if(mongoose.connection.readyState !== 1){
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const article = await VilleArticle.findByIdAndDelete(id);
            if (!article) {
                res.status(404).json({ message: 'Article non trouvé' });
                return;
            }
            res.status(200).json({ message: 'Article supprimé avec succès' });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'article:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
        }
        // Suppression du bloc finally avec closeConnection
    }
}

export const controllerVilleArticleInstance = new ControllerVilleArticle();