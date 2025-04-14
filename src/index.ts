import express, { Application } from 'express';
import routetouriste from './Routes/Routetouriste';
import Routechauffeur from './Routes/Routechauffeur';
import Routeadmin from './Routes/Routeadmin';
import Routepreferences from './Routes/RoutesPreferences';
import Routepartenaire from './Routes/Routepartenaire';
import Routesstrategy from './Routes/Routesgmailstrategy';
import RouteTour from './Routes/tourRoute'; // adjust the path as needed

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
const app: Application = express();
const port = 3000;

import { Touristes } from './models/Touriste';
import { Chauffeurs } from './models/Chauffeure';


dotenv.config({ path: path.resolve(__dirname, '../.env') });


app.use(cors({
  origin: [process.env.FRONT_END_URL || 'http://localhost:4200', 'http://localhost:49717'], // Utilisez une variable d'environnement pour plus de flexibilité
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers autorisés
  credentials: true, // Autorisez les cookies et autres credentials
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

app.use(passport.initialize());
app.use(passport.session());
app.use(routerGmail);
app.use(routerFacebook);
app.use(routetouriste.getRouter());
app.use(Routechauffeur.getRouter());
app.use(Routeadmin.getRouter());
app.use(Routepartenaire.getRouter());
app.use(RouteTour.getRouter());
app.use(Routepreferences.getRouter());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.listen(port, () => {    
  console.log(process.env.FRONT_END_URL);
  
    console.log(`Server running on port ${port}`);
});