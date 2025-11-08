import ConfigPublicite from "../models/Configpublicite";
import { Request, Response } from 'express';
import { dbConnection } from "../BDconnection/BDconnection";
import mongoose from "mongoose";
class ControllerConfigpublicite {
    // Créer une nouvelle configuration
     async creerConfiguration(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
        })
    }
        try {
            const { prixClic, prixImpression, tarifParJour } = req.body;

            const nouvelleConfiguration = new ConfigPublicite({
                prixClic,
                prixImpression,
                tarifParJour
            });
            console.log(nouvelleConfiguration);
            
            await ConfigPublicite.deleteMany();
            console.log("suppression");

            await nouvelleConfiguration.save();

            res.status(201).json(nouvelleConfiguration);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la création de la configuration', error });
        }
    }
    async getConfiguration(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
        })
    }
        try {
            const configuration = await ConfigPublicite.findOne();
            res.status(200).json(configuration);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération de la configuration', error });
        }
    }


}

export const ControllerConfigpubliciteInstance = new ControllerConfigpublicite();


