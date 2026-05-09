import type { Request, Response } from "express";
import {
  db,
  usersTable,
  pollsTable,
  pollSeatsTable,
  candidatesTable,
  votesTable,
  ballotTokensTable,
  auditLogTable,
  schoolsTable,
  departmentsTable,
  coursesTable,
  hostelsTable,
} from "@workspace/db";
import { and, count, desc, eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { audit } from "../lib/audit";

export async function getDashboard(_req: Request, res: Response) {
  const now = new Date();
  const totalVoters = await db
    .select({ n: count() })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));
  const activeVoters = await db
    .select({ n: count() })
    .from(usersTable)
    .where(and(eq(usersTable.role, "student"), eq(usersTable.status, "active")));
  const totalVotes = await db.select({ n: count() }).from(votesTable);
  const allPolls = await db.select().from(pollsTable);
  const activePolls = allPolls.filter((p) => p.startDate <= now && p.endDate >= now).length;
  const totalPolls = allPolls.length;
  const totalCandidates = await db.select({ n: count() }).from(candidatesTable);
  const recent = await db
    .select()
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(15);
  res.json({
    totalVoters: Number(totalVoters[0]?.n ?? 0),
    activeVoters: Number(activeVoters[0]?.n ?? 0),
    totalVotesCast: Number(totalVotes[0]?.n ?? 0),
    totalPolls,
    activePolls,
    totalCandidates: Number(totalCandidates[0]?.n ?? 0),
    recentActivity: recent.map((r) => ({
      id: r.id,
      action: r.action,
      actorEmail: r.actorEmail,
      target: r.target,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function getAdminPolls(_req: Request, res: Response) {
  const polls = await db.select().from(pollsTable).orderBy(desc(pollsTable.createdAt));
  const now = new Date();
  const out = await Promise.all(
    polls.map(async (p) => {
      const status = now < p.startDate ? "upcoming" : now > p.endDate ? "closed" : "active";
      const seats = await db.select({ n: count() }).from(pollSeatsTable).where(eq(pollSeatsTable.pollId, p.id));
      const candidates = await db.select({ n: count() }).from(candidatesTable).where(eq(candidatesTable.pollId, p.id));
      const votes = await db.select({ n: count() }).from(votesTable).where(eq(votesTable.pollId, p.id));
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        status,
        locked: p.locked,
        seatCount: Number(seats[0]?.n ?? 0),
        candidateCount: Number(candidates[0]?.n ?? 0),
        voteCount: Number(votes[0]?.n ?? 0),
      };
    }),
  );
  res.json(out);
}

export async function createPoll(req: Request, res: Response) {
  const { title, description, startDate, endDate, seats } = (req.body ?? {}) as {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    seats: Array<{
      code: string;
      label: string;
      scope: "school" | "department" | "hostel" | "src" | "university";
      scopeRefId?: string | null;
      gender?: "male" | "female" | null;
    }>;
  };
  if (!title || !startDate || !endDate || !Array.isArray(seats) || seats.length === 0) {
    res.status(400).json({ message: "title, startDate, endDate and at least one seat are required" });
    return;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    res.status(400).json({ message: "Invalid start/end dates" });
    return;
  }
  const inserted = await db
    .insert(pollsTable)
    .values({
      title,
      description: description ?? "",
      startDate: start,
      endDate: end,
      createdBy: req.user!.id,
    })
    .returning();
  const poll = inserted[0];
  for (let i = 0; i < seats.length; i++) {
    const s = seats[i];
    await db.insert(pollSeatsTable).values({
      pollId: poll.id,
      code: s.code,
      label: s.label,
      scope: s.scope,
      scopeRefId: s.scopeRefId ?? null,
      gender: s.gender ?? null,
      position: i,
    });
  }
  await audit({
    action: "admin.create_poll",
    actorEmail: req.user!.email,
    actorRole: "admin",
    target: poll.id,
    details: title,
  });
  res.status(201).json({ id: poll.id, message: "Poll created" });
}

export async function deletePoll(req: Request, res: Response) {
  const { pollId } = req.params;
  await db.delete(pollsTable).where(eq(pollsTable.id, pollId));
  await audit({
    action: "admin.delete_poll",
    actorEmail: req.user!.email,
    actorRole: "admin",
    target: pollId,
  });
  res.json({ message: "Poll deleted" });
}

export async function lockPoll(req: Request, res: Response) {
  const { pollId } = req.params;
  await db.update(pollsTable).set({ locked: true }).where(eq(pollsTable.id, pollId));
  await audit({
    action: "admin.lock_poll",
    actorEmail: req.user!.email,
    actorRole: "admin",
    target: pollId,
  });
  res.json({ message: "Poll locked" });
}

export async function getUsers(_req: Request, res: Response) {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      registrationNumber: usersTable.registrationNumber,
      role: usersTable.role,
      status: usersTable.status,
      gender: usersTable.gender,
      hostelName: hostelsTable.name,
      courseName: coursesTable.name,
      registrationExpiresAt: usersTable.registrationExpiresAt,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .leftJoin(hostelsTable, eq(usersTable.hostelId, hostelsTable.id))
    .leftJoin(coursesTable, eq(usersTable.courseId, coursesTable.id))
    .orderBy(desc(usersTable.createdAt));
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      registrationNumber: r.registrationNumber ?? null,
      role: r.role as "student" | "admin",
      status: r.status,
      gender: r.gender ?? null,
      hostelName: r.hostelName ?? null,
      courseName: r.courseName ?? null,
      registrationExpiresAt: r.registrationExpiresAt ? r.registrationExpiresAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
}

export async function approveUser(req: Request, res: Response) {
  await db.update(usersTable).set({ status: "active" }).where(eq(usersTable.id, req.params.userId));
  await audit({ action: "admin.approve_user", actorEmail: req.user!.email, actorRole: "admin", target: req.params.userId });
  res.json({ message: "User approved" });
}

export async function disableUser(req: Request, res: Response) {
  await db.update(usersTable).set({ status: "disabled" }).where(eq(usersTable.id, req.params.userId));
  await audit({ action: "admin.disable_user", actorEmail: req.user!.email, actorRole: "admin", target: req.params.userId });
  res.json({ message: "User disabled" });
}

export async function promoteUser(req: Request, res: Response) {
  await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, req.params.userId));
  await audit({ action: "admin.promote_user", actorEmail: req.user!.email, actorRole: "admin", target: req.params.userId });
  res.json({ message: "User promoted to admin" });
}

export async function getAdminCandidates(_req: Request, res: Response) {
  const rows = await db
    .select({
      id: candidatesTable.id,
      pollId: candidatesTable.pollId,
      pollTitle: pollsTable.title,
      seatId: candidatesTable.seatId,
      seatLabel: pollSeatsTable.label,
      userId: candidatesTable.userId,
      name: usersTable.name,
      email: usersTable.email,
      manifesto: candidatesTable.manifesto,
      status: candidatesTable.status,
      rejectionReason: candidatesTable.rejectionReason,
      createdAt: candidatesTable.createdAt,
    })
    .from(candidatesTable)
    .leftJoin(pollsTable, eq(candidatesTable.pollId, pollsTable.id))
    .leftJoin(pollSeatsTable, eq(candidatesTable.seatId, pollSeatsTable.id))
    .leftJoin(usersTable, eq(candidatesTable.userId, usersTable.id))
    .orderBy(desc(candidatesTable.createdAt));
  res.json(
    rows.map((r) => ({
      id: r.id,
      pollId: r.pollId,
      pollTitle: r.pollTitle ?? "",
      seatId: r.seatId,
      seatLabel: r.seatLabel ?? "",
      userId: r.userId,
      name: r.name ?? "",
      email: r.email ?? "",
      manifesto: r.manifesto,
      status: r.status as "pending" | "endorsed" | "approved" | "rejected",
      rejectionReason: r.rejectionReason ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
}

export async function addCandidate(req: Request, res: Response) {
  const { pollId, seatId, userId, manifesto } = (req.body ?? {}) as Record<string, string>;
  if (!pollId || !seatId || !userId || !manifesto) {
    res.status(400).json({ message: "pollId, seatId, userId and manifesto are required" });
    return;
  }
  const exists = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.seatId, seatId), eq(candidatesTable.userId, userId)))
    .limit(1);
  if (exists[0]) {
    res.status(409).json({ message: "Candidate already applied for this seat" });
    return;
  }
  const inserted = await db
    .insert(candidatesTable)
    .values({ pollId, seatId, userId, manifesto, status: "approved" })
    .returning();
  await audit({
    action: "admin.add_candidate",
    actorEmail: req.user!.email,
    actorRole: "admin",
    target: inserted[0].id,
  });
  res.status(201).json({ id: inserted[0].id, message: "Candidate added" });
}

export async function approveCandidate(req: Request, res: Response) {
  await db.update(candidatesTable).set({ status: "approved", rejectionReason: null }).where(eq(candidatesTable.id, req.params.candidateId));
  await audit({ action: "admin.approve_candidate", actorEmail: req.user!.email, actorRole: "admin", target: req.params.candidateId });
  res.json({ message: "Candidate approved" });
}

export async function rejectCandidate(req: Request, res: Response) {
  const { reason } = (req.body ?? {}) as Record<string, string>;
  await db
    .update(candidatesTable)
    .set({ status: "rejected", rejectionReason: reason ?? null })
    .where(eq(candidatesTable.id, req.params.candidateId));
  await audit({
    action: "admin.reject_candidate",
    actorEmail: req.user!.email,
    actorRole: "admin",
    target: req.params.candidateId,
    details: reason ?? null,
  });
  res.json({ message: "Candidate rejected" });
}

export async function getReports(_req: Request, res: Response) {
  const usersBySchoolRows = await db
    .select({
      schoolId: schoolsTable.id,
      schoolName: schoolsTable.name,
      n: count(),
    })
    .from(usersTable)
    .leftJoin(coursesTable, eq(usersTable.courseId, coursesTable.id))
    .leftJoin(departmentsTable, eq(coursesTable.departmentId, departmentsTable.id))
    .leftJoin(schoolsTable, eq(departmentsTable.schoolId, schoolsTable.id))
    .where(eq(usersTable.role, "student"))
    .groupBy(schoolsTable.id, schoolsTable.name);

  const candidatesByPoll = await db
    .select({
      pollId: pollsTable.id,
      pollTitle: pollsTable.title,
      n: count(),
    })
    .from(candidatesTable)
    .leftJoin(pollsTable, eq(candidatesTable.pollId, pollsTable.id))
    .groupBy(pollsTable.id, pollsTable.title);

  const polls = await db.select().from(pollsTable).orderBy(desc(pollsTable.createdAt));

  const participation = await Promise.all(
    polls.map(async (p) => {
      const totalEligible = await db
        .select({ n: count() })
        .from(usersTable)
        .where(and(eq(usersTable.role, "student"), eq(usersTable.status, "active")));
      const totalVoted = await db
        .selectDistinct({ userId: ballotTokensTable.userId })
        .from(ballotTokensTable)
        .where(eq(ballotTokensTable.pollId, p.id));
      const eligibleN = Number(totalEligible[0]?.n ?? 0);
      const votedN = totalVoted.length;
      return {
        pollId: p.id,
        pollTitle: p.title,
        eligibleVoters: eligibleN,
        votersWhoVoted: votedN,
        turnoutPercent: eligibleN > 0 ? Math.round((votedN / eligibleN) * 1000) / 10 : 0,
      };
    }),
  );

  res.json({
    voterRegistration: usersBySchoolRows.map((r) => ({
      schoolId: r.schoolId ?? null,
      schoolName: r.schoolName ?? "Unassigned",
      registeredVoters: Number(r.n ?? 0),
    })),
    candidateRegistration: candidatesByPoll.map((r) => ({
      pollId: r.pollId ?? null,
      pollTitle: r.pollTitle ?? "Unknown",
      candidates: Number(r.n ?? 0),
    })),
    participation,
  });
}

export async function getAuditLog(_req: Request, res: Response) {
  const rows = await db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt)).limit(500);
  res.json(
    rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorEmail: r.actorEmail ?? null,
      actorRole: r.actorRole ?? null,
      target: r.target ?? null,
      details: r.details ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
}

export async function resetAdminPassword(req: Request, res: Response) {
  const { userId } = req.params;
  const { newPassword } = (req.body ?? {}) as Record<string, string>;
  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ message: "newPassword must be at least 8 characters" });
    return;
  }
  await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(usersTable.id, userId));
  await audit({
    action: "admin.reset_password",
    actorEmail: req.user!.email,
    actorRole: "admin",
    target: userId,
  });
  res.json({ message: "Password reset successfully" });
}
