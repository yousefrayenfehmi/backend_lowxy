import { Router, Request, Response } from 'express';
import passport from 'passport';
const routers = Router();
// Route pour les chauffeurs
routers.get('/auth/facebook/chauffeur', (req, res) => {
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
routers.get('/auth/facebook/touriste', (req, res) => {
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
routers.get('/auth/facebook', 
    passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
  );

// Route de callback
routers.get('/auth/facebook/callback',
  (req, res, next) => {
    console.log('Cookies dans le callback Facebook:', req.cookies);
    next();
  },
  passport.authenticate('facebook', { 
    failureRedirect: '/login'
  }),
  (req: Request, res: Response) => {
    console.log('Authentification Facebook réussie, nettoyage du cookie');
    
    // Effacer le cookie après authentification
    res.clearCookie('userRole');
    
    // Vérifier que l'utilisateur existe
    if (!req.user) {
      console.log('Utilisateur non défini après authentification Facebook');
      return res.redirect('/login');
    }
    
    // L'utilisateur est maintenant authentifié
    const userType = (req.user as any).constructor.modelName.toLowerCase() === 'chauffeurs' 
      ? 'chauffeur' 
      : 'touriste';
    
    console.log(`Utilisateur authentifié via Facebook en tant que ${userType}`);
    
    res.json({ 
      message: `Bienvenue, ${userType}!`, 
      user: req.user 
    });
  }
);

export default routers;