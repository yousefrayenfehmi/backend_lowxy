import passport from 'passport';
import { Touristes } from '../models/Touriste'; // Ajustez les chemins d'importation selon votre projet
import { Chauffeurs } from '../models/Chauffeure';

// Cette fonction détermine quelles données de l'utilisateur doivent être stockées dans la session.
// L'ID de l'utilisateur est couramment utilisé.
passport.serializeUser((user: any, done) => {
  done(null, user.id); // ou une autre clé unique de l'utilisateur
});

// Cette fonction est utilisée pour récupérer les informations de l'utilisateur depuis l'ID stocké dans la session.
passport.deserializeUser(async (id: string, done) => {
  try {
    let user = await Touristes.findById(id);
    if (!user) {
      user = await Chauffeurs.findById(id);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
