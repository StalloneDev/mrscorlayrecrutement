require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587', 10);
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
  address: user,
};

console.log('Test configuration :');
console.log('Host:', host);
console.log('User:', user);
console.log('FromSender:', JSON.stringify(fromSender));

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  tls: { ciphers: 'SSLv3' },
});

// Test d'envoi à lodouiran@mrsholdings.com
transporter.sendMail({
  from: fromSender,
  to: user,
  subject: "Convocation officielle — Test Réel Plateforme",
  html: `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #E06810;">MRS & CORLAY HOLDINGS</h2>
      <p>Bonjour,</p>
      <p>Ce message confirme que les emails d'invitation sont bien expédiés avec l'expéditeur officiel <strong>${senderName}</strong>.</p>
      <p><a href="http://localhost:3000" style="background: #E06810; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Accéder à la plateforme</a></p>
    </div>
  `,
}, (err, info) => {
  if (err) {
    console.error('❌ ERREUR ENVOI :', err.message);
  } else {
    console.log('✅ SUCCÈS ! Email expédié sans erreur.');
    console.log('Message ID :', info.messageId);
  }
});
