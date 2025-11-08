import mongoose from "mongoose";
import path from 'path';
import dotenv from 'dotenv';
import { log } from "console";

class DBConnection {
    constructor() {
        // Charger les variables d'environnement
        dotenv.config({ path: path.resolve(__dirname, '../../.env') });
        
        // Configuration Mongoose
        this.configureMongoose();
        
       
    }

    private configureMongoose() {
        // Configuration globale de Mongoose
        mongoose.set('strictQuery', false);
        mongoose.set('debug', process.env.NODE_ENV === 'development');

        // Gestion des événements de connexion
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connecté avec succès');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Erreur de connexion Mongoose:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose déconnecté');
        });
    }

    private async connectToDatabase() {
        console.log("URI de connexion MongoDB : "+process.env.MONGODB_URI);
        
        const mongoURI = process.env.MONGODB_URI || '';

        if (!mongoURI) {
            console.error('URI de connexion MongoDB non définie');
            return;
        }

        try {
            await mongoose.connect(mongoURI, {
                serverSelectionTimeoutMS: 5000, // Délai de sélection du serveur
                socketTimeoutMS: 45000, // Délai de socket
            });
        } catch (error) {
            console.error('Erreur de connexion à MongoDB:', error);
            
            // Tentative de reconnexion après un délai
            setTimeout(() => {
                this.connectToDatabase();
            }, 5000);
        }
    }

    public getConnection() {
       
            return this.connectToDatabase();
        
    }

    public async closeConnection() {
        try {
            await mongoose.connection.close();
            console.log('Connexion à MongoDB fermée');
        } catch (error) {
            console.error('Erreur lors de la fermeture de la connexion:', error);
        }
    }
}

export const dbConnection = new DBConnection();
dbConnection.getConnection();