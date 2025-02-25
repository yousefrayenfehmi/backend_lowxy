import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { Touristes } from '../models/Touriste';
import { Chauffeurs } from '../models/Chauffeure';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configurer la stratégie Facebook
passport.use('facebook',
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID as string,
      clientSecret: process.env.FACEBOOK_APP_SECRET as string,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL as string,
      profileFields: ['id', 'displayName', 'email', 'photos'],
      passReqToCallback: true,
    },
    async (req: Request, accessToken, refreshToken, profile, done) => {
      try {
        // Facebook peut parfois ne pas renvoyer l'email selon les paramètres de confidentialité
        const email = profile.emails && profile.emails.length > 0 
          ? profile.emails[0].value 
          : `${profile.id}@facebook.com`; // Fallback si pas d'email
        
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
          let chauffeur = await Chauffeurs.findOne({ 'info.facebook_id': profile.id });
          if (!chauffeur) {
            chauffeur = await Chauffeurs.findOne({ 'info.email': email });
          }
          
          if (!chauffeur) {
            chauffeur = new Chauffeurs({
              info: {
                nom_complet: profile.displayName,
                email: email,
                motdepasse: await bcrypt.hash('facebook', 10),
                strategy: 'facebook',
                facebook_id: profile.id,
                photo: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
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
          let touriste = await Touristes.findOne({ 'info.facebook_id': profile.id });
          console.log(touriste);
          if (!touriste) {
            touriste = await Touristes.findOne({ 'info.email': email });
          }
          
          if (!touriste) {
            touriste = new Touristes({
              info: {
                nom_complet: profile.displayName,
                email: email,
                motdepasse: await bcrypt.hash('facebook', 10),
                strategy: 'facebook',
                facebook_id: profile.id,
                photo: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
              },
              securites: { isverified: true },
            });
            await touriste.save();
            console.log('Nouveau touriste créé:', email);
          } else {
            console.log('Touriste existant trouvé:', email);
            return done(null, touriste);
          }
          
          return done(null, touriste);
        }
      } catch (error) {
        console.error('Erreur d\'authentification Facebook:', error);
        return done(error, false);
      }
    }
  )
);

// Sérialisation et désérialisation
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

export default passport;