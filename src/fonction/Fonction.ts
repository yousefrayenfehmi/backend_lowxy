import  Jwt  from "jsonwebtoken";
import { Response } from "express";
import { ObjectId, Types } from "mongoose";
import { Email } from "./Mailconfig";
import { Emailtemplates } from "./EmailTemplates"; 
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

                static generecode(): string {
                    return Math.floor(100000 + Math.random() * 900000).toString();
                }
                static sendmail(email: string, raison: string, code: string) {
                    console.log('Envoi d\'email en cours');
                    
                    try {
                        if (raison === 'Inscription') {
                            
                            console.log("Email utilisateur : " + process.env.EMAIL_USER);
                            
                            const emailhtml = Emailtemplates.getverifauEmail(code);
                            
                            return Email.getTransporter().sendMail({
                                from: process.env.EMAIL_USER,
                                to: email,
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
                                to: email,
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
                        
                        throw new Error('Raison d\'email non reconnue');
                        
                    } catch (error) {
                        console.error('Erreur globale dans sendmail:', error);
                        throw error;
                    }
                }

    
}

export default Fonction;