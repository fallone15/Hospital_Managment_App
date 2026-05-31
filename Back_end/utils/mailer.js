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

/**
 * Envoyer un email de réinitialisation du code PIN
 * @param {string} email - Email du destinataire
 * @param {string} nom - Nom du patient
 * @param {string} prenom - Prénom du patient
 * @param {string} resetUrl - URL de réinitialisation complet
 * @returns {Promise<boolean>}
 */
const sendResetPinEmail = async (email, nom, prenom, resetUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hospital.com',
      to: email,
      subject: 'Réinitialisation de votre code PIN - CareTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Réinitialisation de votre code PIN</h2>
            
            <p style="color: #666; font-size: 16px;">
              Bonjour <strong>${prenom} ${nom}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px;">
              Vous avez demandé la réinitialisation de votre code PIN CareTrack. 
              Cliquez sur le bouton ci-dessous pour définir un nouveau code PIN.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #0EA5E9; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block;">
                Réinitialiser mon code PIN
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Important :</strong> Ce lien expire dans 1 heure.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité. 
              Votre code PIN actuel restera inchangé.
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
    console.log('✅ Email de réinitialisation envoyé à:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    throw error;
  }
};

/**
 * Envoyer un message de contact à l'administration de l'hôpital
 * @param {string} email - Email de l'expéditeur
 * @param {string} nom - Nom complet de l'expéditeur
 * @param {string} message - Contenu du message
 * @returns {Promise<boolean>}
 */
const sendContactEmail = async (email, nom, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hospital.com',
      to: process.env.EMAIL_USER, // Envoyer à l'adresse de l'hôpital configurée dans le .env
      subject: `[Contact CareTrack] Nouveau message de ${nom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #3B82F6; padding: 24px; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Nouveau Message de Contact</h2>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="color: #475569; font-size: 16px; margin-top: 0;">Un visiteur a soumis un message via le formulaire de contact de la page d'accueil :</p>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 120px;">Nom complet :</td>
                  <td style="padding: 6px 0; color: #1e293b;">${nom}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Email :</td>
                  <td style="padding: 6px 0; color: #3b82f6;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></td>
                </tr>
              </table>
            </div>
            
            <h4 style="color: #1e293b; margin: 24px 0 8px 0; font-size: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Message :</h4>
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 18px; border-left: 4px solid #3B82F6; margin-bottom: 20px;">
              <p style="color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${message}</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-t: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2026 Système Hospitalier CareTrack - Plateforme Administrative
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email de contact envoyé avec succès à l\'administration de la part de:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de contact:', error);
    throw error;
  }
};

/**
 * Envoyer un email d'accusé de réception au visiteur
 * @param {string} email - Email de l'expéditeur
 * @param {string} nom - Nom complet de l'expéditeur
 * @returns {Promise<boolean>}
 */
const sendContactConfirmationEmail = async (email, nom) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hospital.com',
      to: email,
      subject: 'Nous avons bien reçu votre message - CareTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #0EA5E9; padding: 24px; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Accusé de Réception</h2>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="color: #1e293b; font-size: 16px; margin-top: 0; font-weight: bold;">Bonjour ${nom},</p>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Nous vous confirmons la bonne réception de votre message envoyé via le formulaire de contact de <strong>CareTrack</strong>.
            </p>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Notre équipe administrative ou médicale va étudier votre demande dans les plus brefs délais et reviendra vers vous si nécessaire.
            </p>
            
            <div style="margin: 30px 0 10px 0; padding: 15px; background-color: #f0f9ff; border-radius: 8px; border: 1px solid #e0f2fe; text-align: center;">
              <p style="color: #0369a1; font-size: 14px; margin: 0; font-weight: bold;">💡 Information pratique</p>
              <p style="color: #0c4a6e; font-size: 13px; margin: 5px 0 0 0;">
                Pour les urgences médicales, veuillez contacter directement le 15 ou appeler notre ligne d'urgence directe au <strong>+212 6 42 98 27 56</strong>.
              </p>
            </div>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 24px;">
              Cordialement,<br>
              <strong>L'équipe CareTrack Hospital</strong>
            </p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-t: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2026 Système Hospitalier CareTrack - Tous droits réservés
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email d\'accusé de réception envoyé avec succès à:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email d\'accusé de réception:', error);
    // On ne crash pas en cas d'erreur sur l'accusé de réception
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPinEmail,
  sendContactEmail,
  sendContactConfirmationEmail,
  transporter
};
