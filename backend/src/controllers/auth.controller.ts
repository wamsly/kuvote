import type { Request, Response } from "express";
import { db, usersTable, otpsTable } from "@workspace/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  generateOtp,
  hashOtp,
  hashPassword,
  loadUserProfile,
  signToken,
  verifyPassword,
} from "../lib/auth";
import { isEmailConfigured, sendOtpEmail } from "../lib/email";
import { audit } from "../lib/audit";

const EMAIL_REGEX = /^\d{1,6}\.{1,2}\d{4}@students\.ku\.ac\.ke$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const REGISTRATION_VALID_MONTHS = 11;

function extractRegistrationNumber(email: string): string | null {
  const match = email.match(/^(\d{1,6})\.{1,2}(\d{4})@/);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function issueOtp(email: string, purpose: "registration" | "password_reset") {
  const code = generateOtp();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db.insert(otpsTable).values({ email, codeHash, purpose, expiresAt });
  try {
    await sendOtpEmail(email, code, purpose);
  } catch {
    // swallow; we'll still return devOtp if email isn't configured
  }
  return { code, devOtp: isEmailConfigured() ? null : code };
}

async function consumeOtp(
  email: string,
  code: string,
  purpose: "registration" | "password_reset",
): Promise<boolean> {
  const codeHash = hashOtp(code);
  const rows = await db
    .select()
    .from(otpsTable)
    .where(
      and(
        eq(otpsTable.email, email),
        eq(otpsTable.codeHash, codeHash),
        eq(otpsTable.purpose, purpose),
        isNull(otpsTable.consumedAt),
        gt(otpsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const otp = rows[0];
  if (!otp) return false;
  await db
    .update(otpsTable)
    .set({ consumedAt: new Date() })
    .where(eq(otpsTable.id, otp.id));
  return true;
}

export async function prefillRegistration(req: Request, res: Response) {
  const email = (req.query.email as string ?? "").trim().toLowerCase();
  if (!email) {
    res.status(400).json({ message: "email query parameter is required" });
    return;
  }
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = rows[0];
  if (!user) {
    res.json({ exists: false, feeCleared: true });
    return;
  }
  const feeCleared = user.feeStatus === "cleared";
  res.json({
    exists: true,
    feeCleared,
    feeStatus: user.feeStatus ?? "pending",
    name: user.name,
    gender: user.gender,
    courseId: user.courseId,
    hostelId: user.hostelId,
    alreadyActive: user.status === "active",
  });
}

export async function register(req: Request, res: Response) {
  const { name, email, password, gender, courseId, hostelId } = (req.body ?? {}) as Record<string, string>;
  if (!name || !email || !password || !gender || !courseId) {
    res.status(400).json({ message: "Name, email, password, gender and course are required" });
    return;
  }
  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: "Email must be in the form 12345.1234@students.ku.ac.ke" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }
  if (!["male", "female"].includes(gender)) {
    res.status(400).json({ message: "Gender must be male or female" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing[0] && existing[0].status === "active") {
    res.status(409).json({ message: "An account with that email already exists" });
    return;
  }

  if (existing[0] && existing[0].feeStatus !== "cleared") {
    res.status(403).json({
      message: "Your fee balance is not cleared. Please visit the Finance Office before registering.",
      code: "FEE_NOT_CLEARED",
    });
    return;
  }
  const regNo = extractRegistrationNumber(email);
  const expiresAt = addMonths(new Date(), REGISTRATION_VALID_MONTHS);
  if (existing[0]) {
    await db
      .update(usersTable)
      .set({
        name,
        passwordHash: hashPassword(password),
        gender,
        courseId,
        hostelId,
        registrationNumber: regNo,
        registrationExpiresAt: expiresAt,
      })
      .where(eq(usersTable.id, existing[0].id));
  } else {
    await db.insert(usersTable).values({
      name,
      email,
      passwordHash: hashPassword(password),
      role: "student",
      status: "pending_otp",
      gender,
      courseId,
      hostelId,
      registrationNumber: regNo,
      registrationExpiresAt: expiresAt,
    });
  }
  const otp = await issueOtp(email, "registration");
  await audit({ action: "user.register", actorEmail: email, actorRole: "student", target: email });
  res.status(201).json({
    message: "Verification code sent to your email",
    email,
    devOtp: otp.devOtp,
  });
}

export async function verifyOtp(req: Request, res: Response) {
  const { email, otp: code } = (req.body ?? {}) as Record<string, string>;
  if (!email || !code) {
    res.status(400).json({ message: "email and otp are required" });
    return;
  }
  const ok = await consumeOtp(email, code, "registration");
  if (!ok) {
    res.status(400).json({ message: "Invalid or expired code" });
    return;
  }
  const userRows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = userRows[0];
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  await db.update(usersTable).set({ status: "active" }).where(eq(usersTable.id, user.id));
  const token = signToken({ sub: user.id, email: user.email, role: user.role as "student" | "admin" });
  const profile = await loadUserProfile(user.id);
  await audit({ action: "user.verify", actorEmail: email, actorRole: "student", target: email });
  res.json({ token, user: profile });
}

export async function resendOtp(req: Request, res: Response) {
  const { email } = (req.body ?? {}) as Record<string, string>;
  if (!email) {
    res.status(400).json({ message: "email required" });
    return;
  }
  const purposeBody = (req.body?.purpose ?? "registration") as "registration" | "password_reset";
  const otp = await issueOtp(email, purposeBody);
  res.json({ message: "Code sent", devOtp: otp.devOtp });
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = (req.body ?? {}) as Record<string, string>;
  if (!identifier || !password) {
    res.status(400).json({ message: "identifier and password are required" });
    return;
  }
  const isEmail = identifier.includes("@");
  const userRows = await db
    .select()
    .from(usersTable)
    .where(
      isEmail
        ? eq(usersTable.email, identifier)
        : eq(usersTable.registrationNumber, identifier),
    )
    .limit(1);
  const user = userRows[0];
  if (!user || user.role !== "student") {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  if (!verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  if (user.status === "pending_otp") {
    res.status(403).json({ message: "Please verify your email first" });
    return;
  }
  if (user.status === "disabled") {
    res.status(403).json({ message: "Your account has been disabled" });
    return;
  }
  if (user.registrationExpiresAt && user.registrationExpiresAt < new Date()) {
    res.status(403).json({ message: "Your registration has expired. Please re-register." });
    return;
  }
  const token = signToken({ sub: user.id, email: user.email, role: user.role as "student" | "admin" });
  const profile = await loadUserProfile(user.id);
  await audit({ action: "user.login", actorEmail: user.email, actorRole: user.role, target: user.email });
  res.json({ token, user: profile });
}

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = (req.body ?? {}) as Record<string, string>;
  if (!email || !password) {
    res.status(400).json({ message: "email and password are required" });
    return;
  }
  const userRows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = userRows[0];
  if (!user || user.role !== "admin") {
    res.status(401).json({ message: "Invalid admin credentials" });
    return;
  }
  if (!verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ message: "Invalid admin credentials" });
    return;
  }
  const token = signToken({ sub: user.id, email: user.email, role: "admin" });
  const profile = await loadUserProfile(user.id);
  await audit({ action: "admin.login", actorEmail: user.email, actorRole: "admin", target: user.email });
  res.json({ token, user: profile });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = (req.body ?? {}) as Record<string, string>;
  if (!email) {
    res.status(400).json({ message: "email required" });
    return;
  }
  const userRows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!userRows[0]) {
    res.json({ message: "If an account exists, a code has been sent", devOtp: null });
    return;
  }
  const otp = await issueOtp(email, "password_reset");
  await audit({ action: "user.forgot_password", actorEmail: email, actorRole: "student", target: email });
  res.json({ message: "Reset code sent", devOtp: otp.devOtp });
}

export async function resetPassword(req: Request, res: Response) {
  const { email, otp: code, newPassword } = (req.body ?? {}) as Record<string, string>;
  if (!email || !code || !newPassword) {
    res.status(400).json({ message: "email, otp and newPassword are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }
  const ok = await consumeOtp(email, code, "password_reset");
  if (!ok) {
    res.status(400).json({ message: "Invalid or expired code" });
    return;
  }
  await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(usersTable.email, email));
  await audit({ action: "user.reset_password", actorEmail: email, actorRole: "student", target: email });
  res.json({ message: "Password reset successfully" });
}

export async function getMe(req: Request, res: Response) {
  const profile = await loadUserProfile(req.user!.id);
  res.json({ user: profile });
}
