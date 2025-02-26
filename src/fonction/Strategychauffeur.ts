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
          } else if (req.originalUrl.includes('/touriste')) {
            resolvedRole = 'touriste';
          }
          console.log('Rôle déterminé par URL:', resolvedRole);
        }
        
        if (!resolvedRole || (resolvedRole !== 'chauffeur' && resolvedRole !== 'touriste')) {
          return done(null, false, { message: 'Rôle non spécifié ou invalide' });
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
            if(chauffeur.info.strategy !== 'google'){
              return done(null, false, { 
                message: 'Le chauffeur a une autre stratégie de connexion' 
              });
            }
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
            if(touriste.info.strategy !== 'google'){
              return done(null, false, { 
                message: 'Le touriste a une autre stratégie de connexion' 
              });
            }
          }
          
          return done(null, touriste);
        }
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        return done(null, false, { 
          message: error instanceof Error ? error.message : 'Erreur d\'authentification' 
        });
      }
    }
  )
);


passport.serializeUser((user: any, done) => {
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
  } catch (error) {
    console.error('Erreur lors de la sérialisation:', error);
    done(error, null);
  }
});

passport.deserializeUser(async (serializedUser: any, done) => {
  try {
    console.log('Désérialisation utilisateur:', serializedUser);
    
    if (!serializedUser || !serializedUser.id) {
      return done(new Error('Données de session invalides'), null);
    }
    
    const { id, role } = serializedUser;
    
    console.log('Rôle à désérialiser:', role);
    
    let user;
    if (role === 'chauffeur') {
      user = await Chauffeurs.findById(id).exec();
      if (!user) {
        return done(new Error('Chauffeur non trouvé'), null);
      }
    } else {
      user = await Touristes.findById(id).exec();
      if (!user) {
        return done(new Error('Touriste non trouvé'), null);
      }
    }
    
    console.log('Utilisateur désérialisé:', user);
    return done(null, user);
  } catch (error) {
    console.error('Erreur lors de la désérialisation:', error);
    done(error, null);
  }
});