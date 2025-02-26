import { Router, Request, Response } from 'express';
import passport from 'passport';
import Fonction from '../fonction/Fonction';
import { Chauffeurs } from '../models/Chauffeure';
const routerFacebook = Router();
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
routerFacebook.get('/auth/facebook', 
    passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
  );








// Route de callback
routerFacebook.get('/auth/facebook/callback', 
  (req, res, next) => {
    console.log('Cookies dans le callback Facebook:', req.cookies);
    
    // Utilisation de la méthode personnalisée d'authentification
    passport.authenticate('facebook', (err:Error, user:any, info:any) => {
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
        const userType = (user as any).constructor.modelName.toLowerCase() === 'chauffeurs'
          ? 'chauffeur'
          : 'touriste';

        console.log(`Utilisateur authentifié via Facebook en tant que ${userType}`);

        // Créer le token
        const userId = user._id;
        const token = Fonction.createtokenetcookies(res, userId);

        // Réponse JSON
        res.json({
          message: `Bienvenue, ${userType}!`,
          user: user,
          token: token
        });
      });
    })(req, res, next);
  }
);


export default routerFacebook;