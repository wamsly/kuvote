import crypto from "node:crypto";
import { db, usersTable, coursesTable, departmentsTable, schoolsTable, hostelsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SESSION_SECRET = process.env["SESSION_SECRET"];
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type JwtPayload = {
  sub: string;
  email: string;
  role: "student" | "admin";
  iat: number;
  exp: number;
};

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = { ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS };
  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(fullPayload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET as string)
    .update(signingInput)
    .digest();
  return `${signingInput}.${base64url(sig)}`;
}

export function verifyToken(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const expectedSig = base64url(
    crypto
      .createHmac("sha256", SESSION_SECRET as string)
      .update(`${headerB64}.${payloadB64}`)
      .digest(),
  );
  if (
    !crypto.timingSafeEqual(
      Buffer.from(sigB64),
      Buffer.from(expectedSig),
    )
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(fromBase64url(payloadB64).toString()) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const candidate = crypto.scryptSync(password, salt, 64);
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function constantTimeStringEq(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  status: string;
};

export type UserProfilePayload = {
  id: string;
  name: string;
  email: string;
  registrationNumber: string | null;
  role: "student" | "admin";
  status: "pending_otp" | "active" | "disabled";
  gender: "male" | "female" | null;
  courseId: string | null;
  courseName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  schoolId: string | null;
  schoolName: string | null;
  hostelId: string | null;
  hostelName: string | null;
  feeStatus: "cleared" | "pending" | null;
  registrationExpiresAt: string | null;
};

export async function loadUserProfile(userId: string): Promise<UserProfilePayload | null> {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      registrationNumber: usersTable.registrationNumber,
      role: usersTable.role,
      status: usersTable.status,
      gender: usersTable.gender,
      courseId: usersTable.courseId,
      courseName: coursesTable.name,
      departmentId: departmentsTable.id,
      departmentName: departmentsTable.name,
      schoolId: schoolsTable.id,
      schoolName: schoolsTable.name,
      hostelId: usersTable.hostelId,
      hostelName: hostelsTable.name,
      feeStatus: usersTable.feeStatus,
      registrationExpiresAt: usersTable.registrationExpiresAt,
    })
    .from(usersTable)
    .leftJoin(coursesTable, eq(usersTable.courseId, coursesTable.id))
    .leftJoin(departmentsTable, eq(coursesTable.departmentId, departmentsTable.id))
    .leftJoin(schoolsTable, eq(departmentsTable.schoolId, schoolsTable.id))
    .leftJoin(hostelsTable, eq(usersTable.hostelId, hostelsTable.id))
    .where(eq(usersTable.id, userId))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    registrationNumber: r.registrationNumber ?? null,
    role: r.role as "student" | "admin",
    status: r.status as "pending_otp" | "active" | "disabled",
    gender: (r.gender as "male" | "female" | null) ?? null,
    courseId: r.courseId ?? null,
    courseName: r.courseName ?? null,
    departmentId: r.departmentId ?? null,
    departmentName: r.departmentName ?? null,
    schoolId: r.schoolId ?? null,
    schoolName: r.schoolName ?? null,
    hostelId: r.hostelId ?? null,
    hostelName: r.hostelName ?? null,
    feeStatus: (r.feeStatus as "cleared" | "pending" | null) ?? null,
    registrationExpiresAt: r.registrationExpiresAt
      ? r.registrationExpiresAt.toISOString()
      : null,
  };
}
