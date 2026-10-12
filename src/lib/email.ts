import nodemailer from "nodemailer";

export interface SendInvitationEmailParams {
  to: string;
  candidateName: string;
  campaignTitle: string;
  invitationUrl: string;
  expiresInDays?: number;
}

export async function sendInvitationEmail({
  to,
  candidateName,
  campaignTitle,
  invitationUrl,
  expiresInDays = 14,
}: SendInvitationEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // Pour Office 365 / Exchange, l'adresse de l'expéditeur doit correspondre exactement au compte authentifié
  // et le nom d'affichage doit être propre sans guillemets échappés malformés.
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
          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo-mrs.png"
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
            <ul style="margin: 6px 0 0; padding-left: 18px; line-height: 1.7;">
              <li><strong>Environnement calme :</strong> Assurez-vous d'une connexion internet stable avant d'entamer l'épreuve.</li>
              <li><strong>Chronomètre actif :</strong> Le temps imparti débutera dès la validation de votre identité sur la page d'accueil.</li>
              <li><strong>Sauvegarde continue :</strong> Toutes vos réponses sont enregistrées automatiquement en temps réel.</li>
            </ul>
          </div>

          <div class="btn-wrapper">
            <a href="${invitationUrl}" class="btn" target="_blank">Démarrer mon évaluation technique →</a>
          </div>

          <p style="font-size: 13px; color: #475569; margin-top: 24px;">
            Ce lien sécurisé vous est personnellement attribué et reste valable pendant <strong>${expiresInDays} jours</strong>.<br/>
            Si le bouton ne s'affiche pas correctement, vous pouvez copier et coller l'adresse ci-après directement dans votre navigateur :
          </p>

          <div class="direct-link">
            <a href="${invitationUrl}" style="color: #E06810; text-decoration: none;">${invitationUrl}</a>
          </div>

          <p style="font-size: 13px; color: #475569; margin-top: 24px;">
            Nous vous souhaitons pleine réussite dans le déroulement de votre composition.<br/><br/>
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

Votre candidature a été retenue pour participer à l'épreuve d'évaluation technique pour le poste : ${campaignTitle}.

Accédez directement à votre session d'examen via le lien suivant :
${invitationUrl}

Consignes :
- Assurez-vous de disposer d'une connexion internet stable.
- Le chronomètre se déclenche dès votre confirmation d'identité.
- Ce lien est personnel et restera accessible pendant ${expiresInDays} jours.

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
    });

    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur d'envoi SMTP";
    console.error(`[SMTP ERROR] Échec de l'envoi d'email à ${to}:`, msg);
    return { success: false, simulated: false, error: msg };
  }
}
