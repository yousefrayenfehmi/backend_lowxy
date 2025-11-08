"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Routetouriste_1 = __importDefault(require("./Routes/Routetouriste"));
const Routechauffeur_1 = __importDefault(require("./Routes/Routechauffeur"));
const Routeadmin_1 = __importDefault(require("./Routes/Routeadmin"));
const RoutesPreferences_1 = __importDefault(require("./Routes/RoutesPreferences"));
const Routepartenaire_1 = __importDefault(require("./Routes/Routepartenaire"));
const tourRoute_1 = __importDefault(require("./Routes/tourRoute")); // adjust the path as needed
const RouteReservation_1 = __importDefault(require("./Routes/RouteReservation "));
const RouteGuideIA_1 = __importDefault(require("./Routes/RouteGuideIA"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const Routesgmailstrategy_1 = __importDefault(require("./Routes/Routesgmailstrategy"));
const Routefbstartegy_1 = __importDefault(require("./Routes/Routefbstartegy"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require("./fonction/Strategy.gmail");
require("./fonction/strategy.facebook");
const Routecoveringads_1 = require("./Routes/Routecoveringads");
const RouteDebug_1 = require("./Routes/RouteDebug");
const aws_sdk_1 = require("aws-sdk");
const RouteStorage_1 = require("./Routes/RouteStorage");
// Création des dossiers d'upload au démarrage
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const app = (0, express_1.default)();
const port = 5000;
// Configuration S3
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-west-3'
});
app.use((0, cors_1.default)({
    origin: '*', // Autoriser toutes les origines temporairement pour déboguer
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Méthodes autorisées
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // Headers autorisés
    credentials: true, // Autorisez les cookies et autres credentials
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
}));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'votre-clé-secrète',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));
app.use((0, cookie_parser_1.default)());
// Middleware spécial pour la route de webhook Stripe
app.use('/reservations/webhook', express_1.default.raw({ type: 'application/json' }));
// Puis les autres middlewares généraux
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API iso running' });
});
// Et enfin vos routes
app.use(Routesgmailstrategy_1.default);
app.use(Routefbstartegy_1.default);
app.use(Routetouriste_1.default.getRouter());
app.use(Routechauffeur_1.default.getRouter());
app.use(Routeadmin_1.default.getRouter());
app.use(Routepartenaire_1.default.getRouter());
app.use(tourRoute_1.default.getRouter());
app.use(RoutesPreferences_1.default.getRouter());
app.use(RouteReservation_1.default.getRouter());
app.use('/guide-ia', RouteGuideIA_1.default.getRouter());
// Ajout du router de débogage
app.use('/debug', RouteDebug_1.RouteDebugInstance.getRouter());
// Utilisation du router de stockage pour l'accès aux fichiers
app.use('/uploads', RouteStorage_1.RouteStorageInstance.getRouter());
// Fallback pour le système de fichiers local (si S3 échoue)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
app.use(Routecoveringads_1.RoutecoveringadsInstance.getRouter());
// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
// Démarrer le serveur
app.listen(port, '0.0.0.0', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server is running on port ${port}`);
    console.log(`Server is running on port ${port}`);
    console.log(`Server is running on port ${port}`);
    console.log(`ba`);
    // Planifier l'exécution quotidienne des fonctions pour déplacer les campagnes expirées vers l'historique
    // Format cron: seconde(0-59) minute(0-59) heure(0-23) jour_du_mois(1-31) mois(1-12) jour_de_la_semaine(0-7)
    /*cron.schedule('* * * * *', async () => { // Chaque minute
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
        await ControllerpartenairInstance.pubcomplete(mockReq, mockRes);
        await ControllercovringadsInstance.Capaigns_complete(mockReq, mockRes);
        await ControllercovringadsInstance.moveCampaignsToHistory(mockReq, mockRes);
      } catch (error) {
        console.error('Erreur lors de l\'exécution planifiée:', error);
      }
    });*/
}));
