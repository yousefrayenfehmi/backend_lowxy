import { Chauffeurs } from "../models/Chauffeure";
import { NextFunction, Request, Response } from "express";
import { dbConnection } from "../BDconnection/BDconnection";
import { Touristes } from "../models/Touriste";
import { Partenaires } from "../models/Partenaire";
import { upload } from "./Controllerpartenaire";
import { CoveringAd}  from "../models/Covering_ads";
import mongoose, { Types } from "mongoose";
import Stripe from "stripe";
import { ICoveringAd } from "../Interface/InterfaceCovering_ads";
const stripe = new Stripe('sk_test_51RAG0WQ4fzXaDh6qqaSa4kETsLitTt3nAHAnaPoodCOrgstRL0puvbFYG6KoruYmawEgL3o8NJ5DmywcApPS2NjH00FKdOaX9O');
export class Controllercovringads {

    paidcovering(req: Request, res: Response): void {
        upload(req, res, async (err) => {
            if (err) {
                console.error('Erreur multer:', err);
                res.status(400).json({ message: 'Erreur lors de l\'upload des fichiers: ' + err.message });
                return;
            }
            //recuperer les fichiers uploadés
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            //verifier s'il y a des fichiers
            if (!files || (!files['covering'] || files['covering'].length === 0)) {
                res.status(400).json({ message: 'Aucun fichier image ou vidéo envoyé' });
                return;
            }
            console.log(req.body);
            
            //Traiter les images
            const bannerFiles = files['covering'] || [];
            const path=bannerFiles[0].path;
            const url=  path.substring(path.indexOf('uploads'));
            const coveringAd={
                _id: new Types.ObjectId(),
                details: {
                    modele_voiture: req.body.model_voiture,
                    type_covering: req.body.type_covering,
                    image: url,
                    nombre_taxi: Number(req.body.nombre_de_taxi),
                    nombre_jour: Number(req.body.nombre_de_jour),
                    prix: Number(req.body.prix)
                },
                dates: {
                    creation: new Date(),
                    debut: new Date(req.body.date_debut),
                    fin: new Date(req.body.date_fin)
                },
                status: 'pending',
                assigned_taxis: []
            }
            
            console.log(coveringAd);
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: `Publicité ${req.params.nom_societe || ''}`,
                                description: 'Campagne publicitaire',
                            },
                            unit_amount:  Math.round(coveringAd.details.prix * 100), // Conversion en centimes et arrondi
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/paiment_sucesses/${coveringAd._id}?data=${encodeURIComponent(JSON.stringify(coveringAd))}&type=covering`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/paiment_echouee/${coveringAd._id}?type=covering`,
            });
            
            res.status(200).json({ id: session.id });
        })
    }


    async savecovering(req: Request, res: Response): Promise<void> {
      if (mongoose.connection.readyState !== 1) {
        await dbConnection.getConnection().catch(error => {
            res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            return;
        });
    }
    try {
      const id = req.user;
      const coveringAd = req.body.data;
      let type;
      if(await Partenaires.findById(id)){
        type='partenaire';
      }else if(await Touristes.findById(id)){
        type='client';
      }
      else{
        res.status(400).json({error:'Utilisateur non trouvé'});
        return;
      }
      const coveringAds = new CoveringAd();
      coveringAds._id=coveringAd._id;
      coveringAds.creator={
        type:type as 'partenaire' | 'client',
        id:id as Types.ObjectId
      }
      coveringAds.details=coveringAd.details;
      coveringAds.dates=coveringAd.dates;
      coveringAds.status=coveringAd.status;
      coveringAds.assigned_taxis=coveringAd.assigned_taxis;
      console.log(coveringAds);
      
      await coveringAds.save();
      res.status(200).json({message:'Campagne publicitaire enregistrée avec succès'});
    } catch (error) {
      console.log(error);
      res.status(500).json({error:error});
    }

        
  
    }



    // Méthode pour récupérer les campagnes disponibles pour les taxis
