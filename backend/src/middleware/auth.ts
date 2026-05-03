import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  status: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const token = header.slice("Bearer ".length);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub))
    .limit(1);
  const u = user[0];
  if (!u || u.status === "disabled") {
    res.status(401).json({ message: "Account is disabled or not found" });
    return;
  }
  req.user = {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as "student" | "admin",
    status: u.status,
  };
  next();
}

export function requireRole(role: "student" | "admin") {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ message: `${role} access required` });
      return;
    }
    next();
  };
}
