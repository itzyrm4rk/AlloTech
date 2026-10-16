import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const fromName = process.env.SMTP_FROM_NAME || 'AlloTech';

// Création du transporteur SMTP réutilisable
const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

function getFromHeader(): string {
  if (smtpUser) {
    return `"${fromName}" <${smtpUser}>`;
  }
  return `"${fromName}" <contact@allotech.local>`;
}

/**
 * Envoie un email contenant le code OTP de réinitialisation de mot de passe
 */
export async function sendPasswordResetOtpEmail({
  to,
  prenom,
  otp,
}: {
  to: string;
  prenom?: string;
  otp: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const salutation = prenom ? `Bonjour ${prenom},` : 'Bonjour,';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code de sécurité AlloTech</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0E1A1D; margin: 0; padding: 28px 16px; color: #F1F7F8; }
        .card { max-width: 520px; margin: 0 auto; background: #16272C; border-radius: 20px; border: 1px solid #233F47; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
        .header { background: linear-gradient(135deg, #31525B 0%, #1A2C31 100%); padding: 36px 24px; text-align: center; border-bottom: 2px solid #FFA101; }
        .brand { font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; margin: 0; }
        .brand-accent { color: #FFA101; }
        .subtitle { color: #B3DEE5; font-size: 13px; margin-top: 6px; font-weight: 500; letter-spacing: 0.3px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 17px; font-weight: 700; color: #FFFFFF; margin: 0 0 14px 0; }
        .text { font-size: 14px; color: #8BA6AD; line-height: 1.6; margin: 0 0 24px 0; }
        .otp-container { background: #0E1A1D; border: 2px dashed #FFA101; border-radius: 14px; padding: 24px 16px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 11px; text-transform: uppercase; color: #8BA6AD; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #FFA101; line-height: 1; }
        .otp-badge { display: inline-block; background: rgba(179, 222, 229, 0.12); color: #B3DEE5; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; margin-top: 12px; }
        .notice { background: rgba(250, 230, 177, 0.08); border: 1px solid rgba(250, 230, 177, 0.2); border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #FAE6B1; line-height: 1.5; margin-top: 24px; }
        .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #526C74; border-top: 1px solid #233F47; background: #122024; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="brand">Allo<span class="brand-accent">Tech</span></h1>
          <p class="subtitle">Assistance & Maintenance Informatique Terrain</p>
        </div>
        <div class="content">
          <p class="greeting">${salutation}</p>
          <p class="text">
            Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code de sécurité ci-dessous pour confirmer votre identité :
          </p>
          <div class="otp-container">
            <div class="otp-label">Code de vérification (OTP)</div>
            <div class="otp-code">${otp}</div>
            <div><span class="otp-badge">Valable pendant 15 minutes</span></div>
          </div>
          <p class="text" style="font-size: 13px;">
            Saisissez ce code sur l'écran de réinitialisation pour définir immédiatement votre nouveau mot de passe.
          </p>
          <div class="notice">
            <strong>Sécurité :</strong> Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute tranquillité. Aucun accès ne sera modifié sans ce code.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AlloTech &bull; Plateforme certifiée et sécurisée
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n======================================================');
    console.log('[EMAIL DEV MODE - CONFIGURATION GMAIL SMTP NON RENSEIGNÉE]');
    console.log(`Destinataire : ${to}`);
    console.log(`CODE OTP : ${otp}`);
    console.log('Valide 15 minutes');
    console.log('Renseignez SMTP_USER et SMTP_PASS dans .env pour envoyer de vrais emails');
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: getFromHeader(),
      to,
      subject: `AlloTech — Votre code de sécurité : ${otp}`,
      html,
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur SMTP inconnue';
    console.error("Exception lors de l'envoi email via SMTP:", errorMsg);
    console.log(`[FALLBACK OTP EN CONSOLE] Code OTP pour ${to} : ${otp}`);
    return { success: true, simulated: true, error: errorMsg };
  }
}

/**
 * Envoie un email au technicien lorsque l'administrateur active son compte
 */
export async function sendTechnicienActivationEmail({
  to,
  prenom,
  nom,
  matricule,
}: {
  to: string;
  prenom: string;
  nom: string;
  matricule: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Compte Activé — AlloTech</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0E1A1D; margin: 0; padding: 28px 16px; color: #F1F7F8; }
        .card { max-width: 520px; margin: 0 auto; background: #16272C; border-radius: 20px; border: 1px solid #233F47; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
        .header { background: linear-gradient(135deg, #31525B 0%, #1A2C31 100%); padding: 36px 24px; text-align: center; border-bottom: 2px solid #288358; }
        .badge { display: inline-block; background: rgba(40, 131, 88, 0.2); color: #B3DEE5; border: 1px solid #288358; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 5px 14px; border-radius: 20px; margin-bottom: 14px; }
        .brand { font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; margin: 0; }
        .brand-accent { color: #FFA101; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #FFFFFF; margin: 0 0 14px 0; }
        .text { font-size: 14px; color: #8BA6AD; line-height: 1.6; margin: 0 0 20px 0; }
        .id-box { background: #0E1A1D; border-left: 4px solid #FFA101; border-radius: 12px; padding: 16px 20px; margin: 24px 0; border-top: 1px solid #233F47; border-right: 1px solid #233F47; border-bottom: 1px solid #233F47; }
        .id-label { font-size: 11px; text-transform: uppercase; color: #8BA6AD; font-weight: 700; letter-spacing: 0.8px; }
        .id-value { font-size: 22px; font-weight: 800; color: #FFA101; font-family: 'Courier New', Courier, monospace; margin-top: 4px; letter-spacing: 1px; }
        .steps-card { background: #122024; border: 1px solid #233F47; border-radius: 14px; padding: 20px; margin: 24px 0; }
        .step-title { font-size: 13px; font-weight: 700; color: #B3DEE5; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .step-item { font-size: 13px; color: #CBD5E1; margin: 8px 0; line-height: 1.5; }
        .step-num { display: inline-block; width: 20px; height: 20px; background: #31525B; color: #FFA101; border-radius: 50%; text-align: center; line-height: 20px; font-size: 11px; font-weight: 800; margin-right: 8px; }
        .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #526C74; border-top: 1px solid #233F47; background: #122024; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">&bull; Compte Activé</div>
          <h1 class="brand">Allo<span class="brand-accent">Tech</span></h1>
        </div>
        <div class="content">
          <p class="greeting">Bonjour ${prenom} ${nom},</p>
          <p class="text">
            Votre compte technicien a été vérifié et validé par l'administrateur. Vous êtes désormais habilité à intervenir sur le terrain.
          </p>
          
          <div class="id-box">
            <div class="id-label">Identifiant de connexion (Matricule)</div>
            <div class="id-value">${matricule}</div>
          </div>

          <div class="steps-card">
            <div class="step-title">Pour vous connecter :</div>
            <div class="step-item"><span class="step-num">1</span> Lancez l'application mobile <strong>AlloTech</strong>.</div>
            <div class="step-item"><span class="step-num">2</span> Entrez votre matricule <strong>${matricule}</strong> et votre mot de passe.</div>
            <div class="step-item"><span class="step-num">3</span> Consultez vos tickets et démarrez vos interventions.</div>
          </div>

          <p class="text" style="font-size: 13px;">
            En cas de question ou d'oubli d'identifiant, vous pouvez joindre directement votre responsable d'équipe.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AlloTech &bull; Plateforme de maintenance informatique
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n======================================================');
    console.log('[EMAIL ACTIVATION DEV MODE]');
    console.log(`Destinataire : ${to}`);
    console.log(`Technicien : ${prenom} ${nom} (${matricule})`);
    console.log('Statut : Activé');
    console.log('Renseignez SMTP_USER et SMTP_PASS dans .env pour envoyer de vrais emails');
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: getFromHeader(),
      to,
      subject: `AlloTech — Votre compte technicien (${matricule}) est actif !`,
      html,
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur envoi email activation:', errorMsg);
    return { success: true, simulated: true, error: errorMsg };
  }
}

/**
 * Envoie un email au technicien lorsqu'une période d'indisponibilité/congé est enregistrée
 */
export async function sendTechnicienAbsenceNotificationEmail({
  to,
  prenom,
  nom,
  matricule,
  dateDebut,
  dateFin,
  motif,
}: {
  to: string;
  prenom?: string;
  nom?: string;
  matricule?: string;
  dateDebut: string;
  dateFin: string;
  motif: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const salutation = prenom ? `Bonjour ${prenom},` : 'Bonjour,';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notification d'indisponibilité AlloTech</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFB; margin: 0; padding: 28px 16px; color: #1A2C31; }
        .card { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; border: 1px solid #E2ECF0; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #31525B 0%, #1A2C31 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #FFA101; }
        .brand { font-size: 24px; font-weight: 800; color: #FFFFFF; margin: 0; }
        .brand-accent { color: #FFA101; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 17px; font-weight: 700; color: #1A2C31; margin: 0 0 12px 0; }
        .text { font-size: 14px; color: #4B6369; line-height: 1.6; margin: 0 0 20px 0; }
        .info-box { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 12px; padding: 16px; margin: 20px 0; color: #92400E; }
        .info-title { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
        .info-row { font-size: 13px; margin: 4px 0; }
        .footer { padding: 16px 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2ECF0; background: #F8FAFB; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="brand">Allo<span class="brand-accent">Tech</span></h1>
          <p style="color: #B3DEE5; font-size: 12px; margin: 4px 0 0 0;">Notification de Disponibilité</p>
        </div>
        <div class="content">
          <p class="greeting">${salutation}</p>
          <p class="text">
            Votre administrateur a enregistré une période d'absence / congé pour votre compte technicien <strong>${matricule || ''}</strong>.
          </p>
          <div class="info-box">
            <div class="info-title">Détails de la période d'indisponibilité :</div>
            <div class="info-row"><strong>Motif :</strong> ${motif}</div>
            <div class="info-row"><strong>Début :</strong> ${dateDebut}</div>
            <div class="info-row"><strong>Fin :</strong> ${dateFin}</div>
          </div>
          <p class="text" style="font-size: 13px;">
            Durant cette période, vous ne recevrez pas de nouvelles assignations d'interventions. Vos tickets en cours restent accessibles sur l'application mobile.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AlloTech &bull; Plateforme de maintenance informatique
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n======================================================');
    console.log('[EMAIL INDISPONIBILITE DEV MODE]');
    console.log(`Destinataire : ${to}`);
    console.log(`Technicien : ${prenom} ${nom} (${matricule})`);
    console.log(`Période : Du ${dateDebut} au ${dateFin} (Motif: ${motif})`);
    console.log('Renseignez SMTP_USER et SMTP_PASS dans .env pour envoyer de vrais emails');
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: getFromHeader(),
      to,
      subject: `AlloTech — Enregistrement d'une période d'absence (${motif})`,
      html,
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur envoi email absence:', errorMsg);
    return { success: true, simulated: true, error: errorMsg };
  }
}
