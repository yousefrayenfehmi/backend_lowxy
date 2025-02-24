import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Chauffeurs } from '../models/Chauffeure';  // Assurez-vous d'importer le modèle des chauffeurs
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configurer la stratégie Google pour Chauffeur
passport.use('google-chauffeur', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Vérifiez si profile.emails est défini et a des valeurs
      const email = profile.emails ? profile.emails[0].value : null;
  
      if (!email) {
        return done(new Error('Aucun email trouvé dans le profil Google'), false);
      }
  
      const chauffeur = await Chauffeurs.findOne({ googleId: profile.id });
  
      if (chauffeur) {
        return done(null, chauffeur);  // Si le chauffeur existe, il est retourné
      }
  
      // Si le chauffeur n'existe pas, créez un nouveau chauffeur
      const newChauffeur = new Chauffeurs({
        googleId: profile.id,
        name: profile.displayName,
        email: email,  // Utiliser l'email récupéré après vérification
      });
  
      await newChauffeur.save();  // Sauvegardez le nouveau chauffeur dans la base de données
      return done(null, newChauffeur);  // Retourner le chauffeur nouvellement créé
    } catch (error) {
      return done(error, false);  // En cas d'erreur, passer l'erreur à done
    }
  }));

// Sérialisation et désérialisation de l'utilisateur
passport.serializeUser((user: any, done) => {
  done(null, user.id);  // Sérialiser l'utilisateur avec son id
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const chauffeur = await Chauffeurs.findById(id);  // Rechercher le chauffeur par son id dans la base de données
    if (chauffeur) {
      return done(null, chauffeur);  // Retourner le chauffeur s'il existe
    }
    done(null, false);  // Si le chauffeur n'est pas trouvé, passer false
  } catch (error) {
    done(error, false);  // En cas d'erreur, passer l'erreur à done
  }
});
