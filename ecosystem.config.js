module.exports = {
  apps: [
    {
      name: 'backend_lowxy',
      script: 'dist/index.js',       // Ton build TypeScript
      instances: 'max',              // Utilise tous les CPU disponibles
      exec_mode: 'cluster',           // Mode cluster
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10
    }
  ],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'IP_DE_TON_SERVEUR',
      ref: 'origin/main',
      repo: 'https://github.com/TON_USERNAME/backend_lowxy.git',
      path: '/var/www/backend_lowxy',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    }
  }
};
