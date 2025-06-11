import { Request, Response } from 'express';
import { Marge } from '../models/marge';
import { dbConnection } from '../BDconnection/BDconnection';
import mongoose from 'mongoose';
import { Partenaires } from '../models/Partenaire';
import { float } from 'aws-sdk/clients/cloudfront';
import { Touristes } from '../models/Touriste';
import { Chauffeurs } from '../models/Chauffeure';

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

    async statMarge(req:Request,res:Response):Promise<void>{
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }
            try {
                const partenaires = await Partenaires.find();
                console.log('Nombre de partenaires trouvés:', partenaires.length);
                const touriste=await Touristes.find();
                const chauffeurs=await Chauffeurs.find();
                // Récupérer les réservations confirmées de chaque partenaire avec id partenaire et id tour
                const reservationsConfirmees: any[] = [];
                
                partenaires.forEach((partenaire: any) => {
                    console.log(`Partenaire: ${partenaire._id}, Tours: ${partenaire.tours?.length || 0}`);
                    
                    if (partenaire.tours && Array.isArray(partenaire.tours)) {
                        partenaire.tours.forEach((tour: any) => {
                            console.log(`  Tour: ${tour._id}, Jours: ${tour.jours?.length || 0}`);
                            
                            if (tour.jours && Array.isArray(tour.jours)) {
                                tour.jours.forEach((jour: any) => {
                                    console.log(`    Jour: ${jour._id}, Réservations: ${jour.reservations?.length || 0}`);
                                    
                                    if (jour.reservations && Array.isArray(jour.reservations)) {
                                                                                jour.reservations.forEach((reservation: any) => {
                                            if (reservation.statut === 'confirmée') {
                                               
                                                let touristeCorrespondant = null;
                                                let methodeTrouvee = 'Aucune';
                                                
                                                for (let i = 0; i < touriste.length; i++) {
                                                    const t = touriste[i];
                                                    
                                                   
                                                    
                                                    // Méthode 2: equals() pour ObjectId
                                                    if (t._id.equals && t._id.equals(reservation.client_id)) {
                                                        touristeCorrespondant = t;
                                                        methodeTrouvee = 'equals()';
                                                        console.log('✅ TROUVÉ avec equals()');
                                                        break;
                                                    }
                                                    
                                                   
                                                }
                                                
                                               
                                                
                                                const matricule = touristeCorrespondant?.info?.matricule_taxi || 'Non trouvé';
                                                const chauffeurCorrespondant = chauffeurs.find((chauffeur: any) => chauffeur.info.matricule===matricule);
                                                 
                                                reservationsConfirmees.push({
                                                    reservationId: reservation._id,
                                                    partenaireId: partenaire._id,
                                                    partenaireName: partenaire.inforamtion.inforegester.nom_entreprise,
                                                    tourId: tour._id,
                                                    jourId: jour._id,
                                                    clientId: reservation.client_id,
                                                    matriculeTouriste: matricule,
                                                    nomCompletTouriste: touristeCorrespondant?.info?.nom_complet || 'Non trouvé',
                                                    prix_total: reservation.prix_total || 0,
                                                    commission: tour.commission || 20,
                                                    commission_montant: ((reservation.prix_total || 0) * (tour.commission || 20)) / 100,
                                                    chauffeurID:chauffeurCorrespondant?._id,
                                                    chauffeurname:chauffeurCorrespondant?.info.nom_complet,
                                                    
                                                    
                                                    
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
                //calculer totale de prix totale
                let partenairegagnant:any[]=[];
                let prixlowxy=0
                const prixmarge=reservationsConfirmees.reduce((acc,reservation)=>acc+reservation.prix_total,0);
                const  chauffeurgagant:any[]=[];
                reservationsConfirmees.map((reservation)=>{

                    prixlowxy+=reservation.prix_total*(reservation.commission/2)/100;
                console.log('hhhhh');
                    if(partenairegagnant.length===0){
                        partenairegagnant.push({
                            _id:reservation.partenaireId,
                            nom:reservation.partenaireName,
                            prix:reservation.prix_total-reservation.prix_total*(reservation.commission/2)/100
                        });
                    }
                    else{
                        partenairegagnant.map(partenaire=>{
                            if(partenaire._id==reservation.partenaireId){
                                partenaire.prix+=reservation.prix_total-reservation.prix_total*(reservation.commission/2)/100;
                            }
                            else{
                                partenairegagnant.push({
                                    _id:reservation.partenaireId,
                                    nom:reservation.partenaireName,
                                    prix:reservation.prix_total-reservation.prix_total*(reservation.commission/2)/100
                                });
                            }
                        })
                    }
                    if(chauffeurgagant.length===0){
                        chauffeurgagant.push({
                            _id:reservation.chauffeurID,
                            nom:reservation.chauffeurname,
                            prix:reservation.prix_total*(reservation.commission/2)/100
                        });
                    }
                    else{
                        chauffeurgagant.map(chauffer=>{
                            if(chauffer._id==reservation.chauffeurID){
                                chauffer.prix+=reservation.prix_total*(reservation.commission/2)/100;
                            }
                            else{
                                chauffeurgagant.push({
                                    _id:reservation.chauffeurID,
                                    nom:reservation.chauffeurname,
                                    prix:reservation.prix_total*(reservation.commission/2)/100
                                });
                            }
                        })
                    }
                });
                
                
                    
                res.status(200).json({
                    success: true,
                    reservations: reservationsConfirmees,
                    
                    prixTotal:prixmarge,
                    partenaireGagnant:partenairegagnant,
                    prixlowxy:prixlowxy,
                    chauffeurGagant:chauffeurgagant
                });
            } catch (error) {
                console.log('error', error);
                res.status(500).json({success:false,error:error});
            }
    }

}
export const ControllerMargeInstance = new MargeController();