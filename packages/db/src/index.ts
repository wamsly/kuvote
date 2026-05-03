import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool);

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("student"),
  status: varchar("status", { length: 50 }).notNull().default("pending_otp"),
  gender: varchar("gender", { length: 10 }),
  courseId: text("course_id"),
  hostelId: text("hostel_id"),
  registrationNumber: varchar("registration_number", { length: 50 }),
  registrationExpiresAt: timestamp("registration_expires_at"),
  feeStatus: varchar("fee_status", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpsTable = pgTable("otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  codeHash: text("code_hash").notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
});

export const schoolsTable = pgTable("schools", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const departmentsTable = pgTable("departments", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  schoolId: text("school_id").notNull(),
});

export const coursesTable = pgTable("courses", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  departmentId: text("department_id").notNull(),
  level: varchar("level", { length: 20 }).notNull().default("bachelor"),
});

export const hostelsTable = pgTable("hostels", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  zone: varchar("zone", { length: 50 }).notNull(),
  gender: varchar("gender", { length: 10 }).notNull(),
});

export const pollsTable = pgTable("polls", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  locked: boolean("locked").notNull().default(false),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pollSeatsTable = pgTable("poll_seats", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id").notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  scope: varchar("scope", { length: 50 }).notNull(),
  scopeRefId: text("scope_ref_id"),
  gender: varchar("gender", { length: 10 }),
  position: integer("position").notNull().default(0),
});

export const candidatesTable = pgTable("candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id").notNull(),
  seatId: uuid("seat_id").notNull(),
  userId: uuid("user_id").notNull(),
  manifesto: text("manifesto").notNull(),
  photoUrl: text("photo_url"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const endorsementsTable = pgTable("endorsements", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id").notNull(),
  seatId: uuid("seat_id").notNull(),
  voterId: uuid("voter_id").notNull(),
});

export const ballotTokensTable = pgTable("ballot_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id").notNull(),
  seatId: uuid("seat_id").notNull(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
});

export const votesTable = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id").notNull(),
  seatId: uuid("seat_id").notNull(),
  candidateId: uuid("candidate_id").notNull(),
  encryptedPayload: text("encrypted_payload").notNull(),
  ballotHash: text("ballot_hash").notNull(),
  tokenHash: text("token_hash").notNull(),
});

export const auditLogTable = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  actorEmail: varchar("actor_email", { length: 255 }),
  actorRole: varchar("actor_role", { length: 50 }),
  target: varchar("target", { length: 255 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
