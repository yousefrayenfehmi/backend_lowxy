# Utiliser une image Node.js officielle comme base
FROM node:22

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris les devDependencies)
RUN npm install

# Copier les fichiers sources du projet
COPY . .

# Compiler TypeScript en JavaScript
RUN npm run build

# Exposer le port sur lequel l'app va tourner
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["npm", "start"]