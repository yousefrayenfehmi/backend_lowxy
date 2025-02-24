import express, { Application } from 'express';
import routetouriste from './Routes/Routetouriste';
import Routechauffeur from './Routes/Routechauffeur';
import Routeadmin from './Routes/Routeadmin';
import Routepartenaire from './Routes/Routepartenaire';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app: Application = express();
const port = 3000;


app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
  }));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } 
}));

app.use(passport.initialize());
app.use(passport.session());

//app.use(routetouriste.getRouter());
app.use(Routechauffeur.getRouter());
app.use(Routeadmin.getRouter());
app.use(Routepartenaire.getRouter());


app.listen(port, () => {
     console.log(process.env.MONGODB_URI);
    
    
    console.log(`Server running on port ${port}`);
});