"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Afficher le répertoire courant
console.log('Répertoire courant:', __dirname);
// Essayer de charger le .env à différents endroits
const envPaths = [
    path_1.default.resolve(__dirname, '../.env'),
    path_1.default.resolve(__dirname, '../../.env'),
    path_1.default.resolve(process.cwd(), '.env')
];
envPaths.forEach(envPath => {
    console.log(`Vérification du fichier .env à: ${envPath}`);
    if (fs_1.default.existsSync(envPath)) {
        console.log(`Fichier .env trouvé à: ${envPath}`);
        dotenv_1.default.config({ path: envPath });
    }
});
class Mailconfig {
    constructor() {
        console.log('Variables d\'environnement:');
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD);
    }
    // fonction qui configure le transporteur
    configmail() {
        // Utiliser des valeurs par défaut pour les tests si nécessaire
        const emailConfig = {
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        };
        console.log('Email config:', emailConfig);
        return emailConfig;
    }
    // fonction qui créer le transporteur
    createTransporter(emailConfig) {
        console.log('Configuration du transporteur:', {
            service: emailConfig.service,
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass
            }
        });
        const transporter = nodemailer_1.default.createTransport(emailConfig);
        return transporter;
    }
    // fonction qui verifie le transporteur
    verifytransport() {
        const emailConfig = this.configmail();
        const transporter = this.createTransporter(emailConfig);
        console.log('Vérification du transporteur...');
        transporter.verify((error, success) => {
            if (error) {
                console.error('Erreur de configuration email:', error);
            }
            else {
                console.log('Serveur prêt à envoyer des emails');
            }
        });
    }
    getTransporter() {
        return this.createTransporter(this.configmail());
    }
    getverifytransport() {
        return this.verifytransport();
    }
}
exports.Email = new Mailconfig();
console.log('Vérification du transporteur:');
exports.Email.getverifytransport();
