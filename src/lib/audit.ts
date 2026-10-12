import { db, auditLogsTable } from "@/db";

export async function logAuditEvent({
  companyId,
  actorUserId = null,
  action,
  entityType,
  entityId = null,
  detail = {},
}: {
  companyId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogsTable).values({
      companyId: companyId || null,
      actorUserId: actorUserId || null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      detail,
    });
  } catch (err) {
    console.error("Erreur lors de l'écriture du journal d'audit:", err);
  }
}
