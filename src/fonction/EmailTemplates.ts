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
         getverifauEmail(code: string): string {
            return this.VERIFICATION_EMAIL_TEMPLATE(code);
        }
        getPasswordResetRequestTemplate(resetURL: string): string {
            return this.PASSWORD_RESET_REQUEST_TEMPLATE.replace('{resetURL}', resetURL);
        }
}

export const Emailtemplates=new EmailTemplates()
