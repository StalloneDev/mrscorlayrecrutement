/**
 * Script de test SMTP — Office 365
 * Usage: node scripts/test-smtp.cjs
 */

require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!host || !user || !pass) {
  console.error('❌ Variables SMTP_HOST, SMTP_USER ou SMTP_PASS manquantes dans .env');
  process.exit(1);
}

console.log(`\n🔄 Test de connexion SMTP...`);
console.log(`   Serveur : ${host}:${port}`);
console.log(`   Compte  : ${user}\n`);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  tls: { ciphers: 'SSLv3' },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connexion SMTP échouée :\n', error.message);
    console.log('\n💡 Solutions possibles :');
    console.log('   1. Activez SMTP AUTH sur le compte dans le Centre Admin Microsoft 365');
    console.log('   2. Utilisez un mot de passe d\'application si MFA est activé');
    console.log('   3. Vérifiez que le mot de passe est correct');
  } else {
    console.log('✅ Connexion SMTP réussie ! Le serveur est prêt à envoyer des emails.\n');
    transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: user,
      subject: 'Test SMTP — Plateforme MRS & CORLAY',
      text: 'Connexion SMTP opérationnelle. Ce message confirme que le système d\'envoi d\'emails est correctement configuré.',
    }, (err, info) => {
      if (err) {
        console.error('❌ Envoi échoué :', err.message);
      } else {
        console.log('✅ Email de test envoyé avec succès !');
        console.log('   Message ID :', info.messageId);
        console.log(`\n📬 Vérifiez la boîte de réception de ${user}`);
      }
    });
  }
});
