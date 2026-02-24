const nodemailer = require('nodemailer');

// Configuration du service d'email
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Vérifier la connexion
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Erreur de configuration email:', error.message);
  } else {
    console.log('✅ Service email configuré correctement');
  }
});

/**
 * Envoyer un email de vérification
 * @param {string} email - Email du destinataire
 * @param {string} nom - Nom du patient
 * @param {string} prenom - Prénom du patient
 * @param {string} verificationUrl - URL de vérification complet
 * @returns {Promise<boolean>} - Retourne true si succès
 */
const sendVerificationEmail = async (email, nom, prenom, verificationUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hospital.com',
      to: email,
      subject: 'Vérification de votre compte - Système Hospitalier CareTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Bienvenue sur la Plateforme Hospitalière CareTrack</h2>
            
            <p style="color: #666; font-size: 16px;">
              Bonjour <strong>${prenom} ${nom}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px;">
              Merci de vous être inscrit(e) sur notre plateforme hospitalière. Pour finaliser votre inscription et accéder à votre dashboard, 
              veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block;">
                Confirmer mon email
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px;">
              Ou copiez ce lien dans votre navigateur :<br>
              <a href="${verificationUrl}" style="color: #4CAF50; word-break: break-all;">
                ${verificationUrl}
              </a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Important :</strong> Ce lien expire dans 24 heures.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Si vous n'avez pas effectué cette inscription, veuillez ignorer cet email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Système Hospitalier CareTrack - Tous droits réservés
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de vérification envoyé à:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

/**
 * Envoyer un email de bienvenue après vérification
 * @param {string} email - Email du destinataire
 * @param {string} nom - Nom du patient
 * @param {string} prenom - Prénom du patient
 * @param {string} carteRfid - Numéro de la carte RFID
 * @returns {Promise<boolean>}
 */
const sendWelcomeEmail = async (email, nom, prenom, carteRfid) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hospital.com',
      to: email,
      subject: 'Email confirmé - Accès au Dashboard - CareTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Bienvenue ${prenom} ${nom}!</h2>
            
            <p style="color: #666; font-size: 16px;">
              Votre email a été confirmé avec succès. Vous pouvez maintenant vous connecter 
              à votre dashboard personnel.
            </p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #333; margin: 0;"><strong>🎫 Votre numéro de carte RFID :</strong></p>
              <p style="color: #4CAF50; font-size: 20px; font-weight: bold; margin: 10px 0;">
                ${carteRfid}
              </p>
              <p style="color: #999; font-size: 12px; margin: 0;">
                Conservez ce numéro en lieu sûr.
              </p>
            </div>
            
            <p style="color: #666; font-size: 16px;">
              Vous pouvez maintenant accéder à la plateforme en utilisant votre numéro de carte RFID et votre code PIN.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Système Hospitalier CareTrack - Tous droits réservés
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenue envoyé à:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  transporter
};
