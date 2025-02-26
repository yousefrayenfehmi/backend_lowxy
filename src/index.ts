import express, { Application } from 'express';
import routetouriste from './Routes/Routetouriste';
import Routechauffeur from './Routes/Routechauffeur';
import Routeadmin from './Routes/Routeadmin';
import Routepartenaire from './Routes/Routepartenaire';
import Routesstrategy from './Routes/Routesstrategy';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import router from './Routes/Routesstrategy';
import routers from './Routes/Routefbstartegy';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import cookieParser from 'cookie-parser';
import './fonction/Strategychauffeur'; 
import './fonction/strategy.facebook'; 
const app: Application = express();
const port = 3000;
import ejs from 'ejs';

import { Touristes } from './models/Touriste';
import { Chauffeurs } from './models/Chauffeure';

// Cette fonction détermine quelles données de l'utilisateur doivent être stockées dans la session.
// L'ID de l'utilisateur est couramment utilisé.
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
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

// Initialiser passport APRÈS les sessions
app.use(routers);
app.use(passport.initialize());
app.use(passport.session());
app.use(router);
app.use(routetouriste.getRouter());
app.use(Routechauffeur.getRouter());
app.use(Routeadmin.getRouter());
app.use(Routepartenaire.getRouter());


app.listen(port, () => {
     console.log(process.env.MONGODB_URI);
    
    
    console.log(`Server running on port ${port}`);
});