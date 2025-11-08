"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const Fonction_1 = __importDefault(require("../fonction/Fonction"));
const routerGmail = (0, express_1.Router)();
// Routes Google
routerGmail.get('/auth/google/chauffeur', (req, res) => {
    res.cookie('userRole', 'chauffeur', {
        httpOnly: true,
        maxAge: 5 * 60 * 1000
    });
    res.redirect('/auth/google');
});
routerGmail.get('/auth/google/touriste', (req, res) => {
    res.cookie('userRole', 'touriste', {
        httpOnly: true,
        maxAge: 5 * 60 * 1000
    });
    res.redirect('/auth/google');
});
routerGmail.get('/auth/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
routerGmail.get('/auth/google/callback', (req, res, next) => {
    console.log('Cookies dans le callback Facebook:', req.cookies);
    // Utilisation de la méthode personnalisée d'authentification
    passport_1.default.authenticate('google', (err, user, info) => {
        // Gestion des erreurs d'authentification
        if (err) {
            return res.status(400).json({ sucee: false, error: err.message });
        }
        // Si pas d'utilisateur trouvé
        if (!user) {
            console.log('Utilisateur non défini après authentification Facebook');
            return res.status(400).json({ sucee: false, error: info.message });
            return res.render('template', {
                error: (info && info.message) || 'Impossible de s\'authentifier'
            });
        }
        // Tenter la connexion
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error('Erreur de connexion:', loginErr);
                return res.status(400).json({ sucee: false, error: 'Erreur lors de la connexion' });
            }
            // Effacer le cookie après authentification
            res.clearCookie('userRole');
            // Déterminer le type d'utilisateur
            const userType = user.constructor.modelName.toLowerCase() === 'chauffeurs'
                ? 'chauffeur'
                : 'touriste';
            console.log(`Utilisateur authentifié via Facebook en tant que ${userType}`);
            // Créer le token
            const userId = user._id;
            const token = Fonction_1.default.createtokenetcookies(res, userId);
            // Réponse JSON
            res.json({
                message: `Bienvenue, ${userType}!`,
                user: user,
                token: token
            });
        });
    })(req, res, next);
});
exports.default = routerGmail;
