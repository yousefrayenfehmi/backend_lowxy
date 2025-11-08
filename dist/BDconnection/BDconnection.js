"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
class DBConnection {
    constructor() {
        // Charger les variables d'environnement
        dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
        // Configuration Mongoose
        this.configureMongoose();
    }
    configureMongoose() {
        // Configuration globale de Mongoose
        mongoose_1.default.set('strictQuery', false);
        mongoose_1.default.set('debug', process.env.NODE_ENV === 'development');
        // Gestion des événements de connexion
        mongoose_1.default.connection.on('connected', () => {
            console.log('Mongoose connecté avec succès');
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.error('Erreur de connexion Mongoose:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('Mongoose déconnecté');
        });
    }
    connectToDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("URI de connexion MongoDB : " + process.env.MONGODB_URI);
            const mongoURI = process.env.MONGODB_URI || '';
            if (!mongoURI) {
                console.error('URI de connexion MongoDB non définie');
                return;
            }
            try {
                yield mongoose_1.default.connect(mongoURI, {
                    serverSelectionTimeoutMS: 5000, // Délai de sélection du serveur
                    socketTimeoutMS: 45000, // Délai de socket
                });
            }
            catch (error) {
                console.error('Erreur de connexion à MongoDB:', error);
                // Tentative de reconnexion après un délai
                setTimeout(() => {
                    this.connectToDatabase();
                }, 5000);
            }
        });
    }
    getConnection() {
        return this.connectToDatabase();
    }
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mongoose_1.default.connection.close();
                console.log('Connexion à MongoDB fermée');
            }
            catch (error) {
                console.error('Erreur lors de la fermeture de la connexion:', error);
            }
        });
    }
}
exports.dbConnection = new DBConnection();
exports.dbConnection.getConnection();
