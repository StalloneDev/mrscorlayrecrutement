"use server";

import { db, staffUsersTable, companiesTable, staffCompanyAccessTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hashPassword } from "./auth";
import { logAuditEvent } from "@/lib/audit";

export async function getStaffUsers() {
  return await db
    .select({
      id: staffUsersTable.id,
      email: staffUsersTable.email,
      displayName: staffUsersTable.displayName,
      role: staffUsersTable.role,
      createdAt: staffUsersTable.createdAt,
    })
    .from(staffUsersTable)
    .orderBy(desc(staffUsersTable.createdAt));
}

export async function createStaffUserAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const displayName = (formData.get("displayName") as string)?.trim();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "hr";

  if (!email || !displayName || !password) {
    throw new Error("Tous les champs sont obligatoires.");
  }

  if (password.length < 6) {
    throw new Error("Le mot de passe doit comporter au moins 6 caractères.");
  }

  // Vérifier doublon
  const [existing] = await db
    .select({ id: staffUsersTable.id })
    .from(staffUsersTable)
    .where(eq(staffUsersTable.email, email))
    .limit(1);

  if (existing) {
    throw new Error("Un utilisateur avec cet e-mail existe déjà.");
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(staffUsersTable)
    .values({
      email,
      displayName,
      passwordHash,
      role,
    })
    .returning();

  await logAuditEvent({
    companyId: null,
    action: "STAFF_USER_CREATED",
    entityType: "staff_user",
    entityId: newUser.id,
    detail: { email, displayName, role },
  });

  revalidatePath("/settings");
  return newUser;
}

export async function deleteStaffUserAction(userId: string) {
  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.id, userId))
    .limit(1);

  if (!user) throw new Error("Utilisateur introuvable.");

  // Empêcher la suppression du compte admin principal
  if (user.email === "lodouiran@mrsholdings.com") {
    throw new Error("Impossible de supprimer le compte administrateur principal.");
  }

  await db.delete(staffUsersTable).where(eq(staffUsersTable.id, userId));

  await logAuditEvent({
    companyId: null,
    action: "STAFF_USER_DELETED",
    entityType: "staff_user",
    entityId: userId,
    detail: { email: user.email },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function getCompaniesList() {
  return await db.select().from(companiesTable).orderBy(companiesTable.name);
}

export async function createCompanyAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const accentColor = (formData.get("accentColor") as string)?.trim() || "#E06810";

  if (!name || !code) {
    throw new Error("Le nom et le code de l'entreprise sont obligatoires.");
  }

  const [existing] = await db
    .select({ id: companiesTable.id })
    .from(companiesTable)
    .where(eq(companiesTable.code, code))
    .limit(1);

  if (existing) {
    throw new Error(`Une entreprise avec le code "${code}" existe déjà.`);
  }

  const [company] = await db
    .insert(companiesTable)
    .values({
      name,
      code,
      accentColor,
    })
    .returning();

  await logAuditEvent({
    companyId: company.id,
    action: "COMPANY_CREATED",
    entityType: "company",
    entityId: company.id,
    detail: { name, code },
  });

  revalidatePath("/settings");
  revalidatePath("/campaigns");
  return company;
}
