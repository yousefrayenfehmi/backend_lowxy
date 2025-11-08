# 🚀 Guide de Déploiement OVH - Backend Lowxy

## 📋 Checklist avant déploiement

- [ ] Serveur OVH commandé avec Ubuntu 20.04+
- [ ] Accès SSH configuré
- [ ] Domaine acheté et DNS configuré
- [ ] Variables d'environnement de production prêtes
- [ ] Base de données MongoDB configurée (locale ou Atlas)
- [ ] Certificats SSL prêts (Let's Encrypt)

## ⚡ Déploiement rapide (5 minutes)

### 1. Connexion SSH
```bash
ssh root@votre-serveur-ovh.com
# ou
ssh utilisateur@votre-serveur-ovh.com
```

### 2. Installation automatique
```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation PM2 globalement
sudo npm install -g pm2

# Installation Nginx
sudo apt install -y nginx

# Installation Git
sudo apt install -y git

# Installation utilitaires
sudo apt install -y curl wget htop ufw
```

### 3. Configuration firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 4. Déploiement application
```bash
# Créer répertoire application
sudo mkdir -p /var/www/backend_lowxy
sudo chown -R $USER:$USER /var/www/backend_lowxy

# Cloner repository
cd /var/www/backend_lowxy
git clone https://github.com/votre-username/backend_lowxy.git .

# Installer dépendances
npm install --production

# Build application
npm run build
```

### 5. Configuration environnement
```bash
# Copier et configurer .env
cp .env.example .env
nano .env

# Variables critiques à vérifier :
# MONGODB_URI=mongodb://localhost:27017/lowxy_prod
# JWT_SECRET=votre_secret_jwt_complexe
# NODE_ENV=production
# PORT=3000
```

### 6. Configuration PM2
```bash
# Démarrer avec PM2
pm2 start ecosystem.config.js --env production

# Sauvegarder configuration PM2
pm2 save

# Configurer PM2 au démarrage système
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 7. Configuration Nginx
```bash
# Copier configuration Nginx
sudo cp nginx.production.conf /etc/nginx/sites-available/backend_lowxy

# Éditer la configuration avec votre domaine
sudo nano /etc/nginx/sites-available/backend_lowxy
# Remplacer "votre-domaine.com" par votre vrai domaine

# Activer le site
sudo ln -sf /etc/nginx/sites-available/backend_lowxy /etc/nginx/sites-enabled/

# Supprimer configuration par défaut
sudo rm -f /etc/nginx/sites-enabled/default

# Tester configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 8. Configuration SSL (HTTPS)
```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Configurer renouvellement automatique
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔍 Vérifications post-déploiement

### Status des services
```bash
# Vérifier PM2
pm2 status
pm2 logs backend_lowxy

# Vérifier Nginx
sudo systemctl status nginx

# Vérifier Node.js
curl http://localhost:3000/health
```

### Tests fonctionnels
```bash
# Test HTTP
curl -I http://votre-domaine.com

# Test HTTPS
curl -I https://votre-domaine.com

# Test API
curl https://votre-domaine.com/api/some-endpoint
```

## 🛠 Commandes de maintenance

### Mise à jour application
```bash
cd /var/www/backend_lowxy
git pull origin main
npm install --production
npm run build
pm2 restart backend_lowxy
```

### Logs et monitoring
```bash
# Logs application
pm2 logs backend_lowxy

# Logs Nginx
sudo tail -f /var/log/nginx/backend_lowxy.access.log
sudo tail -f /var/log/nginx/backend_lowxy.error.log

# Monitoring système
htop
df -h
free -h
```

### Sauvegarde
```bash
# Sauvegarde base de données (si MongoDB local)
mongodump --db lowxy_prod --out /var/backups/$(date +%Y%m%d_%H%M%S)

# Sauvegarde fichiers uploads
tar -czf /var/backups/uploads_$(date +%Y%m%d).tar.gz /var/www/backend_lowxy/uploads/
```

## 🚨 Dépannage

### Application ne démarre pas
```bash
# Vérifier logs PM2
pm2 logs backend_lowxy --lines 100

# Vérifier variables d'environnement
cat .env | grep -v PASSWORD

# Tester build
npm run build
```

### Nginx erreur 502
```bash
# Vérifier si Node.js écoute sur le port 3000
netstat -tlnp | grep 3000

# Vérifier configuration Nginx
sudo nginx -t

# Redémarrer services
sudo systemctl reload nginx
pm2 restart backend_lowxy
```

### Problème SSL
```bash
# Renouveler certificat
sudo certbot renew

# Vérifier certificat
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs (`pm2 logs` et logs Nginx)
2. Testez localement avec la même configuration
3. Vérifiez les variables d'environnement
4. Consultez la documentation OVH

## 🎯 Performance

### Optimisations recommandées
- Utiliser MongoDB Atlas pour la base de données
- Configurer Cloudflare pour le CDN
- Activer la compression Gzip
- Configurer le cache Redis (si nécessaire)
- Monitorer les ressources avec Grafana/Prometheus

---

**Temps estimé :** 15-30 minutes
**Coût estimé :** 10-20€/mois (serveur OVH)
