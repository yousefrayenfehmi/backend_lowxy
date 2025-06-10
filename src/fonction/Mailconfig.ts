import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

interface EmailConfig {
    service: string;
    auth: {
        user: string | undefined;
        pass: string | undefined;
    };
}

// Afficher le répertoire courant
console.log('Répertoire courant:', __dirname);

// Essayer de charger le .env à différents endroits
const envPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env')
];

envPaths.forEach(envPath => {
    console.log(`Vérification du fichier .env à: ${envPath}`);
    if (fs.existsSync(envPath)) {
        console.log(`Fichier .env trouvé à: ${envPath}`);
        dotenv.config({ path: envPath });
    }
});

class Mailconfig {
    constructor(){
        console.log('Variables d\'environnement:');
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD);
    }
    
    // fonction qui configure le transporteur
    private configmail(): EmailConfig {
        // Utiliser des valeurs par défaut pour les tests si nécessaire
        const emailConfig: EmailConfig = {
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER ,
                pass: process.env.EMAIL_PASSWORD
            }
        };
        console.log('Email config:', emailConfig);
        
        return emailConfig;
    }
    
    // fonction qui créer le transporteur
    private createTransporter(emailConfig: EmailConfig): Transporter {
        console.log('Configuration du transporteur:', {
            service: emailConfig.service,
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass 
            }
        });
        const transporter = nodemailer.createTransport(emailConfig);
        return transporter;
    }
    
    // fonction qui verifie le transporteur
    private verifytransport(): void {
        const emailConfig: EmailConfig = this.configmail();
        const transporter: Transporter = this.createTransporter(emailConfig);
        
        console.log('Vérification du transporteur...');
        transporter.verify((error: Error | null, success: boolean) => {
            if (error) {
                console.error('Erreur de configuration email:', error);
            } else {
                console.log('Serveur prêt à envoyer des emails');
            }
        });
    }
    
    getTransporter():Transporter{
        return this.createTransporter(this.configmail());
    }
    
    getverifytransport():void{
        return this.verifytransport();
    }
}

export const Email = new Mailconfig();
console.log('Vérification du transporteur:');
Email.getverifytransport();
