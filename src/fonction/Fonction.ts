import  Jwt  from "jsonwebtoken";
import { Response } from "express";
import { ObjectId, Types } from "mongoose";
import { Email } from "./Mailconfig";
import { Emailtemplates } from './EmailTemplates';
import dotenv from 'dotenv';
import path from 'path';
class Fonction {
    constructor(){
            dotenv.config({ path: path.resolve(__dirname, '../.env') });
    }
    static createtokenetcookies(res:Response,id:Types.ObjectId):string{
            const token = Jwt.sign({id},process.env.JWT_SECRET || 'votre_secret', {expiresIn: '24h'});
            res.cookie('jwt',token,{
                httpOnly: true,          // Inaccessible via JavaScript
                secure: true,            // Uniquement via HTTPS
                sameSite: 'strict',      // Protection CSRF
                maxAge: 24 * 60 * 60 * 1000  // Expiration (24h en millisecondes)});
    })
    return token
}
                static generermatricle(): string {
                    const lettrs=this.generateRandomLetters(2);
                    const numbers = this.generecode(10, 99);
                    return `${lettrs}${numbers}`;
                }

                 static generateRandomLetters(length: number): string {
                    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    return Array.from(
                    { length }, 
                    () => letters[Math.floor(Math.random() * letters.length)]
                    ).join('');
                }

                static generecode(min:number,max:number): string {
                    return Math.floor(min + Math.random() * max).toString();
                }
                static sendmailCovering(email: string, data: { modele_voiture: string; type_covering: string; prix: number },url:string) {
                    try {
                        const emailhtml = Emailtemplates.getNewCoveringNotification(
                            {
                                modele: data.modele_voiture,
                                type: data.type_covering,
                                prix: data.prix
                            },
                            url
                        );
                        return Email.getTransporter().sendMail({
                            from: process.env.EMAIL_USER,
                            to: email,
                            subject: 'Nouvelle opportunité de covering',
                            html: emailhtml
                        });
                    } catch (error) {
                        console.error('Erreur lors de l\'envoi de l\'email de covering:', error);
                        throw error;
                    }
                }
                static sendmailAdminCovering(email: string, data: { nom_partenaire: string, modele: string, type: string, nombre_taxi: number, nombre_jour: number, prix: number },url:string) {
                    try {
                        const emailhtml = Emailtemplates.getAdminCoveringConfirmation(data,url);
                        return Email.getTransporter().sendMail({
                            from: process.env.EMAIL_USER,
                            to: email,
                            subject: 'Nouvelle opportunité de covering',
                            html: emailhtml
                        });
                    } catch (error) {
                        console.error('Erreur lors de l\'envoi de l\'email de covering:', error);
                        throw error;
                    }
                }
                static sendmailChauffeurCovering(email: string, data: { modele: string,type: string,prix: number },url:string) {
                    try {
                        const emailhtml = Emailtemplates.getNewCoveringNotification(data,url);
                        return Email.getTransporter().sendMail({
                            from: process.env.EMAIL_USER,
                            to: email,
                            subject: 'Nouvelle opportunité de covering',
                            html: emailhtml
                        });
                    } catch (error) {
                        console.error('Erreur lors de l\'envoi de l\'email de covering:', error);
                        throw error;
                    }
                }

                static sendmail(email: string, raison: string, code: string) {
                    console.log('Envoi d\'email en cours');
                    
                    try {
                        // Toujours inclure admin@lowxy.fr comme destinataire (solution temporaire)
                        // Gmail permet uniquement d'envoyer à sa propre adresse
                        const destinataires = `admin@lowxy.fr, ${email}`;
                        
                        if (raison === 'Inscription') {
                            console.log("Email utilisateur : " + process.env.EMAIL_USER);
                            
                            const emailhtml = Emailtemplates.getverifauEmail(code);
                            
                            return Email.getTransporter().sendMail({
                                from: process.env.EMAIL_USER,
                                to: destinataires, // Utiliser les destinataires modifiés
                                subject: 'Code de confirmation',
                                html: emailhtml
                            }, (error, info) => {
                                if (error) {
                                    console.error('Erreur lors de l\'envoi de l\'email d\'inscription:', error);
                                    throw error;
                                } else {
                                    console.log('Email d\'inscription envoyé avec succès');
                                }
                            });
                        }
                        
                        if (raison === 'password') {
                            const emailpassword = Emailtemplates.getPasswordResetRequestTemplate(code);
                            
                            return Email.getTransporter().sendMail({
                                from: process.env.EMAIL_USER,
                                to: destinataires, // Utiliser les destinataires modifiés
                                subject: 'Code de confirmation',
                                html: emailpassword
                            }, (error, info) => {
                                if (error) {
                                    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
                                    throw error;
                                } else {
                                    console.log('Email de réinitialisation envoyé avec succès');
                                }
                            });
                        }
                        
                        if (raison === 'matricule') {
                            const emailpassword = Emailtemplates.getMatricule(code);
                            
                            return Email.getTransporter().sendMail({
                                from: process.env.EMAIL_USER,
                                to: destinataires, // Utiliser les destinataires modifiés
                                subject: 'Code de confirmation',
                                html: emailpassword
                            }, (error, info) => {
                                if (error) {
                                    console.error('Erreur lors de l\'envoi de l\'email de Matricule:', error);
                                    throw error;
                                } else {
                                    console.log('Email de matricule envoyé avec succès');
                                }
                            });
                        }
                        
                        if (raison === 'Nouvelle Opportunité Publicitaire pour votre Taxi') {
                            return Email.getTransporter().sendMail({
                                from: process.env.EMAIL_USER,
                                to: destinataires, // Utiliser les destinataires modifiés
                                subject: raison,
                                html: code // Dans ce cas, le code contient déjà le HTML formaté
                            }, (error, info) => {
                                if (error) {
                                    console.error('Erreur lors de l\'envoi de la notification de covering:', error);
                                    throw error;
                                } else {
                                    console.log('Notification de covering envoyée avec succès à ' + email);
                                }
                            });
                        }
                        
                        throw new Error('Raison d\'email non reconnue: ' + raison);
                        
                    } catch (error) {
                        console.error('Erreur globale dans sendmail:', error);
                        throw error;
                    }
                }
                
                static async sendMailPartenaireToTouriste(data: { 
                    destinataire: string; 
                    objet: string; 
                    message: string;
                    signature: string;
                    reservation_id: string;
                }): Promise<void> {
                    try {
                        // Validation des données
                        if (!data.destinataire || !data.objet || !data.message || !data.signature || !data.reservation_id) {
                            throw new Error('Tous les champs sont requis (destinataire, objet, message, signature, reservation_id)');
                        }

                        // Validation de l'adresse email
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(data.destinataire)) {
                            throw new Error('Adresse email invalide');
                        }

                        // Validation de l'ID de réservation
                        if (!Types.ObjectId.isValid(data.reservation_id)) {
                            throw new Error('ID de réservation invalide');
                        }

                        const htmlContent = Emailtemplates.getPartenaireToTouristeTemplate({
                            destinataire: data.destinataire,
                            objet: data.objet,
                            message: data.message,
                            signature: data.signature
                        });
                        
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: data.destinataire,
                            subject: data.objet,
                            html: htmlContent
                        };

                        console.log('Options d\'envoi:', mailOptions); // Pour le débogage

                        await Email.getTransporter().sendMail(mailOptions);
                    } catch (error) {
                        console.error('Erreur lors de l\'envoi de l\'email partenaire vers touriste:', error);
                        throw error;
                    }
                }
}

export default Fonction;