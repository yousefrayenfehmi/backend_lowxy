import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Touristes } from '../models/Touriste';
import { Chauffeurs } from '../models/Chauffeure';
import bcrypt from 'bcryptjs';

// Configurer une seule stratégie Google
passport.use('google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      passReqToCallback: true,
    },
    async (req: Request, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('Email non trouvé'), false);
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
          } else if (req.originalUrl.includes('/touriste')) {
            resolvedRole = 'touriste';
          }
          console.log('Rôle déterminé par URL:', resolvedRole);
        }
        
        if (!resolvedRole || (resolvedRole !== 'chauffeur' && resolvedRole !== 'touriste')) {
          return done(new Error('Rôle non spécifié ou invalide'), false);
        }

        // Logique pour gérer chauffeurs et touristes
        if (resolvedRole === 'chauffeur') {
          let chauffeur = await Chauffeurs.findOne({ 'info.google_id': profile.id });
          if (!chauffeur) {
            chauffeur = await Chauffeurs.findOne({ 'info.email': email });
          }
          
          if (!chauffeur) {
            chauffeur = new Chauffeurs({
              info: {
                nom_complet: profile.displayName,
                email: email,
                motdepasse: await bcrypt.hash('google', 10),
                strategy: 'google',
                google_id: profile.id,
              },
              securites: { isverified: true },
            });
            await chauffeur.save();
            console.log('Nouveau chauffeur créé:', email);
          } else {
            console.log('Chauffeur existant trouvé:', email);
          }
          
          return done(null, chauffeur);
        } else {
          let touriste = await Touristes.findOne({ 'info.google_id': profile.id });
          if (!touriste) {
            touriste = await Touristes.findOne({ 'info.email': email });
          }
          
          if (!touriste) {
            touriste = new Touristes({
              info: {
                nom_complet: profile.displayName,
                email: email,
                motdepasse: await bcrypt.hash('google', 10),
                strategy: 'google',
                google_id: profile.id,
              },
              securites: { isverified: true },
            });
            await touriste.save();
            console.log('Nouveau touriste créé:', email);
          } else {
            console.log('Touriste existant trouvé:', email);
          }
          
          return done(null, touriste);
        }
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        return done(error, false);
      }
    }
  )
);




// Sérialisation de l'utilisateur pour la session
passport.serializeUser((user: any, done) => {
  try {
    console.log('Sérialisation utilisateur:', user);
    
    // Vérifier que l'utilisateur a un ID
    if (!user || !user._id) {
      return done(new Error('Utilisateur invalide pour la sérialisation'), null);
    }
    
    // Déterminer le rôle
    let role = 'touriste';
    if (user.constructor && user.constructor.modelName) {
      role = user.constructor.modelName.toLowerCase() === 'chauffeurs' ? 'chauffeur' : 'touriste';
    }
    
    done(null, { 
      id: user._id.toString(), // Convertir en string pour être sûr
      role: role
    });
  } catch (error) {
    console.error('Erreur lors de la sérialisation:', error);
    done(error, null);
  }
});

// Désérialisation de l'utilisateur depuis la session
passport.deserializeUser(async (serializedUser: any, done) => {
  try {
    console.log('Désérialisation utilisateur:', serializedUser);
    
    if (!serializedUser || !serializedUser.id) {
      return done(new Error('Données de session invalides'), null);
    }
    
    const { id, role } = serializedUser;
    
    if (role === 'chauffeur') {
      const chauffeur = await Chauffeurs.findById(id).exec();
      if (!chauffeur) {
        return done(new Error('Chauffeur non trouvé'), null);
      }
      return done(null, chauffeur);
    } else {
      const touriste = await Touristes.findById(id).exec();
      if (!touriste) {
        return done(new Error('Touriste non trouvé'), null);
      }
      return done(null, touriste);
    }
  } catch (error) {
    console.error('Erreur lors de la désérialisation:', error);
    done(error, null);
  }
});