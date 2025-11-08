module.exports = {
  apps: [{
    name: 'backend_lowxy',
    script: 'dist/index.js',
    instances: 'max', // Utilise tous les CPU disponibles
    exec_mode: 'cluster', // Mode cluster pour la production
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Configuration des logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,

    // Configuration du redémarrage automatique
    watch: false,
    max_memory_restart: '1G', // Redémarre si > 1GB RAM
    restart_delay: 4000,
    autorestart: true,

    // Configuration des tentatives de redémarrage
    min_uptime: '10s',
    max_restarts: 10,

    // Variables d'environnement supplémentaires
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }],

  // Configuration du déploiement (optionnel)
  deploy: {
    production: {
      user: 'node',
      host: 'votre-serveur-ovh.com',
      ref: 'origin/main',
      repo: 'https://github.com/votre-username/backend_lowxy.git',
      path: '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

