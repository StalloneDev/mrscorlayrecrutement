'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { staffUsersTable } from '@/db/schema';
import { signSession } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string ?? '').trim().toLowerCase();
  const password = (formData.get('password') as string ?? '');

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs.' };
  }

  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.email, email))
    .limit(1);

  if (!user || !user.passwordHash) {
    return { error: 'Identifiants invalides.' };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: 'Identifiants invalides.' };
  }

  const token = await signSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  });

  const cookieStore = await cookies();
  cookieStore.set('mrs-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8h
    path: '/',
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('mrs-session');
  redirect('/login');
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
