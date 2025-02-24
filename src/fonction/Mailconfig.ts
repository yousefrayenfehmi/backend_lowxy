import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
interface EmailConfig {
    service: string;
    auth: {
        user: string | undefined;
        pass: string | undefined;
    };
}


class Mailconfig {
    constructor(){
                        dotenv.config({ path: path.resolve(__dirname, '../.env') });
                        console.log(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);

    }
    // fonction qui configure le transporteur
    private configmail(): EmailConfig {
        const emailConfig: EmailConfig = {
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        };
        return emailConfig
    }
    // fonction qui créer le transporteur
    private createTransporter(emailConfig: EmailConfig): Transporter {
        const transporter = nodemailer.createTransport(emailConfig);
        return transporter;
    }
    // fonction qui verifie le transporteur
    private verifytransport(): void {
        const emailConfig: EmailConfig = this.configmail();
        const transporter: Transporter = this.createTransporter(emailConfig);
        transporter.verify((error: Error | null, success: boolean) => {
            if (error) {
                console.error('Erreur de configuration email:', error);
            } else {
                console.log('Serveur prêt à envoyer des emails');
            }
        });
    }
    getTransporter():Transporter{
        return this.createTransporter(this.configmail())
    }
    getverifytransport():void{
        return this.verifytransport()

    }
}
export const Email=new Mailconfig()
