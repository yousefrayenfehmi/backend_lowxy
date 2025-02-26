import express, { Application } from 'express';
import routetouriste from './Routes/Routetouriste';
import Routechauffeur from './Routes/Routechauffeur';
import Routeadmin from './Routes/Routeadmin';
import Routepartenaire from './Routes/Routepartenaire';
import Routesstrategy from './Routes/Routesgmailstrategy';
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
    origin: process.env.FRONT_END_URL,
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

app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
app.use(routerGmail);
app.use(routerFacebook);
app.use(routetouriste.getRouter());
app.use(Routechauffeur.getRouter());
app.use(Routeadmin.getRouter());
app.use(Routepartenaire.getRouter());


app.listen(port, () => {    
  console.log(process.env.FRONT_END_URL);
  
    console.log(`Server running on port ${port}`);
});