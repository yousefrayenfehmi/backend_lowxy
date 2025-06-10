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
            console.log('req.body', req.body);
            console.log(req.user);
            const idtour=req.body.tourId;
            const id=req.user;
            const partenaire=await Partenaires.findOne({'tours._id':idtour});

            if(!partenaire){
                res.status(404).json({error:'Tour non trouvé'});
                return;
            }
            partenaire.tours.forEach((tour:any)=>{
                if(tour._id.toString()===idtour){
                    tour.commission=req.body.pourcentage;
                }
            });
            await partenaire.save();
            res.status(201).json({
                success: true,
                marge: partenaire
            });
        } catch (error) {
            console.log('error', error);
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
        const partenaire=await Partenaires.find();
        const marges=partenaire.map((partenaire:any)=>{
            return partenaire.tours.map((tour:any)=>{
                if(tour.commission){
                    return tour;
                }
            })
        }).flat();
        console.log('marges', marges);
        
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
            const { pourcentage}= req.body;
            const partenaire=await Partenaires.find();
            partenaire.forEach(async(partenaire:any)=>{
                partenaire.tours.forEach((tour:any)=>{
                    tour.commission=pourcentage;
                });
                await partenaire.save();
            });
            console.log('partenaire', partenaire);
            
            res.status(200).json({success:true,message:'Marge globale appliquée avec succès'});
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