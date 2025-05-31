import { Request, Response } from 'express';
import { Marge } from '../models/marge';
import { dbConnection } from '../BDconnection/BDconnection';
import mongoose from 'mongoose';
import { Partenaires } from '../models/Partenaire';
import { float } from 'aws-sdk/clients/cloudfront';

class MargeController {
    async createMarge(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            if (req.body.actif) {
                await Marge.updateMany(
                    { tourId: req.body.tourId, actif: true },
                    { actif: false }
                );
            }
            
            const marge = new Marge({
                ...req.body,
                modifiePar: req.body.modifiePar || 'Admin',
                dateModification: new Date()
            });
            
            const savedMarge = await marge.save();
            res.status(201).json({
                success: true,
                marge: savedMarge
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error 
            });
        } 
    }

   async getAllMarges(req:Request,res:Response):Promise<void>{
    if(mongoose.connection.readyState !== 1){
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({error: 'Erreur de connexion à la base de données'});
            return;
        });
    }
    try{
        const marges=await Marge.find();
        res.status(200).json({success:true,marges:marges});
    }catch(error){
        res.status(500).json({success:false,error:error});
    }
   }
    async getMargesByTourId(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { tourId } = req.params;
            const marges = await Marge.find({ tourId });
            
            res.status(200).json({
                success: true,
                marges: marges
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche des marges'
            });
        } 
    }

    async getMargeById(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            const marge = await Marge.findById(id).populate('tourId', 'nom ville');
            if (!marge) {
                res.status(404).json({
                    success: false,
                    message: 'Marge non trouvée'
                });
                return;
            }
            res.status(200).json({
                success: true,
                marge: marge
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche de la marge'
            });
        } 
    }

    async updateMarge(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            
            // Récupérer la marge existante
            const existingMarge = await Marge.findById(id);
            if (!existingMarge) {
                res.status(404).json({ 
                    success: false,
                    message: 'Marge non trouvée' 
                });
                return;
            }
            
            // Si la marge est activée et n'était pas active avant, désactiver les autres marges pour ce tour
            if (req.body.actif && !existingMarge.actif) {
                await Marge.updateMany(
                    { tourId: existingMarge.tourId, actif: true },
                    { actif: false }
                );
            }
            
            // Mettre à jour avec les nouvelles valeurs
            const updatedData = {
                ...req.body,
                dateModification: new Date(),
                modifiePar: req.body.modifiePar || existingMarge.modifiePar
            };
            
            const marge = await Marge.findByIdAndUpdate(
                id,
                updatedData,
                { new: true, runValidators: true }
            );
            
            res.status(200).json({
                success: true,
                marge: marge
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error 
            });
        } 
    }

    async toggleMargeStatus(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            const { actif } = req.body;
            
            const marge = await Marge.findById(id);
            if (!marge) {
                res.status(404).json({ 
                    success: false,
                    message: 'Marge non trouvée' 
                });
                return;
            }
            
            // Si la marge va être activée, désactiver les autres
            if (actif) {
                await Marge.updateMany(
                    { tourId: marge.tourId, actif: true },
                    { actif: false }
                );
            }
            
            // Mettre à jour le statut de la marge
            marge.actif = actif;
            marge.dateModification = new Date();
            if (req.body.modifiePar) {
                marge.modifiePar = req.body.modifiePar;
            }
            
            await marge.save();
            
            res.status(200).json({
                success: true,
                marge: marge
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error 
            });
        }
    }

    async deleteMarge(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            console.log('je lena sayer');
            
            const marge = await Marge.findByIdAndDelete(id);
            if (!marge) {
                res.status(404).json({ 
                    success: false,
                    message: 'Marge non trouvée' 
                });
                return;
            }
            res.status(200).json({ 
                success: true,
                message: 'Marge supprimée avec succès' 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: error 
            });
        } 
    }

    async getMargeStats(req: Request, res: Response): Promise<void> {
        console.log("getMargeStats called");
        try {
            // S'assurer que la connexion à la base de données est établie
            if (mongoose.connection.readyState !== 1) {
                await dbConnection.getConnection();
            }

            // Calculer la marge moyenne active
            const marges = await Marge.find({ actif: true });
            const margeMoyenne = marges.length 
                ? marges.reduce((acc, marge) => acc + marge.pourcentage, 0) / marges.length 
                : 0;
            
            // Statistiques simplifées pour éviter les erreurs
            const stats = {
                margeMoyenne,
                revenuTotal: 0,
                partenaireTotal: 0,
                beneficeTotal: 0
            };
            
            res.status(200).json({
                success: true,
                stats: stats
            });
        } catch (error) {
            console.error("Erreur dans getMargeStats:", error);
            
            res.status(500).json({ 
                success: false,
                message: "Une erreur est survenue lors du calcul des statistiques",
                error: error instanceof Error ? error.message : "Erreur inconnue"
            });
        } 
    }

    async applyGlobalMarge(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { pourcentage, montantFixe } = req.body;
            const modifiePar = req.body.modifiePar || 'Admin';
            console.log('modifiePar', modifiePar);
            
            // Désactiver toutes les marges existantes
            const marges = await Marge.deleteMany();
            console.log('marges désactivées', marges);
            
            // Récupérer tous les partenaires avec leurs tours
            const partenaires = await Partenaires.find();
            console.log('Nombre de partenaires trouvés:', partenaires);
            
            // Collecter tous les tours de tous les partenaires
            let allTours: { _id: any; prix:  number  }[] = [];
            partenaires.forEach(partenaire => {
                if (partenaire.tours && Array.isArray(partenaire.tours)) {
                    partenaire.tours.forEach((tour: any) => {
                        if (tour && tour._id) {
                            allTours.push({
                                _id: tour._id,
                                prix: tour.jours[0].prix
                            });
                        }
                    });
                }
            });
            
            console.log('Nombre total de tours:', allTours);
            
            if (allTours.length === 0) {
                res.status(200).json({
                    success: true,
                    message: "Aucun tour trouvé pour appliquer la marge globale"
                });
                return;
            }
            
            // Créer une nouvelle marge pour chaque tour
            const margesPromises = allTours.map(tour => {
                return new Marge({
                    tourId: tour._id,
                    pourcentage,
                    montantFixe: (tour.prix*pourcentage)/100,
                    dateModification: new Date(),
                    modifiePar,
                    actif: true
                }).save();
            });
            
            await Promise.all(margesPromises);
            
            res.status(200).json({
                success: true,
                message: `Marge globale de ${pourcentage}% appliquée à ${allTours.length} tours`
            });
        } catch (error) {
            console.error("Erreur lors de l'application de la marge globale:", error);
            res.status(500).json({ 
                success: false,
                message: "Une erreur est survenue lors de l'application de la marge globale",
                error: error instanceof Error ? error.message : String(error)
            });
        } 
    }
}

export const ControllerMargeInstance = new MargeController();