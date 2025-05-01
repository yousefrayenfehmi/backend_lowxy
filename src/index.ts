import express, { Application, Request, Response, NextFunction } from 'express';
import routetouriste from './Routes/Routetouriste';
import Routechauffeur from './Routes/Routechauffeur';
import Routeadmin from './Routes/Routeadmin';
import Routepreferences from './Routes/RoutesPreferences';
import Routepartenaire from './Routes/Routepartenaire';
import Routesstrategy from './Routes/Routesgmailstrategy';
import RouteTour from './Routes/tourRoute'; // adjust the path as needed
import RouteReservation from './Routes/RouteReservation ';

import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import routerGmail from './Routes/Routesgmailstrategy';
import routerFacebook from './Routes/Routefbstartegy';
import cookieParser from 'cookie-parser';
import './fonction/Strategy.gmail'; 
import './fonction/strategy.facebook'; 
import { RoutecoveringadsInstance } from './Routes/Routecoveringads';
import fs from 'fs';
import { RouteDebugInstance } from './Routes/RouteDebug';
import { S3 } from 'aws-sdk';
import { RouteStorageInstance } from './Routes/RouteStorage';

import { Touristes } from './models/Touriste';
import { Chauffeurs } from './models/Chauffeure';
import { ControllercovringadsInstance } from './Controlleur/Controllercovringads';

// Importer node-cron pour les tâches programmées
import cron from 'node-cron';

// Création des dossiers d'upload au démarrage


dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app: Application = express();
const port = 3000;

// Configuration S3
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-west-3'
});

app.use(cors({
  origin: '*', // Autoriser toutes les origines temporairement pour déboguer
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // Headers autorisés
  credentials: true, // Autorisez les cookies et autres credentials
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'votre-clé-secrète',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

app.use(cookieParser());

// Middleware spécial pour la route de webhook Stripe
app.use('/reservations/webhook', express.raw({ type: 'application/json' }));

// Puis les autres middlewares généraux
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API iso running' });
});

// Et enfin vos routes
app.use(routerGmail);
app.use(routerFacebook);
app.use(routetouriste.getRouter());
app.use(Routechauffeur.getRouter());
app.use(Routeadmin.getRouter());
app.use(Routepartenaire.getRouter());
app.use(RouteTour.getRouter());
app.use(Routepreferences.getRouter());
app.use(RouteReservation.getRouter());

// Ajout du router de débogage
app.use('/debug', RouteDebugInstance.getRouter());

// Utilisation du router de stockage pour l'accès aux fichiers
app.use('/uploads', RouteStorageInstance.getRouter());

// Fallback pour le système de fichiers local (si S3 échoue)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(RoutecoveringadsInstance.getRouter());

// Gestion des erreurs
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Démarrer le serveur
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  
  // Planifier l'exécution quotidienne des fonctions pour déplacer les campagnes expirées vers l'historique
  // Format cron: seconde(0-59) minute(0-59) heure(0-23) jour_du_mois(1-31) mois(1-12) jour_de_la_semaine(0-7)
  cron.schedule('* * * * *', async () => { // Chaque minute
    console.log('Exécution planifiée: Déplacement des campagnes expirées vers l\'historique');
    try {
      const mockReq = {} as any;
      const mockRes = {
        status: (code: number) => ({
          json: (data: any) => {
            console.log(`Campagnes planifiées complétées: ${data.processed}`);
          }
        })
      } as any;
      
      // Exécuter les deux fonctions de nettoyage
      await ControllercovringadsInstance.Capaigns_complete(mockReq, mockRes);
      await ControllercovringadsInstance.moveCampaignsToHistory(mockReq, mockRes);
    } catch (error) {
      console.error('Erreur lors de l\'exécution planifiée:', error);
    }
  });
});