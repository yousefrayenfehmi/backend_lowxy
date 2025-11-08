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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Mailconfig_1 = require("./Mailconfig");
const EmailTemplates_1 = require("./EmailTemplates");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
class Fonction {
    constructor() {
        dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
    }
    static createtokenetcookies(res, id) {
        const token = jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'votre_secret', { expiresIn: '24h' });
        res.cookie('jwt', token, {
            httpOnly: true, // Inaccessible via JavaScript
            secure: true, // Uniquement via HTTPS
            sameSite: 'strict', // Protection CSRF
            maxAge: 24 * 60 * 60 * 1000 // Expiration (24h en millisecondes)});
        });
        return token;
    }
    static generermatricle() {
        const lettrs = this.generateRandomLetters(2);
        const numbers = this.generecode(10, 99);
        return `${lettrs}${numbers}`;
    }
    static generateRandomLetters(length) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array.from({ length }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    }
    static generecode(min, max) {
        return Math.floor(min + Math.random() * max).toString();
    }
    static sendmailCovering(email, data, url) {
        try {
            const emailhtml = EmailTemplates_1.Emailtemplates.getNewCoveringNotification({
                modele: data.modele_voiture,
                type: data.type_covering,
                prix: data.prix
            }, url);
            return Mailconfig_1.Email.getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Nouvelle opportunité de covering',
                html: emailhtml
            });
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de covering:', error);
            throw error;
        }
    }
    static sendmailAdminCovering(email, data, url) {
        try {
            const emailhtml = EmailTemplates_1.Emailtemplates.getAdminCoveringConfirmation(data, url);
            return Mailconfig_1.Email.getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Nouvelle opportunité de covering',
                html: emailhtml
            });
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de covering:', error);
            throw error;
        }
    }
    static sendmailChauffeurCovering(email, data, url) {
        try {
            const emailhtml = EmailTemplates_1.Emailtemplates.getNewCoveringNotification(data, url);
            return Mailconfig_1.Email.getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Nouvelle opportunité de covering',
                html: emailhtml
            });
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de covering:', error);
            throw error;
        }
    }
    static sendmail(email, raison, code) {
        console.log('Envoi d\'email en cours');
        try {
            // Toujours inclure admin@lowxy.fr comme destinataire (solution temporaire)
            // Gmail permet uniquement d'envoyer à sa propre adresse
            const destinataires = `admin@lowxy.fr, ${email}`;
            if (raison === 'Inscription') {
                console.log("Email utilisateur : " + process.env.EMAIL_USER);
                const emailhtml = EmailTemplates_1.Emailtemplates.getverifauEmail(code);
                return Mailconfig_1.Email.getTransporter().sendMail({
                    from: process.env.EMAIL_USER,
                    to: destinataires, // Utiliser les destinataires modifiés
                    subject: 'Code de confirmation',
                    html: emailhtml
                }, (error, info) => {
                    if (error) {
                        console.error('Erreur lors de l\'envoi de l\'email d\'inscription:', error);
                        throw error;
                    }
                    else {
                        console.log('Email d\'inscription envoyé avec succès');
                    }
                });
            }
            if (raison === 'password') {
                const emailpassword = EmailTemplates_1.Emailtemplates.getPasswordResetRequestTemplate(code);
                return Mailconfig_1.Email.getTransporter().sendMail({
                    from: process.env.EMAIL_USER,
                    to: destinataires, // Utiliser les destinataires modifiés
                    subject: 'Code de confirmation',
                    html: emailpassword
                }, (error, info) => {
                    if (error) {
                        console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
                        throw error;
                    }
                    else {
                        console.log('Email de réinitialisation envoyé avec succès');
                    }
                });
            }
            if (raison === 'matricule') {
                const emailpassword = EmailTemplates_1.Emailtemplates.getMatricule(code);
                return Mailconfig_1.Email.getTransporter().sendMail({
                    from: process.env.EMAIL_USER,
                    to: destinataires, // Utiliser les destinataires modifiés
                    subject: 'Code de confirmation',
                    html: emailpassword
                }, (error, info) => {
                    if (error) {
                        console.error('Erreur lors de l\'envoi de l\'email de Matricule:', error);
                        throw error;
                    }
                    else {
                        console.log('Email de matricule envoyé avec succès');
                    }
                });
            }
            if (raison === 'Nouvelle Opportunité Publicitaire pour votre Taxi') {
                return Mailconfig_1.Email.getTransporter().sendMail({
                    from: process.env.EMAIL_USER,
                    to: destinataires, // Utiliser les destinataires modifiés
                    subject: raison,
                    html: code // Dans ce cas, le code contient déjà le HTML formaté
                }, (error, info) => {
                    if (error) {
                        console.error('Erreur lors de l\'envoi de la notification de covering:', error);
                        throw error;
                    }
                    else {
                        console.log('Notification de covering envoyée avec succès à ' + email);
                    }
                });
            }
            throw new Error('Raison d\'email non reconnue: ' + raison);
        }
        catch (error) {
            console.error('Erreur globale dans sendmail:', error);
            throw error;
        }
    }
    static sendContactOrganisateurMail(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const html = EmailTemplates_1.Emailtemplates.getContactOrganisateurTemplate({
                    message: data.message,
                    entreprise: data.entreprise,
                    entrepriseEmail: data.entrepriseEmail,
                    entrepriseTelephone: data.entrepriseTelephone,
                    reservation_id: data.reservation_id
                });
                yield Mailconfig_1.Email.getTransporter().sendMail({
                    from: process.env.EMAIL_USER,
                    to: data.destinataire,
                    subject: data.objet,
                    html
                });
                console.log('Email de contact organisateur envoyé à', data.destinataire);
            }
            catch (error) {
                console.error('Erreur lors de l\'envoi de l\'email de contact organisateur:', error);
                throw error;
            }
        });
    }
}
exports.default = Fonction;
