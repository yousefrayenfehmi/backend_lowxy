# Backend Lowxy

API backend pour l'application Lowxy - Service de transport et tourisme.

## 🚀 Déploiement sur OVH

### Prérequis sur le serveur OVH

Assurez-vous que votre serveur OVH a :
- Ubuntu/Debian 20.04 ou supérieur
- Au moins 2GB RAM
- 20GB espace disque
- Accès root ou sudo

### Déploiement automatique

1. **Connectez-vous à votre serveur OVH :**
   ```bash
   ssh utilisateur@votre-serveur-ovh.com
   ```

2. **Clonez le repository :**
   ```bash
   git clone https://github.com/votre-username/backend_lowxy.git
   cd backend_lowxy
   ```

3. **Exécutez le script de déploiement :**
   ```bash
   ./deploy.sh
   ```

4. **Configurez les variables d'environnement :**
   ```bash
   nano .env
   ```
   Remplissez toutes les variables avec vos vraies valeurs de production.

5. **Redémarrez l'application :**
   ```bash
   pm2 restart backend_lowxy
   ```

### Configuration SSL (HTTPS)

Après le déploiement, configurez HTTPS avec Let's Encrypt :

```bash
# Remplacer votre-domaine.com par votre vrai domaine
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

### Monitoring

- **Logs de l'application :** `pm2 logs backend_lowxy`
- **Status PM2 :** `pm2 status`
- **Logs Nginx :** `sudo tail -f /var/log/nginx/backend_lowxy.access.log`

## 🛠 Installation en développement local

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
   npm run dev  # Mode développement avec hot reload
   # ou
   npm start    # Mode production
   ```

## 📋 Variables d'environnement

Le fichier `.env.example` contient toutes les variables d'environnement nécessaires pour faire fonctionner l'application. Copiez ce fichier vers `.env` et remplissez-le avec vos vraies valeurs.

**⚠️ Important :** Ne commitez jamais votre fichier `.env` réel sur GitHub ! Il contient des informations sensibles.

### Variables principales :
- `MONGODB_URI` : URL de connexion MongoDB
- `JWT_SECRET` : Clé secrète pour JWT
- `AWS_ACCESS_KEY_ID` : Clé AWS pour S3
- `STRIPE_WEBHOOK_SECRET` : Clé Stripe pour webhooks
- `EMAIL_USER`/`EMAIL_PASSWORD` : Configuration email

## 🏗 Structure du projet

- `src/` : Code source principal
  - `src/Controlleur/` : Contrôleurs de l'API
  - `src/models/` : Modèles de données MongoDB
  - `src/Routes/` : Définition des routes Express
  - `src/middleware/` : Middlewares personnalisés
- `uploads/` : Fichiers uploadés (images, vidéos, documents)
- `data/` : Données OSM pour les POI
- `docs/` : Documentation API

## 🛠 Technologies utilisées

- **Runtime :** Node.js 20.x
- **Framework :** Express.js
- **Langage :** TypeScript
- **Base de données :** MongoDB avec Mongoose
- **Stockage :** AWS S3
- **Paiements :** Stripe
- **Authentification :** JWT + OAuth (Facebook, Google)
- **Email :** Nodemailer
- **Process management :** PM2
- **Serveur web :** Nginx
- **Containerisation :** Docker (optionnel)

## 📊 Scripts disponibles

```bash
npm run dev      # Développement avec hot reload
npm run build    # Compiler TypeScript
npm run start    # Production (avec build préalable)
npm run prod     # Production directe
npm run deploy   # Build + production
```

## 🔧 Maintenance serveur

### Mise à jour de l'application :
```bash
cd /var/www/backend_lowxy
git pull origin main
npm install --production
npm run build
pm2 restart backend_lowxy
```

### Sauvegarde base de données :
```bash
mongodump --db votre_base --out /path/to/backup/$(date +%Y%m%d_%H%M%S)
```

### Monitoring des ressources :
```bash
htop                    # Monitoring système
pm2 monit              # Monitoring PM2
df -h                  # Espace disque
free -h               # Mémoire
```
