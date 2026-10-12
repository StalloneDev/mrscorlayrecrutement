import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MRS & CORLAY — Plateforme de Recrutement & Évaluation",
  description: "Plateforme centralisée d'évaluation et de présélection de candidats pour MRS et CORLAY.",
  icons: {
    icon: "/logo-mrs.png",
    apple: "/logo-mrs.png",
    shortcut: "/logo-mrs.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
