import { Request, Response } from 'express';    
import { PointInteret } from '../models/VilleArticle';
import { dbConnection } from "../BDconnection/BDconnection";
import mongoose from 'mongoose';
import { LookoutEquipment } from 'aws-sdk';
class Controllervillearticle {
    async getVilleArticle(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
        try {
            const villeArticle = await PointInteret.find();
            res.status(200).json({ villeArticle });
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }
    async createVilleArticle(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
        try {
            console.log(req.body);
            
            const { nom_lieu, description, categorie, ville, pays, adresse, rating, url_image, texte_alternatif } = req.body;
            const villeArticle = new PointInteret({ 
                nom_lieu, 
                description, 
                categorie, 
                ville, 
                pays, 
                adresse, 
                rating, 
                url_image, 
                texte_alternatif 
            });
            await villeArticle.save();
            res.status(201).json({ message: 'Point d\'intérêt créé avec succès', villeArticle });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error });
        }
    }
    async updateVilleArticle(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
        try {
            const { id } = req.params;
            
            // Vérifier si l'élément existe
            const existingPointInteret = await PointInteret.findById(id);
            if (!existingPointInteret) {
                res.status(404).json({ error: 'Point d\'intérêt non trouvé' });
                return;
            }
            
            const { nom_lieu, description, categorie, ville, pays, adresse, rating, url_image, texte_alternatif } = req.body;
            
            // Mettre à jour le point d'intérêt
            const updatedPointInteret = await PointInteret.findByIdAndUpdate(
                id,
                {
                    nom_lieu,
                    description,
                    categorie,
                    ville,
                    pays,
                    adresse,
                    rating,
                    url_image,
                    texte_alternatif
                },
                { new: true, runValidators: true } // new: true retourne le document mis à jour
            );
            
            res.status(200).json({ 
                message: 'Point d\'intérêt mis à jour avec succès', 
                pointInteret: updatedPointInteret 
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error });
        }
    }
    async deleteVilleArticle(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
        try {
            const { id } = req.params;
            console.log(id);
            
            const villeArticle = await PointInteret.findByIdAndDelete(id);
            res.status(200).json({ message: 'Ville article supprimée avec succès', villeArticle });
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }
    async getVilleArticleByVille(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
        try {
            const { ville } = req.params;
            console.log('ville',ville);
            const lowercaseVille=ville.toLowerCase();
            const villeArticle = await PointInteret.find({'ville': lowercaseVille});
            console.log('villeArticle',villeArticle);
            res.status(200).json({ villeArticle });
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }
}
export const ControllervillearticleInstance = new Controllervillearticle();