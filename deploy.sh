#!/bin/bash

# Script de déploiement pour le serveur OVH
# Utilisation: ./deploy.sh

echo "🚀 Début du déploiement sur le serveur OVH..."

# Variables
APP_NAME="backend_lowxy"
APP_DIR="/var/www/$APP_NAME"
NODE_VERSION="20"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'affichage des messages
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."

    # Vérifier si Node.js est installé
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé. Installation en cours..."
        curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    # Vérifier si npm est installé
    if ! command -v npm &> /dev/null; then
        error "npm n'est pas installé."
        exit 1
    fi

    # Vérifier si git est installé
    if ! command -v git &> /dev/null; then
        log "Installation de git..."
        sudo apt-get update
        sudo apt-get install -y git
    fi

    # Vérifier si pm2 est installé
    if ! command -v pm2 &> /dev/null; then
        log "Installation de PM2..."
        sudo npm install -g pm2
    fi

    log "Prérequis vérifiés ✓"
}

# Configuration du firewall
setup_firewall() {
    log "Configuration du firewall..."

    # Ouvrir les ports nécessaires
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 3000/tcp  # Application Node.js

    # Activer le firewall
    sudo ufw --force enable

    log "Firewall configuré ✓"
}

# Installation et configuration de Nginx
setup_nginx() {
    log "Configuration de Nginx..."

    # Installer Nginx si pas déjà installé
    if ! command -v nginx &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y nginx
    fi

    # Créer la configuration Nginx pour l'application
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Logs
    access_log /var/log/nginx/$APP_NAME.access.log;
    error_log /var/log/nginx/$APP_NAME.error.log;

    # Proxy vers l'application Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Fichiers statiques (optionnel)
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Activer le site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

    # Supprimer la configuration par défaut
    sudo rm -f /etc/nginx/sites-enabled/default

    # Tester et recharger Nginx
    sudo nginx -t
    sudo systemctl reload nginx
    sudo systemctl enable nginx

    log "Nginx configuré ✓"
}

# Déploiement de l'application
deploy_app() {
    log "Déploiement de l'application..."

    # Créer le répertoire de l'application
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR

    # Cloner ou mettre à jour le repository
    if [ ! -d "$APP_DIR/.git" ]; then
        log "Clonage du repository..."
        git clone https://github.com/votre-username/backend_lowxy.git $APP_DIR
    else
        log "Mise à jour du repository..."
        cd $APP_DIR
        git pull origin main
    fi

    cd $APP_DIR

    # Installer les dépendances
    log "Installation des dépendances..."
    npm install --production

    # Build de l'application
    log "Build de l'application..."
    npm run build

    # Configuration des variables d'environnement
    if [ ! -f ".env" ]; then
        warning "Le fichier .env n'existe pas. Copiez .env.example vers .env et configurez-le."
        cp .env.example .env
    fi

    log "Application déployée ✓"
}

# Configuration de PM2
setup_pm2() {
    log "Configuration de PM2..."

    cd $APP_DIR

    # Créer le fichier de configuration PM2
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/$APP_NAME-error.log',
    out_file: '/var/log/pm2/$APP_NAME-out.log',
    log_file: '/var/log/pm2/$APP_NAME.log',
    time: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000,
    autorestart: true
  }]
};
EOF

    # Créer le répertoire de logs pour PM2
    sudo mkdir -p /var/log/pm2
    sudo chown -R $USER:$USER /var/log/pm2

    # Démarrer l'application avec PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup

    log "PM2 configuré ✓"
}

# Configuration SSL avec Let's Encrypt
setup_ssl() {
    log "Configuration SSL avec Let's Encrypt..."

    # Installer Certbot
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx

    # Obtenir le certificat SSL (remplacer votre-domaine.com)
    warning "Remplissez la commande suivante avec votre domaine réel:"
    echo "sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com"

    log "SSL prêt à être configuré"
}

# Fonction principale
main() {
    log "Début de l'installation complète..."

    check_prerequisites
    setup_firewall
    setup_nginx
    deploy_app
    setup_pm2

    log "Installation terminée ! 🎉"
    log "Prochaines étapes :"
    log "1. Configurez votre fichier .env avec les vraies valeurs"
    log "2. Configurez SSL avec Let's Encrypt (voir setup_ssl)"
    log "3. Testez votre application"
    log "4. Configurez votre domaine DNS pour pointer vers ce serveur"

    warning "N'oubliez pas de remplacer 'votre-domaine.com' par votre vrai domaine dans la configuration Nginx!"
}

# Exécution
main "$@"
