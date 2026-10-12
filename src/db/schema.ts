import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const companiesTable = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  accentColor: text("accent_color").notNull().default("#145a63"),
  logoUrl: text("logo_url"),
  ...timestamps,
});

export const staffUsersTable = pgTable(
  "staff_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    displayName: text("display_name").notNull(),
    role: text("role").notNull().default("hr"),
    ...timestamps,
  },
  (table) => [uniqueIndex("staff_users_email_idx").on(table.email)],
);

export const staffCompanyAccessTable = pgTable(
  "staff_company_access",
  {
    staffUserId: uuid("staff_user_id")
      .notNull()
      .references(() => staffUsersTable.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.staffUserId, table.companyId] }),
    index("staff_company_access_company_idx").on(table.companyId),
  ],
);

export const campaignsTable = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id),
    title: text("title").notNull(),
    reference: text("reference").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("draft"),
    durationMinutes: integer("duration_minutes").notNull().default(60),
    passingScore: real("passing_score").notNull().default(60),
    shortlistSize: integer("shortlist_size").notNull().default(5),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    questionIds: jsonb("question_ids").$type<string[]>().notNull().default([]),
    ...timestamps,
  },
  (table) => [
    index("campaigns_company_status_idx").on(table.companyId, table.status),
    uniqueIndex("campaigns_company_reference_idx").on(table.companyId, table.reference),
  ],
);

export const questionsTable = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companiesTable.id, {
      onDelete: "cascade",
    }),
    prompt: text("prompt").notNull(),
    kind: text("kind").notNull(),
    points: real("points").notNull(),
    required: boolean("required").notNull().default(true),
    category: text("category").notNull().default("Général"),
    competency: text("competency").notNull().default(""),
    difficulty: text("difficulty").notNull().default("medium"),
    choices: jsonb("choices").$type<string[]>().notNull().default([]),
    expectedAnswer: text("expected_answer"),
    maxCharacters: integer("max_characters"),
    ...timestamps,
  },
  (table) => [index("questions_company_idx").on(table.companyId)],
);

export const candidatesTable = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaignsTable.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    status: text("status").notNull().default("added"),
    score: real("score"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("candidates_campaign_status_idx").on(table.campaignId, table.status),
    uniqueIndex("candidates_campaign_email_idx").on(table.campaignId, table.email),
  ],
);

export const invitationsTable = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidatesTable.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaignsTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    status: text("status").notNull().default("ready"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("invitations_candidate_idx").on(table.candidateId)],
);

export const assessmentAttemptsTable = pgTable(
  "assessment_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidatesTable.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaignsTable.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    submissionType: text("submission_type"),
    ...timestamps,
  },
  (table) => [
    index("assessment_attempts_campaign_idx").on(table.campaignId),
    uniqueIndex("assessment_attempts_candidate_idx").on(table.candidateId),
  ],
);

export const answersTable = pgTable(
  "answers",
  {
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => assessmentAttemptsTable.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questionsTable.id),
    value: text("value").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.attemptId, table.questionId] })],
);

export const gradesTable = pgTable(
  "grades",
  {
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => assessmentAttemptsTable.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questionsTable.id),
    score: real("score").notNull(),
    comment: text("comment").notNull().default(""),
    validated: boolean("validated").notNull().default(false),
    gradedBy: uuid("graded_by").references(() => staffUsersTable.id),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.attemptId, table.questionId] })],
);

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companiesTable.id),
    actorUserId: uuid("actor_user_id").references(() => staffUsersTable.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_company_time_idx").on(table.companyId, table.createdAt)],
);
