import type { Request, Response } from "express";
import { db, candidatesTable, pollsTable, pollSeatsTable, endorsementsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { audit } from "../lib/audit";

export async function applyCandidate(req: Request, res: Response) {
  const { pollId, seatId, manifesto } = (req.body ?? {}) as Record<string, string>;
  if (!pollId || !seatId || !manifesto) {
    res.status(400).json({ message: "pollId, seatId and manifesto are required" });
    return;
  }
  const pollRows = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId)).limit(1);
  const poll = pollRows[0];
  if (!poll) {
    res.status(404).json({ message: "Poll not found" });
    return;
  }
  if (poll.locked) {
    res.status(400).json({ message: "Candidate window is closed for this poll" });
    return;
  }
  const seatRows = await db
    .select()
    .from(pollSeatsTable)
    .where(and(eq(pollSeatsTable.id, seatId), eq(pollSeatsTable.pollId, pollId)))
    .limit(1);
  if (!seatRows[0]) {
    res.status(400).json({ message: "Seat does not belong to this poll" });
    return;
  }
  const exists = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.seatId, seatId), eq(candidatesTable.userId, req.user!.id)))
    .limit(1);
  if (exists[0]) {
    res.status(409).json({ message: "You have already applied for this seat" });
    return;
  }
  const inserted = await db
    .insert(candidatesTable)
    .values({ pollId, seatId, userId: req.user!.id, manifesto, status: "pending" })
    .returning();
  await audit({
    action: "candidate.apply",
    actorEmail: req.user!.email,
    actorRole: "student",
    target: seatId,
  });
  res.status(201).json({ id: inserted[0].id, message: "Application submitted" });
}

export async function getMyApplications(req: Request, res: Response) {
  const rows = await db
    .select({
      id: candidatesTable.id,
      pollId: candidatesTable.pollId,
      pollTitle: pollsTable.title,
      seatId: candidatesTable.seatId,
      seatLabel: pollSeatsTable.label,
      manifesto: candidatesTable.manifesto,
      status: candidatesTable.status,
      rejectionReason: candidatesTable.rejectionReason,
      createdAt: candidatesTable.createdAt,
    })
    .from(candidatesTable)
    .leftJoin(pollsTable, eq(candidatesTable.pollId, pollsTable.id))
    .leftJoin(pollSeatsTable, eq(candidatesTable.seatId, pollSeatsTable.id))
    .where(eq(candidatesTable.userId, req.user!.id))
    .orderBy(desc(candidatesTable.createdAt));
  res.json(
    rows.map((r) => ({
      id: r.id,
      pollId: r.pollId,
      pollTitle: r.pollTitle ?? "",
      seatId: r.seatId,
      seatLabel: r.seatLabel ?? "",
      manifesto: r.manifesto,
      status: r.status as "pending" | "endorsed" | "approved" | "rejected",
      rejectionReason: r.rejectionReason ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
}

export async function endorseCandidate(req: Request, res: Response) {
  const { candidateId } = req.params;
  const candRows = await db.select().from(candidatesTable).where(eq(candidatesTable.id, candidateId)).limit(1);
  const candidate = candRows[0];
  if (!candidate) {
    res.status(404).json({ message: "Candidate not found" });
    return;
  }
  const exists = await db
    .select()
    .from(endorsementsTable)
    .where(
      and(
        eq(endorsementsTable.seatId, candidate.seatId),
        eq(endorsementsTable.voterId, req.user!.id),
      ),
    )
    .limit(1);
  if (exists[0]) {
    res.status(409).json({ message: "You have already endorsed a candidate for this seat" });
    return;
  }
  await db.insert(endorsementsTable).values({
    candidateId,
    seatId: candidate.seatId,
    voterId: req.user!.id,
  });
  await audit({
    action: "candidate.endorse",
    actorEmail: req.user!.email,
    actorRole: "student",
    target: candidateId,
  });
  res.json({ message: "Endorsement recorded" });
}
