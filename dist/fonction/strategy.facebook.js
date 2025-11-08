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
const passport_1 = __importDefault(require("passport"));
const passport_facebook_1 = require("passport-facebook");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Touriste_1 = require("../models/Touriste");
const Chauffeure_1 = require("../models/Chauffeure");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Fonction_1 = __importDefault(require("./Fonction"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// Configurer la stratégie Facebook
passport_1.default.use('facebook', new passport_facebook_1.Strategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'email', 'photos'],
    passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Facebook peut parfois ne pas renvoyer l'email selon les paramètres de confidentialité
        const email = profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : `${profile.id}@facebook.com`; // Fallback si pas d'email
        if (!email) {
            return done(null, false, { message: 'Email non trouvé' });
        }
        // Vérifier si les cookies existent et récupérer le rôle
        const role = req.cookies ? req.cookies.userRole : undefined;
        console.log('Cookies:', req.cookies);
        console.log('Rôle détecté:', role);
        // Si pas de rôle dans les cookies, essayer de le déterminer par l'URL
        let resolvedRole = role;
        if (!resolvedRole) {
            if (req.originalUrl.includes('/chauffeur')) {
                resolvedRole = 'chauffeur';
            }
            else if (req.originalUrl.includes('/touriste')) {
                resolvedRole = 'touriste';
            }
            console.log('Rôle déterminé par URL:', resolvedRole);
        }
        if (!resolvedRole || (resolvedRole !== 'chauffeur' && resolvedRole !== 'touriste')) {
            return done(null, false, { message: 'Rôle non spécifié ou invalide' });
        }
        // Logique pour gérer chauffeurs et touristes
        if (resolvedRole === 'chauffeur') {
            console.log('hetha chauffeur');
            let chauffeur = yield Chauffeure_1.Chauffeurs.findOne({ 'info.facebook_id': profile.id });
            console.log("cacaca=>" + chauffeur);
            if (!chauffeur) {
                console.log('Chauffeur non rencontré:', email);
                chauffeur = yield Chauffeure_1.Chauffeurs.findOne({ 'info.email': email });
            }
            if (!chauffeur) {
                let matricule = Fonction_1.default.generermatricle();
                while (yield Chauffeure_1.Chauffeurs.findOne({ 'info.matricule': matricule })) {
                    let matricule = Fonction_1.default.generermatricle();
                }
                chauffeur = new Chauffeure_1.Chauffeurs({
                    info: {
                        nom_complet: profile.displayName,
                        email: email,
                        motdepasse: yield bcryptjs_1.default.hash('facebook', 10),
                        strategy: 'facebook',
                        facebook_id: profile.id,
                        matricule: matricule
                    },
                    securites: { isverified: true },
                });
                yield chauffeur.save();
                Fonction_1.default.sendmail(email, 'matricule', matricule);
                console.log('Nouveau chauffeur créé:', email);
            }
            else {
                console.log('Chauffeur existant rencontré:', email);
                // Modification ici : utiliser done(null, false, { message: '...' })
                if (chauffeur.info.strategy !== 'facebook') {
                    return done(null, false, {
                        message: 'Le chauffeur a une autre stratégie de connexion'
                    });
                }
            }
            return done(null, chauffeur);
        }
        else {
            let touriste = yield Touriste_1.Touristes.findOne({ 'info.facebook_id': profile.id });
            console.log(touriste);
            if (!touriste) {
                touriste = yield Touriste_1.Touristes.findOne({ 'info.email': email });
            }
            if (!touriste) {
                touriste = new Touriste_1.Touristes({
                    info: {
                        nom_complet: profile.displayName,
                        email: email,
                        motdepasse: yield bcryptjs_1.default.hash('facebook', 10),
                        strategy: 'facebook',
                        facebook_id: profile.id,
                        photo: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
                    },
                    securites: { isverified: true },
                });
                yield touriste.save();
                console.log('Nouveau touriste créé:', email);
            }
            else {
                // Modification ici : utiliser done(null, false, { message: '...' })
                if (touriste.info.strategy !== 'facebook') {
                    return done(null, false, {
                        message: 'Le touriste a une autre stratégie de connexion'
                    });
                }
            }
            return done(null, touriste);
        }
    }
    catch (error) {
        // Modification ici : gestion générique des erreurs
        console.error('Erreur d\'authentification Facebook:', error);
        return done(null, false, {
            message: error instanceof Error ? error.message : 'Erreur d\'authentification'
        });
    }
})));
passport_1.default.serializeUser((user, done) => {
    try {
        console.log('Sérialisation utilisateur:', user);
        // Vérifier que l'utilisateur a un ID
        if (!user || !user._id) {
            return done(new Error('Utilisateur invalide pour la sérialisation'), null);
        }
        // Déterminer le rôle de manière plus robuste
        let role = 'touriste';
        if (user.collection && user.collection.collectionName) {
            role = user.collection.collectionName.toLowerCase().includes('chauffeurs')
                ? 'chauffeur'
                : 'touriste';
        }
        console.log('Rôle sérialisé:', role);
        done(null, {
            id: user._id.toString(),
            role: role
        });
    }
    catch (error) {
        console.error('Erreur lors de la sérialisation:', error);
        done(error, null);
    }
});
passport_1.default.deserializeUser((serializedUser, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Désérialisation utilisateur:', serializedUser);
        if (!serializedUser || !serializedUser.id) {
            return done(new Error('Données de session invalides'), null);
        }
        const { id, role } = serializedUser;
        console.log('Rôle à désérialiser:', role);
        let user;
        if (role === 'chauffeur') {
            user = yield Chauffeure_1.Chauffeurs.findById(id).exec();
            if (!user) {
                return done(new Error('Chauffeur non trouvé'), null);
            }
        }
        else {
            user = yield Touriste_1.Touristes.findById(id).exec();
            if (!user) {
                return done(new Error('Touriste non trouvé'), null);
            }
        }
        console.log('Utilisateur désérialisé:', user);
        return done(null, user);
    }
    catch (error) {
        console.error('Erreur lors de la désérialisation:', error);
        done(error, null);
    }
}));
exports.default = passport_1.default;
