import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    return url.replace(/\/$/, "");
  }
  return "https://mrscorlayrecrutement.vercel.app";
}

function getLogoConfig() {
  const logoPath = path.join(process.cwd(), "public", "logo-mrs.png");
  if (fs.existsSync(logoPath)) {
    return {
      src: "cid:logo-mrs",
      attachments: [
        {
          filename: "logo-mrs.png",
          path: logoPath,
          cid: "logo-mrs",
        },
      ],
    };
  }
  return {
    src: `${getAppUrl()}/logo-mrs.png`,
    attachments: [],
  };
}

export interface SendInvitationEmailParams {
  to: string;
  candidateName: string;
  campaignTitle: string;
  invitationUrl: string;
  expiresInDays?: number; // conservé pour compatibilité, converti en heures si fourni
}

export async function sendInvitationEmail({
  to,
  candidateName,
  campaignTitle,
  invitationUrl,
  expiresInDays = 1,
}: SendInvitationEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  let senderName = "MRS & CORLAY Recrutement";
  if (process.env.SMTP_FROM) {
    const cleaned = process.env.SMTP_FROM.replace(/\\"/g, '"').replace(/^"/, '').replace(/"$/, '');
    const nameMatch = cleaned.match(/^"?([^<"]+)"?\s*</);
    if (nameMatch && nameMatch[1]) {
      senderName = nameMatch[1].trim();
    }
  }

  const fromSender = {
    name: senderName,
    address: user || "lodouiran@mrsholdings.com",
  };

  if (!host || !user || !pass) {
    console.log(`[Email Simulation] Invitation envoyée à ${to} (${candidateName}) pour "${campaignTitle}": ${invitationUrl}`);
    return {
      success: true,
      simulated: true,
      message: "SMTP non configuré dans .env : envoi simulé en console.",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  const { src: logoSrc, attachments } = getLogoConfig();

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .wrapper { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #E06810 0%, #B44E09 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; letter-spacing: 0.05em; text-transform: uppercase; }
        .content { padding: 36px 32px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .lead { font-size: 14px; color: #334155; margin-bottom: 20px; }
        .info-card { background: #fffaf0; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 18px 20px; margin: 24px 0; color: #7c2d12; font-size: 13px; }
        .info-title { font-weight: 800; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; color: #9a3412; }
        .btn-wrapper { text-align: center; margin: 32px 0 24px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #E06810 0%, #B44E09 100%); color: #ffffff !important; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 14px rgba(224,104,16,0.35); }
        .direct-link { font-size: 12px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; word-break: break-all; margin-top: 16px; }
        .footer { background: #f8fafc; padding: 20px 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <img src="${logoSrc}"
               alt="MRS &amp; CORLAY"
               width="72" height="72"
               style="border-radius: 12px; margin-bottom: 14px; display: block; margin-left: auto; margin-right: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.25);" />
          <h1>MRS &amp; CORLAY HOLDINGS</h1>
          <p>Direction des Ressources Humaines</p>
        </div>
        
        <div class="content">
          <div class="greeting">Bonjour ${candidateName},</div>
          
          <p class="lead">
            Nous avons le plaisir de vous informer que votre candidature a été retenue pour participer à l'épreuve d'évaluation technique en ligne relative au poste :<br/>
            <strong style="color: #E06810; font-size: 15px;">« ${campaignTitle} »</strong>.
          </p>

          <div class="info-card">
            <div class="info-title">📋 Consignes importantes de composition :</div>
            <ul style="margin: 6px 0 0; padding-left: 18px; line-height: 1.6;">
              <li>Installez-vous dans un endroit calme avec une <strong>connexion internet stable</strong>.</li>
              <li>Le chronomètre se déclenchera dès la confirmation de votre identité.</li>
              <li>Toute sortie de page ou tentative de triche sera journalisée.</li>
              <li>Ce lien d'accès personnel restera valide pendant <strong>24 heures</strong>.</li>
            </ul>
          </div>

          <div class="btn-wrapper">
            <a href="${invitationUrl}" class="btn">
              Démarrer mon évaluation technique &rarr;
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
            Si le bouton ci-dessus ne fonctionne pas, copiez et collez l'adresse suivante directement dans la barre d'adresse de votre navigateur :
          </p>
          <div class="direct-link">
            <a href="${invitationUrl}" style="color: #E06810; text-decoration: underline;">${invitationUrl}</a>
          </div>

          <p style="font-size: 13px; color: #475569; margin-top: 28px;">
            Nous vous souhaitons pleine réussite dans le passage de cette épreuve.<br/>
            Bien cordialement,<br/>
            <strong>Le Comité de Recrutement MRS &amp; CORLAY</strong>
          </p>
        </div>

        <div class="footer">
          MRS &amp; CORLAY Holdings · Système automatisé d'évaluation des compétences · Cet email est envoyé automatiquement, merci de ne pas y répondre directement.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Bonjour ${candidateName},

Votre candidature a été retenue pour participer à l'épreuve d'évaluation technique pour le poste : "${campaignTitle}".

Accédez directement à votre session d'examen via le lien suivant :
${invitationUrl}

Consignes :
- Assurez-vous de disposer d'une connexion internet stable.
- Le chronomètre se déclenche dès votre confirmation d'identité.
- Ce lien est personnel et restera accessible pendant 24 heures.

Nous vous souhaitons un excellent passage d'épreuve.

Cordialement,
Le Comité de Recrutement MRS & CORLAY`;

  try {
    const info = await transporter.sendMail({
      from: fromSender,
      to,
      subject: `Convocation à l'épreuve d'évaluation technique — ${campaignTitle}`,
      text,
      html,
      attachments,
    });

    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur d'envoi SMTP";
    console.error(`[SMTP ERROR] Échec de l'envoi d'email à ${to}:`, msg);
    return { success: false, simulated: false, error: msg };
  }
}

export interface SendResultEmailParams {
  to: string;
  candidateName: string;
  campaignTitle: string;
  score: number;
  passingScore?: number;
}

export async function sendResultEmail({
  to,
  candidateName,
  campaignTitle,
  score,
  passingScore = 60,
}: SendResultEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  let senderName = "MRS & CORLAY Recrutement";
  if (process.env.SMTP_FROM) {
    const cleaned = process.env.SMTP_FROM.replace(/\\"/g, '"').replace(/^"/, "").replace(/"$/, "");
    const nameMatch = cleaned.match(/^"?([^<"]+)"?\s*</);
    if (nameMatch && nameMatch[1]) {
      senderName = nameMatch[1].trim();
    }
  }

  const fromSender = {
    name: senderName,
    address: user || "lodouiran@mrsholdings.com",
  };

  const isEligible = score >= passingScore;

  if (!host || !user || !pass) {
    console.log(
      `[Email Simulation] Résultat envoyé à ${to} (${candidateName}) pour "${campaignTitle}": score=${score}%, admissible=${isEligible}`
    );
    return {
      success: true,
      simulated: true,
      message: "SMTP non configuré : envoi simulé en console.",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const { src: logoSrc, attachments } = getLogoConfig();

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .wrapper { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #E06810 0%, #B44E09 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; letter-spacing: 0.05em; text-transform: uppercase; }
        .content { padding: 36px 32px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .score-card { background: ${isEligible ? "#f0fdf4" : "#fff7ed"}; border: 2px solid ${isEligible ? "#86efac" : "#fed7aa"}; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0; }
        .score-val { font-size: 38px; font-weight: 900; color: ${isEligible ? "#15803d" : "#c2410c"}; }
        .score-label { font-size: 13px; font-weight: 700; color: #475569; margin-top: 4px; }
        .footer { background: #f8fafc; padding: 20px 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <img src="${logoSrc}" alt="MRS &amp; CORLAY" width="72" height="72"
               style="border-radius: 12px; margin-bottom: 14px; display: block; margin-left: auto; margin-right: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.25);" />
          <h1>MRS &amp; CORLAY HOLDINGS</h1>
          <p>Direction des Ressources Humaines</p>
        </div>
        
        <div class="content">
          <div class="greeting">Bonjour ${candidateName},</div>
          
          <p>
            Nous vous remercions pour votre participation à l'épreuve d'évaluation technique en ligne relative au poste :<br/>
            <strong style="color: #E06810; font-size: 15px;">« ${campaignTitle} »</strong>.
          </p>

          <p>
            Votre copie a été officiellement corrigée et validée par notre jury d'évaluation. Voici votre résultat global :
          </p>

          <div class="score-card">
            <div class="score-val">${score}%</div>
            <div class="score-label">
              ${isEligible ? "✓ Seuil de réussite atteint (≥ " + passingScore + "%)" : "Seuil minimum requis : " + passingScore + "%"}
            </div>
          </div>

          <p style="font-size: 14px; color: #334155;">
            ${
              isEligible
                ? "Félicitations ! Votre performance vous qualifie pour la suite du processus de sélection. Notre équipe des Ressources Humaines prendra contact avec vous prochainement pour les prochaines étapes."
                : "Nous vous remercions chaleureusement pour l'intérêt porté à notre Groupe. Bien que votre candidature n'ait pas atteint le seuil requis pour cette session, votre profil est conservé dans notre vivier pour de futures opportunités."
            }
          </p>

          <p style="font-size: 13px; color: #475569; margin-top: 24px;">
            Bien cordialement,<br/>
            <strong>Le Comité de Recrutement MRS &amp; CORLAY</strong>
          </p>
        </div>

        <div class="footer">
          MRS &amp; CORLAY Holdings · Système automatisé d'évaluation des compétences · Cet email est envoyé automatiquement, merci de ne pas y répondre directement.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Bonjour ${candidateName},

Votre évaluation pour l'épreuve "${campaignTitle}" a été officiellement corrigée.

Votre résultat global : ${score}% (Seuil requis : ${passingScore}%).

${
  isEligible
    ? "Félicitations ! Vous êtes qualifié(e) pour les prochaines étapes de recrutement. Notre équipe RH vous contactera sous peu."
    : "Nous vous remercions pour votre participation. Bien que le seuil n'ait pas été atteint pour cette session, votre profil reste dans notre vivier de candidats."
}

Cordialement,
Le Comité de Recrutement MRS & CORLAY`;

  try {
    const info = await transporter.sendMail({
      from: fromSender,
      to,
      subject: `Résultat de votre évaluation technique — ${campaignTitle}`,
      text,
      html,
      attachments,
    });
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur d'envoi SMTP";
    console.error(`[SMTP ERROR] Échec envoi résultat à ${to}:`, msg);
    return { success: false, simulated: false, error: msg };
  }
}

export interface SendApplicationConfirmationEmailParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyLabel: string;
}

export async function sendApplicationConfirmationEmail({
  to,
  candidateName,
  jobTitle,
  companyLabel,
}: SendApplicationConfirmationEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  let senderName = "MRS & CORLAY Recrutement";
  if (process.env.SMTP_FROM) {
    const cleaned = process.env.SMTP_FROM.replace(/\\"/g, '"').replace(/^"/, "").replace(/"$/, "");
    const nameMatch = cleaned.match(/^"?([^<"]+)"?\s*</);
    if (nameMatch && nameMatch[1]) {
      senderName = nameMatch[1].trim();
    }
  }

  const fromSender = {
    name: senderName,
    address: user || "lodouiran@mrsholdings.com",
  };

  if (!host || !user || !pass) {
    console.log(`[Email Simulation] Candidature reçue pour ${to} (${candidateName}) pour le poste "${jobTitle}" chez ${companyLabel}`);
    return {
      success: true,
      simulated: true,
      message: "SMTP non configuré dans .env : envoi simulé en console.",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const { src: logoSrc, attachments } = getLogoConfig();

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #E06810 0%, #B44E09 100%); padding: 32px 24px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 4px; font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
        .lead { font-size: 14px; color: #334155; margin-bottom: 20px; line-height: 1.6; }
        .info-card { background: #f8fafc; border-left: 4px solid #E06810; border-radius: 6px; padding: 16px 20px; margin: 24px 0; }
        .info-title { font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 6px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <img src="${logoSrc}" alt="MRS &amp; CORLAY" width="68" height="68" style="border-radius: 12px; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />
          <h1>MRS &amp; CORLAY HOLDINGS</h1>
          <p>Direction des Ressources Humaines</p>
        </div>
        
        <div class="content">
          <div class="greeting">Bonjour ${candidateName},</div>
          
          <p class="lead">
            Nous accusons bonne réception de votre dossier de candidature pour le poste :<br/>
            <strong style="color: #E06810; font-size: 16px;">« ${jobTitle} »</strong><br/>
            au sein de l'entité <strong>${companyLabel}</strong>.
          </p>

          <div class="info-card">
            <div class="info-title">📋 Statut de votre démarche :</div>
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
              Votre Curriculum Vitae ainsi que vos pièces jointes ont été enregistrés avec succès dans notre système de recrutement.
            </p>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Notre équipe examinera attentivement votre profil au regard des compétences requises pour ce poste. Si votre candidature est retenue, vous serez contacté(e) pour participer aux épreuves d'évaluation technique ou à un entretien.
          </p>

          <p style="font-size: 13px; color: #475569; margin-top: 24px;">
            Nous vous remercions vivement de l'intérêt que vous portez à notre Groupe.<br/>
            Bien cordialement,<br/>
            <strong>Le Département Recrutement MRS &amp; CORLAY</strong>
          </p>
        </div>

        <div class="footer">
          MRS &amp; CORLAY Holdings · Espace Recrutement &amp; Carrières · Cet email est envoyé automatiquement, merci de ne pas y répondre directement.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Bonjour ${candidateName},

Nous accusons bonne réception de votre dossier de candidature pour le poste : "${jobTitle}" (${companyLabel}).

Votre Curriculum Vitae et vos éléments transmis ont bien été enregistrés dans notre système.
Notre équipe RH examinera votre profil avec attention. Si votre profil correspond aux attentes, vous serez contacté(e) pour les prochaines étapes.

Nous vous remercions de l'intérêt que vous portez à MRS & CORLAY.

Bien cordialement,
Le Département Recrutement MRS & CORLAY`;

  try {
    const info = await transporter.sendMail({
      from: fromSender,
      to,
      subject: `Accusé de réception de votre candidature — ${jobTitle}`,
      text,
      html,
      attachments,
    });
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur d'envoi SMTP";
    console.error(`[SMTP ERROR] Échec envoi accusé de réception à ${to}:`, msg);
    return { success: false, simulated: false, error: msg };
  }
}

