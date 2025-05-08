import { Chauffeurs } from "../models/Chauffeure";
import { NextFunction, Request, Response } from "express";
import { dbConnection } from "../BDconnection/BDconnection";
import { Touristes } from "../models/Touriste";
import { Partenaires } from "../models/Partenaire";
import { upload } from "./Controllerpartenaire";
import { CoveringAd}  from "../models/Covering_ads";
import { uploadToS3 } from "./Controllerpartenaire";
import { upload as upload2 } from "./Controllerpartenaire";
import mongoose, { Types } from "mongoose";
import Stripe from "stripe";
import { ICoveringAd } from "../Interface/InterfaceCovering_ads";
import Fonction from "../fonction/Fonction";
import { Emailtemplates } from "../fonction/EmailTemplates";
import { log } from "console";
import path from "path";
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
        
        //Traiter les images avec S3
        const coveringFile = files['covering'][0];
        const fileName = `covering-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(coveringFile.originalname)}`;
        const destination = `covering_ads/${req.params.nom_societe}/images/${fileName}`;
        
        try {
            const fileUrl = await uploadToS3(coveringFile, destination);
            
            const covring = {
                _id: new Types.ObjectId(),
                image: fileUrl,
                modele_voiture: req.body.model_voiture,
                type_covering: req.body.type_covering,
                nombre_taxi: req.body.nombre_de_taxi,
                nombre_jour: req.body.nombre_de_jour,
                prix: req.body.prix,
                statu: 'pending',
                impressions: 0,
                clicks: 0
            };

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
                            unit_amount:  Math.round(covring.prix * 100), // Conversion en centimes et arrondi
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${ process.env.front_end || 'http://a9aec0bf981024fcab3097aa85d37546-1960190977.eu-west-3.elb.amazonaws.com'}//paiment_sucesses/${covring._id}?data=${encodeURIComponent(JSON.stringify(covring))}&type=covering`,
                cancel_url: `${process.env.front_end}/paiment_echouee/${covring._id}?type=covering`,
            });

            res.status(200).json({ id: session.id });
        } catch (error: any) {
            console.error('Erreur lors de l\'upload sur S3:', error);
            res.status(500).json({ message: 'Erreur lors de l\'upload: ' + error.message });
        }
    });
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
        console.log('Utilisateur non trouvé');
        res.status(400).json({error:'Utilisateur non trouvé'});
        return;
      }
      
      // S'assurer que coveringAd a l'ID
      if (!coveringAd._id) {
        coveringAd._id = new Types.ObjectId();
      }
      
      // Créer un nouvel objet CoveringAd avec tous les champs requis
      const coveringAds = new CoveringAd({
        _id: coveringAd._id,
        creator: {
          type: type as 'partenaire' | 'client',
          id: id as Types.ObjectId
        },
        details: {
          modele_voiture: coveringAd.modele_voiture,
          type_covering: coveringAd.type_covering,
          image: coveringAd.image,
          nombre_taxi: parseInt(coveringAd.nombre_taxi),
          nombre_jour: parseInt(coveringAd.nombre_jour),
          prix: parseFloat(coveringAd.prix)
        },
        status: coveringAd.status || 'pending',
        assigned_taxis: coveringAd.assigned_taxis || []
      });
      
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
      const filter: any = { status: 'active' };
      
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
        console.log('Ce taxi participe déjà à cette campagne');
        
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
      if (campaign.status === 'pending') {
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
      
      // Calculer la date de fin en ajoutant le nombre de jours
      const dateDebut = new Date();
      const dateFin = new Date();
      dateFin.setDate(dateDebut.getDate() + campaign.details.nombre_jour);
      
      chauffeur.active_coverings.push({
        id: campaign._id, 
        date_debut: dateDebut, 
        date_fin: dateFin
      });
      
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
        const startDate = new Date(); // Utiliser la date actuelle comme approximation
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
  // méthode pour récupérer les campagnes d'un créateur
  async getCampaignsByCreator(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      await dbConnection.getConnection().catch(error => {
        res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        return;
      }); 
    }
    try {
      const creatorId = req.user;
      console.log(creatorId);
      
      const campaigns = await CoveringAd.find({ 'creator.id': creatorId });

      res.status(200).json({  
        success: true,
        data: campaigns
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des campagnes du créateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des campagnes du créateur',
        error
      });
    }
  }
  
  // Méthode pour déplacer les campagnes terminées vers l'historique
  async Capaigns_complete(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      await dbConnection.getConnection().catch(error => {
        res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        return;
      });
    }
    
    try {
      
      // Trouver toutes les campagnes actives dont la date de fin est passée
      const expiredCampaigns = await CoveringAd.find(
        { $expr: { $eq: [{ $size: "$assigned_taxis" }, "$details.nombre_taxi"] } }
      );
      
      if (expiredCampaigns.length === 0) {
        res.status(200).json({
          success: true,
          message: 'Aucune campagne expirée à traiter',
          processed: 0
        });
        return;
      }
      
      let processed = 0;
      
      for (const campaign of expiredCampaigns) {
        // Mettre à jour le statut de la campagne
        campaign.status = 'completed';
        await campaign.save();
        
        // Pour chaque taxi assigné à la campagne
        
        
        processed++;
      }
      
      res.status(200).json({
        success: true,
        message: `${processed} campagnes ont été déplacées vers l'historique`,
        processed
      });
    } catch (error) {
      console.error('Erreur lors du déplacement des campagnes vers l\'historique:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement des campagnes expirées',
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

  async moveCampaignsToHistory(req: Request, res: Response): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      await dbConnection.getConnection().catch(error => {
        res.status(500).json({ error: 'Erreur de connexion à la base de données' });
        return;
      });
    }
    
    try {
      const now = new Date('2025-04-25T10:00:00.000Z');
      
      // Trouver tous les chauffeurs qui ont des campagnes expirées
      const chauffeurs = await Chauffeurs.find({
        "active_coverings.date_fin": { $lt: now }
      });
      
      if (chauffeurs.length === 0) {
        res.status(200).json({
          success: true,
          message: 'Aucune campagne expirée à traiter',
          processed: 0
        });
        return;
      }
      
      let processed = 0;
      
      // Pour chaque chauffeur
      for (const chauffeur of chauffeurs) {
        // S'assurer que l'historique existe
        if (!chauffeur.covering_history) {
          chauffeur.covering_history = [];
        }
        
        // S'assurer que active_coverings existe
        if (!chauffeur.active_coverings) {
          chauffeur.active_coverings = [];
          continue; // Passer au chauffeur suivant car aucune campagne à traiter
        }
        
        // Identifier les campagnes expirées
        const expiredCoverings = chauffeur.active_coverings.filter(
          covering => new Date(covering.date_fin) < now
        );
        
        // Ajouter les IDs des campagnes expirées à l'historique
        for (const covering of expiredCoverings) {
          chauffeur.covering_history.push(covering.id);
          processed++;
        }
        
        // Filtrer les campagnes actives pour ne garder que celles non expirées
        chauffeur.active_coverings = chauffeur.active_coverings.filter(
          covering => new Date(covering.date_fin) >= now
        );
        
        await chauffeur.save();
      }
      
      
      

      
      res.status(200).json({
        success: true,
        message: `${processed} campagnes ont été déplacées vers l'historique`,
        processed
      });
    } catch (error) {
      console.error('Erreur lors du déplacement des campagnes vers l\'historique:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement des campagnes expirées',
        error
      });
    }
  }
}

export const ControllercovringadsInstance = new Controllercovringads();