import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { loginAction } from '@/actions/auth';
import { Brand } from '@/components/Brand';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Connexion — MRS Recrutement' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect('/dashboard');

  const { error } = await searchParams;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1f2d3d 0%, #26394b 50%, #1a2530 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Halo lumineux d'ambiance */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(224, 104, 16, 0.15) 0%, rgba(224, 104, 16, 0) 70%)',
          top: '-100px',
          right: '-100px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 90, 99, 0.25) 0%, rgba(20, 90, 99, 0) 70%)',
          bottom: '-100px',
          left: '-100px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
        {/* Carte principale */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Header avec Brand et gradient orange élégant */}
          <div
            style={{
              background: 'linear-gradient(135deg, #E06810 0%, #B44E09 100%)',
              padding: '36px 32px 28px',
              textAlign: 'center',
              color: '#ffffff',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <Brand inverse size="lg" />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              Espace Administration RH
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.85)',
                letterSpacing: '0.02em',
              }}
            >
              Plateforme d&apos;évaluation et de recrutement
            </p>
          </div>

          {/* Formulaire */}
          <div style={{ padding: '32px 28px' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Authentification
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                Entrez vos identifiants pour accéder au tableau de bord.
              </p>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span>{decodeURIComponent(error)}</span>
              </div>
            )}

            <form
              action={async (formData: FormData) => {
                'use server';
                const result = await loginAction(formData);
                if (result?.error) {
                  const { redirect: serverRedirect } = await import('next/navigation');
                  serverRedirect('/login?error=' + encodeURIComponent(result.error));
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Adresse e-mail professionnelle
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    defaultValue="loduiran@mrsholdings.com"
                    placeholder="nom@mrsholdings.com"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px 0 38px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px 0 38px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #E06810 0%, #B44E09 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(224, 104, 16, 0.35)',
                  transition: 'opacity 0.2s, transform 0.1s',
                }}
              >
                <span>Accéder à la plateforme</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: '#64748b',
                fontSize: 11,
              }}
            >
              <ShieldCheck size={14} style={{ color: '#E06810' }} />
              <span>Accès sécurisé réservé aux équipes MRS &amp; CORLAY</span>
            </div>
          </div>
        </div>

        {/* Footer discret */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16 }}>
          MRS &amp; CORLAY Holdings · Système de Recrutement · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
