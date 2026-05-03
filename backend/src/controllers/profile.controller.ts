import type { Request, Response } from "express";
import { db, usersTable, ballotTokensTable, pollsTable, pollSeatsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { hashPassword, loadUserProfile, verifyPassword } from "../lib/auth";
import { audit } from "../lib/audit";

export async function getProfile(req: Request, res: Response) {
  const profile = await loadUserProfile(req.user!.id);
  res.json(profile);
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = (req.body ?? {}) as Record<string, string>;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ message: "New password must be at least 8 characters" });
    return;
  }
  const userRows = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const user = userRows[0];
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    res.status(400).json({ message: "Current password is incorrect" });
    return;
  }
  await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(usersTable.id, req.user!.id));
  await audit({ action: "user.change_password", actorEmail: req.user!.email, actorRole: req.user!.role });
  res.json({ message: "Password changed successfully" });
}

export async function getVotingHistory(req: Request, res: Response) {
  const rows = await db
    .select({
      pollId: pollsTable.id,
      pollTitle: pollsTable.title,
      seatId: pollSeatsTable.id,
      seatLabel: pollSeatsTable.label,
      votedAt: ballotTokensTable.usedAt,
      used: ballotTokensTable.used,
    })
    .from(ballotTokensTable)
    .leftJoin(pollsTable, eq(ballotTokensTable.pollId, pollsTable.id))
    .leftJoin(pollSeatsTable, eq(ballotTokensTable.seatId, pollSeatsTable.id))
    .where(and(eq(ballotTokensTable.userId, req.user!.id), eq(ballotTokensTable.used, true)))
    .orderBy(desc(ballotTokensTable.usedAt));
  res.json(
    rows.map((r) => ({
      pollId: r.pollId,
      pollTitle: r.pollTitle,
      seatId: r.seatId,
      seatLabel: r.seatLabel,
      votedAt: r.votedAt ? r.votedAt.toISOString() : null,
    })),
  );
}
