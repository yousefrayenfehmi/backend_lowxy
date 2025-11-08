"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const Fonction_1 = __importDefault(require("../fonction/Fonction"));
const routerFacebook = (0, express_1.Router)();
// Route pour les chauffeurs
routerFacebook.get('/auth/facebook/chauffeur', (req, res) => {
    console.log('Création du cookie pour chauffeur (Facebook)');
    // Stocker le rôle dans un cookie
    res.cookie('userRole', 'chauffeur', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000 // 5 minutes
    });
    // Rediriger vers l'authentification Facebook
    res.redirect('/auth/facebook');
});
// Route pour les touristes
routerFacebook.get('/auth/facebook/touriste', (req, res) => {
    console.log('Création du cookie pour touriste (Facebook)');
    // Stocker le rôle dans un cookie
    res.cookie('userRole', 'touriste', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000 // 5 minutes
    });
    // Rediriger vers l'authentification Facebook
    res.redirect('/auth/facebook');
});
// Route Facebook commune
routerFacebook.get('/auth/facebook', passport_1.default.authenticate('facebook', { scope: ['email', 'public_profile'] }));
// Route de callback
routerFacebook.get('/auth/facebook/callback', (req, res, next) => {
    console.log('Cookies dans le callback Facebook:', req.cookies);
    // Utilisation de la méthode personnalisée d'authentification
    passport_1.default.authenticate('facebook', (err, user, info) => {
        // Gestion des erreurs d'authentification
        if (err) {
            console.error('Erreur d\'authentification:', err);
            return res.render('template', {
                error: err.message || 'Erreur lors de l\'authentification'
            });
        }
        // Si pas d'utilisateur trouvé
        if (!user) {
            console.log('Utilisateur non défini après authentification Facebook');
            return res.render('template', {
                error: (info && info.message) || 'Impossible de s\'authentifier'
            });
        }
        // Tenter la connexion
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error('Erreur de connexion:', loginErr);
                return res.render('template', {
                    error: 'Erreur lors de la connexion'
                });
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
exports.default = routerFacebook;
