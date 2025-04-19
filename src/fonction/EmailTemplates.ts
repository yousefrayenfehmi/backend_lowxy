class EmailTemplates{
        private  VERIFICATION_EMAIL_TEMPLATE(code:string):string{
            return `<!DOCTYPE html>
                <html lang="fr">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Vérifiez Votre Email</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Vérifiez Votre Email</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <p>Bonjour,</p>
                    <p>Merci de vous être inscrit ! Votre code de vérification est :${code}</p>
                    <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">${code}</span>
                    </div>
                    <p>Entrez ce code sur la page de vérification pour compléter votre inscription.</p>
                    <p>Ce code expirera dans 15 minutes pour des raisons de sécurité.</p>
                    <p>Si vous n'avez pas créé de compte chez nous, veuillez ignorer cet email.</p>
                    <p>Cordialement,<br>L'équipe LOWXY</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
                    <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                </div>
                </body>
                </html>`
        }
         private    PASSWORD_RESET_REQUEST_TEMPLATE = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Reset Your Password</title>
                        </head>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Password Reset</h1>
                        </div>
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <p>Hello,</p>
                            <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
                            <p>To reset your password, click the button below:</p>
                            <div style="text-align: center; margin: 30px 0;">
                            <a href="{resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                            </div>
                            <p>This link will expire in 1 hour for security reasons.</p>
                            <p>Best regards,<br>Your App Team</p>
                        </div>
                        <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                        </body>
                        </html>
                        `;


                        private MATRICULE_TEMPLATE(matricule: string): string {
                            return `<!DOCTYPE html>
                            <html lang="fr">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Votre Matricule de Taxi</title>
                            </head>
                            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: linear-gradient(to right, #2196F3, #1976D2); padding: 20px; text-align: center;">
                                    <h1 style="color: white; margin: 0;">Votre Matricule de Taxi</h1>
                                </div>
                                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                    <p>Bonjour,</p>
                                    <p>Voici votre matricule de taxi officiel :</p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #2196F3; 
                                                     border: 2px solid #2196F3; 
                                                     padding: 10px 20px; 
                                                     border-radius: 10px;">
                                            ${matricule}
                                        </span>
                                    </div>
                                    
                                    <p>Ce matricule est unique et vous identifie en tant que chauffeur professionnel.</p>
                                    
                                    <h3>Informations importantes :</h3>
                                    <ul>
                                        <li>Conservez ce matricule précieusement</li>
                                        <li>Il sera nécessaire pour vos différentes démarches professionnelles</li>
                                        <li> Partagez avec vos clients et gagnez de l'argent</li>
                                    </ul>
                                    
                                    <p>Cordialement,<br>L'équipe LOWXY</p>
                                </div>
                                <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
                                    <p>Ceci est un message automatique généré par notre système.</p>
                                </div>
                            </body>
                            </html>`;
                        }

        private NEW_COVERING_TEMPLATE(details: {modele: string, type: string, prix: number}): string {
            return `<!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Nouvelle Opportunité de Covering</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(to right, #FF9800, #F57C00); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Nouvelle Opportunité Publicitaire</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <p>Bonjour,</p>
                    <p>Une nouvelle campagne publicitaire est disponible pour votre taxi !</p>
                    
                    <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <h3 style="color: #FF9800; margin-top: 0;">Détails de la campagne :</h3>
                        <ul style="padding-left: 20px;">
                            <li><strong>Modèle de véhicule :</strong> ${details.modele}</li>
                            <li><strong>Type de covering :</strong> ${details.type}</li>
                            <li><strong>Rémunération :</strong> ${details.prix}€</li>
                        </ul>
                    </div>
                    
                    <p>Ne manquez pas cette opportunité de générer des revenus supplémentaires !</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{coveringURL}" style="background-color: #FF9800; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Voir les détails</a>
                    </div>
                    
                    <p>Pour participer à cette campagne, connectez-vous à votre compte chauffeur et rejoignez la campagne.</p>
                    
                    <p>Cordialement,<br>L'équipe LOWXY</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
                    <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                </div>
            </body>
            </html>`;
        }

        getverifauEmail(code: string): string {
            return this.VERIFICATION_EMAIL_TEMPLATE(code);
        }
        getPasswordResetRequestTemplate(resetURL: string): string {
            return this.PASSWORD_RESET_REQUEST_TEMPLATE.replace('{resetURL}', resetURL);
        }
        getMatricule(matricule: string): string {
            return this.MATRICULE_TEMPLATE(matricule);
        }
        getNewCoveringNotification(details: {modele: string, type: string, prix: number}, coveringURL: string): string {
            return this.NEW_COVERING_TEMPLATE(details).replace('{coveringURL}', coveringURL);
        }
}

export const Emailtemplates=new EmailTemplates()
