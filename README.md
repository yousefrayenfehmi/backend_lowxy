# Backend Lowxy

## Installation

1. Clonez ce repository
2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez les variables d'environnement :
   ```bash
   cp .env.example .env
   ```

4. Remplissez le fichier `.env` avec vos vraies valeurs (clés API, mots de passe, etc.)

5. Lancez l'application :
   ```bash
   npm start
   ```

## Variables d'environnement

Le fichier `.env.example` contient toutes les variables d'environnement nécessaires pour faire fonctionner l'application. Copiez ce fichier vers `.env` et remplissez-le avec vos vraies valeurs.

**⚠️ Important :** Ne commitez jamais votre fichier `.env` réel sur GitHub ! Il contient des informations sensibles.

## Structure du projet

- `src/` : Code source principal
- `src/Controlleur/` : Contrôleurs de l'API
- `src/models/` : Modèles de données
- `src/Routes/` : Définition des routes
- `uploads/` : Fichiers uploadés (images, vidéos, etc.)

## Technologies utilisées

- Node.js
- Express.js
- TypeScript
- MongoDB avec Mongoose
- AWS S3 pour le stockage
- Stripe pour les paiements
- Authentification OAuth (Facebook, Google)
