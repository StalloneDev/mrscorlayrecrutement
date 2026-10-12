# MRS & CORLAY — Plateforme de Recrutement & Évaluation

Plateforme centralisée d'évaluation technique et de présélection de candidats pour **MRS & CORLAY Holdings**.

---

## 🚀 Fonctionnalités Principales

- **Gestion des Campagnes de Recrutement** : Création d'épreuves, paramétrage de durée, seuil de passage, taille de shortlist.
- **Banque de Questions Multi-formats** :
  - Choix unique / Choix multiple (QCM)
  - Vrai / Faux
  - Réponses courtes & rédactionnelles (avec saisie libre enrichie)
  - Barème et points configurables
- **Portail Candidat Sécurisé** :
  - Liens d'invitation uniques avec jetons cryptographiques HMAC-SHA256
  - Vérification d'identité préalable
  - Chronomètre automatique en temps réel
  - Sauvegarde continue et soumission automatique à expiration
- **Interface RH & Correction** :
  - Authentification sécurisée par cookies JWT HttpOnly
  - Notation assistée question par question
  - Classement automatisé et tableau de bord de présélection
  - Export CSV des résultats avec BOM UTF-8
- **Système d'Invitations par E-mail** :
  - Intégration SMTP Microsoft 365 / Office 365
  - Modèle d'e-mail officiel avec en-tête charte graphique et logo MRS & CORLAY
  - Retours visuels interactifs et copie directe des liens d'invitation

---

## 🛠️ Stack Technique

- **Framework** : [Next.js](https://nextjs.org/) 16 (App Router, Server Actions, Turbopack)
- **Base de données** : PostgreSQL via [Neon](https://neon.tech/) (Serverless)
- **ORM** : [Drizzle ORM](https://orm.drizzle.team/)
- **Messagerie** : Nodemailer (Exchange / Office 365)
- **Sécurité** : Jose (JWT), crypto HMAC-SHA256, bcryptjs
- **UI & Icônes** : Lucide React, CSS modulaire et styles corporate

---

## 📦 Installation & Démarrage

### 1. Cloner le dépôt
```bash
git clone https://github.com/StalloneDev/mrscorlayrecrutement.git
cd mrscorlayrecrutement
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Copiez `.env.example` en `.env` :
```bash
cp .env.example .env
```
Renseignez les valeurs requises (`DATABASE_URL`, `SESSION_SECRET`, `SMTP_*`).

### 4. Lancer le serveur de développement
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

---

## 🔒 Sécurité

Le fichier `.env` contenant les clés d'accès à la base de données et les identifiants SMTP est exclu du contrôle de version via `.gitignore`.