async getAvailableCampaigns(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      await dbConnection.getConnection().catch(error => {
        res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        return;
      });
    }
    
    try {
      // Extraire les paramètres de filtre
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const modele = req.query.modele as string;
      const type_covering = req.query.type_covering as string;
      const min_days = parseInt(req.query.min_days as string) || 0;
      
      // Construire le filtre
      const filter: any = { status: 'pending' };
      
      if (modele) filter['details.modele_voiture'] = modele;
      if (type_covering) filter['details.type_covering'] = type_covering;
      if (min_days > 0) filter['details.nombre_jour'] = { $gte: min_days };
      
      // Calculer le skip pour la pagination
      const skip = (page - 1) * limit;
      
      // Récupérer les campagnes
      const campaigns = await CoveringAd.find(filter)
        .sort({ 'dates.debut': 1 })
        .skip(skip)
        .limit(limit);
      
      // Compter le total
      const total = await CoveringAd.countDocuments(filter);
      
      res.status(200).json({
        success: true,
        count: campaigns.length,
        total,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit)
        },
        data: campaigns
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des campagnes disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des campagnes',
        error
      });
    }
  }
  
  // Méthode pour qu'un taxi rejoigne une campagne
  async joinCampaign(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      await dbConnection.getConnection().catch(error => {
        res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        return;
      });
    }
    
    try {
      const chauffeurId = req.user;
      const { campaignId } = req.params;
      
      // Vérifier si l'utilisateur est un chauffeur de taxi
      const chauffeur = await Chauffeurs.findById(chauffeurId);
      if (!chauffeur || !chauffeur._id) {
        res.status(403).json({ 
          success: false, 
          message: 'Accès non autorisé ou taxi non assigné' 
        });
        return;
      }
      
      const chauffeurDetails = await Chauffeurs.findById(chauffeur._id);
      if (!chauffeurDetails) {
        res.status(404).json({ 
          success: false, 
          message: 'Taxi non trouvé' 
        });
        return;
      }
      
      // Vérifier si le taxi participe à cette campagne
      const isParticipating = chauffeurDetails.active_coverings && 
                             chauffeurDetails.active_coverings.some(c => c.toString() === campaignId);
      
      if (isParticipating) {
        res.status(400).json({ 
          success: false, 
          message: 'Ce taxi participe déjà à cette campagne' 
        });
        return;
      }
      
      // Récupérer la campagne
      const campaign = await CoveringAd.findById(campaignId);
      if (!campaign) {
        res.status(404).json({ 
          success: false, 
          message: 'Campagne non trouvée' 
        });
        return;
      }
      if (campaign.status !== 'pending') {
        res.status(400).json({ 
          success: false, 
          message: 'Cette campagne n\'est plus disponible' 
        });
        return;
      }
      const verifcompagne=await CoveringAd.find({assigned_taxis:{$in:[chauffeur._id]}});
      if (verifcompagne.length>0) {
        res.status(400).json({ 
          success: false, 
          message: 'Ce taxi participe déjà à une campagne active' 
        });
        return;
      }
      
      // Vérifier si le modèle du taxi correspond
      if (chauffeur.vehicule.modele !== campaign.details.modele_voiture) {
        res.status(400).json({ 
          success: false, 
          message: 'Le modèle de votre taxi ne correspond pas à celui requis pour cette campagne' 
        });
        return;
      }
      
      // Vérifier si le nombre maximum de taxis n'est pas atteint
      if (campaign.assigned_taxis.length >= campaign.details.nombre_taxi) {
        res.status(400).json({ 
          success: false, 
          message: 'Le nombre maximum de taxis pour cette campagne a déjà été atteint' 
        });
        return;
      }
      
      // Ajouter le taxi à la campagne
      campaign.assigned_taxis.push(chauffeur._id);
      
      // Si le nombre requis est atteint, activer la campagne
      if (campaign.assigned_taxis.length >= campaign.details.nombre_taxi) {
        campaign.status = 'active';
      }
      
      await campaign.save();
      
      // Ajouter la campagne aux coverings actifs du taxi
      chauffeur.active_coverings = chauffeur.active_coverings || [];
      chauffeur.active_coverings.push(campaign._id);
      await chauffeur.save();
      
      res.status(200).json({
        success: true,
        message: 'Vous avez rejoint la campagne avec succès',
        data: {
          campaignId: campaign._id,
          taxiId: chauffeur._id
        }
      });
    } catch (error) {
      console.error('Erreur lors de la participation à la campagne:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la participation à la campagne',
        error
      });
    }
  }
  
  // Méthode pour récupérer les campagnes du taxi connecté
  async getMyCampaigns(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      await dbConnection.getConnection().catch(error => {
        res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        return;
      });
    }
    
    try {
      const chauffeurId = req.user;
      
      // Vérifier si l'utilisateur est un chauffeur de taxi
      const chauffeurs = await Chauffeurs.findById(chauffeurId);
      if (!chauffeurs) {
        res.status(403).json({ 
          success: false, 
          message: 'Accès réservé aux chauffeurs de taxi' 
        });
        return;
      }
      
      // Vérifier si le chauffeur a un taxi assigné
      if (!chauffeurs._id) {
        res.status(400).json({ 
          success: false, 
          message: 'Vous n\'avez pas de taxi assigné' 
        });
        return;
      }
      
      // Récupérer le taxi et ses campagnes actives
      const chauffeurDetails = await Chauffeurs.findById(chauffeurs._id);
      if (!chauffeurDetails) {
        res.status(404).json({ 
          success: false, 
          message: 'Taxi non trouvé' 
        });
        return;
      }
      
      // Récupérer les détails des campagnes actives
      const activeCampaigns = await CoveringAd.find({
        _id: { $in: chauffeurDetails.active_coverings || [] }
      });
      
      // Récupérer les détails des campagnes passées
      const historyCampaigns = await CoveringAd.find({
        _id: { $in: chauffeurDetails.covering_history || [] }
      });
      
      res.status(200).json({
        success: true,
        data: {
          active: activeCampaigns || [],
          history: historyCampaigns || []
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des campagnes du taxi:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des campagnes',
        error
      });
    }
  }
  
  // Méthode pour qu'un taxi quitte une campagne
  async leaveCampaign(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      await dbConnection.getConnection().catch(error => {
        res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        return;
      });
    }
    
    try {
      const chauffeurId = req.user;
      const { campaignId } = req.params;
      const { reason } = req.body;
      
      // Vérifier si l'utilisateur est un chauffeur de taxi
      const chauffeur = await Chauffeurs.findById(chauffeurId);
      if (!chauffeur || !chauffeur._id) {
        res.status(403).json({ 
          success: false, 
          message: 'Accès non autorisé ou taxi non assigné' 
        });
        return;
      }
      
      const chauffeurDetails = await Chauffeurs.findById(chauffeur._id);
      if (!chauffeurDetails) {
        res.status(404).json({ 
          success: false, 
          message: 'Taxi non trouvé' 
        });
        return;
      }
      
      // Vérifier si le taxi participe à cette campagne
      const isParticipating = chauffeurDetails.active_coverings && 
                             chauffeurDetails.active_coverings.some(c => c.toString() === campaignId);
      
      if (!isParticipating) {
        res.status(400).json({ 
          success: false, 
          message: 'Vous ne participez pas à cette campagne' 
        });
        return;
      }
      
      // Récupérer la campagne
      const campaign = await CoveringAd.findById(campaignId);
      if (!campaign) {
        res.status(404).json({ 
          success: false, 
          message: 'Campagne non trouvée' 
        });
        return;
      }
      
      // Vérifier si la campagne est active depuis moins de 24h (règle d'exemple)
      if (campaign.status === 'active') {
        const nowDate = new Date();
        const startDate = new Date(campaign.dates.debut);
        const timeDiff = Math.abs(nowDate.getTime() - startDate.getTime());
        const diffHours = timeDiff / (1000 * 3600);
        
        if (diffHours > 24) {
          res.status(400).json({ 
            success: false, 
            message: 'Vous ne pouvez plus quitter cette campagne après 24h de participation' 
          });
          return;
        }
      }
      
      // Retirer le taxi de la campagne
      campaign.assigned_taxis = campaign.assigned_taxis.filter(
        t => t.toString() !== chauffeur._id.toString()
      );
      
      // Si c'était le dernier taxi, remettre la campagne en attente
      if (campaign.assigned_taxis.length === 0 && campaign.status === 'active') {
        campaign.status = 'pending';
      }
      
      await campaign.save();
      
      // Retirer la campagne des coverings actifs du taxi
      chauffeur.active_coverings = (chauffeur.active_coverings || []).filter(
        c => c.toString() !== campaignId
      );
      
      // Ajouter à l'historique (optionnel)
      if (!chauffeur.covering_history) {
        chauffeur.covering_history = [];
      }
      chauffeur.covering_history.push(new Types.ObjectId(campaignId));
      
      await chauffeur.save();
      
      // Enregistrer la raison (optionnel, à adapter selon votre modèle)
      // ...
      
      res.status(200).json({
        success: true,
        message: 'Vous avez quitté la campagne avec succès'
      });
    } catch (error) {
      console.error('Erreur lors du retrait de la campagne:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du retrait de la campagne',
        error
      });
    }
  }
  
  // Méthode pour qu'un taxi signale un problème avec une campagne
  async reportCampaignIssue(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      await dbConnection.getConnection().catch(error => {
        res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        return;
      });
    }
    
    try {
      const chauffeurId = req.user;
      const { campaignId } = req.params;
      const { issue_type, description } = req.body;
      
      // Vérifications et validations similaires aux méthodes précédentes
      // ...
      
      // Créer un rapport de problème (selon votre modèle de données)
      const report = {
        campaign_id: new Types.ObjectId(campaignId),
        chauffeur_id: chauffeurId,
        taxi_id: null, // À récupérer
        issue_type,
        description,
        status: 'pending',
        created_at: new Date()
      };
      
      // Sauvegarder le rapport (à adapter selon votre modèle)
      // await IssueReport.create(report);
      
      res.status(201).json({
        success: true,
        message: 'Problème signalé avec succès',
        data: report
      });
    } catch (error) {
      console.error('Erreur lors du signalement du problème:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du signalement du problème',
        error
      });
    }
  }
}

export const ControllercovringadsInstance = new Controllercovringads();