import type { Request, Response } from "express";
import crypto from "node:crypto";
import {
  db,
  pollsTable,
  pollSeatsTable,
  candidatesTable,
  ballotTokensTable,
  votesTable,
  usersTable,
  coursesTable,
  departmentsTable,
} from "@workspace/db";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { audit } from "../lib/audit";

type PollStatus = "upcoming" | "active" | "closed";

function statusOf(p: { startDate: Date; endDate: Date }): PollStatus {
  const now = new Date();
  if (now < p.startDate) return "upcoming";
  if (now > p.endDate) return "closed";
  return "active";
}

async function userVotedSeats(pollId: string, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ seatId: ballotTokensTable.seatId })
    .from(ballotTokensTable)
    .where(
      and(
        eq(ballotTokensTable.pollId, pollId),
        eq(ballotTokensTable.userId, userId),
        eq(ballotTokensTable.used, true),
      ),
    );
  return new Set(rows.map((r) => r.seatId));
}

async function eligibleSeatsForUser(pollId: string, userId: string) {
  const seats = await db.select().from(pollSeatsTable).where(eq(pollSeatsTable.pollId, pollId));
  const userRows = await db
    .select({
      id: usersTable.id,
      gender: usersTable.gender,
      hostelId: usersTable.hostelId,
      courseId: usersTable.courseId,
      departmentId: coursesTable.departmentId,
      schoolId: departmentsTable.schoolId,
    })
    .from(usersTable)
    .leftJoin(coursesTable, eq(usersTable.courseId, coursesTable.id))
    .leftJoin(departmentsTable, eq(coursesTable.departmentId, departmentsTable.id))
    .where(eq(usersTable.id, userId))
    .limit(1);
  const user = userRows[0];
  if (!user) return [];
  return seats.filter((s) => {
    if (s.gender && user.gender && s.gender !== user.gender) return false;
    if (s.scope === "school" && s.scopeRefId && user.schoolId !== s.scopeRefId) return false;
    if (s.scope === "department" && s.scopeRefId && user.departmentId !== s.scopeRefId) return false;
    if (s.scope === "hostel" && s.scopeRefId && user.hostelId !== s.scopeRefId) return false;
    // Non-residential: only off-campus students (no hostel assigned) may vote
    if (s.scope === "non-residential" && user.hostelId !== null) return false;
    // Residential: only students assigned to any hostel may vote
    if (s.scope === "residential" && user.hostelId === null) return false;
    return true;
  });
}

export async function getActivePublicPolls(_req: Request, res: Response) {
  const now = new Date();
  const polls = await db.select().from(pollsTable).orderBy(desc(pollsTable.startDate));
  const out = polls
    .filter((p) => p.startDate <= now && p.endDate >= now)
    .map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      status: statusOf(p) as PollStatus,
      locked: p.locked,
    }));
  res.json(out);
}

export async function getPolls(req: Request, res: Response) {
  const polls = await db.select().from(pollsTable).orderBy(desc(pollsTable.startDate));
  const out = await Promise.all(
    polls.map(async (p) => {
      const status = statusOf(p);
      let voted = false;
      let totalSeats = 0;
      let votedSeats = 0;
      if (req.user!.role === "student") {
        const eligibleSeats = await eligibleSeatsForUser(p.id, req.user!.id);
        totalSeats = eligibleSeats.length;
        const votedSet = await userVotedSeats(p.id, req.user!.id);
        votedSeats = eligibleSeats.filter((s) => votedSet.has(s.id)).length;
        voted = totalSeats > 0 && votedSeats === totalSeats;
      }
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        status: status as PollStatus,
        locked: p.locked,
        eligibleSeats: totalSeats,
        votedSeats,
        voted,
      };
    }),
  );
  res.json(out);
}

export async function getPoll(req: Request, res: Response) {
  const { pollId } = req.params;
  const pollRows = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId)).limit(1);
  const poll = pollRows[0];
  if (!poll) {
    res.status(404).json({ message: "Poll not found" });
    return;
  }
  const status = statusOf(poll);
  const eligibleSeats =
    req.user!.role === "student"
      ? await eligibleSeatsForUser(pollId, req.user!.id)
      : await db.select().from(pollSeatsTable).where(eq(pollSeatsTable.pollId, pollId));
  const votedSet = req.user!.role === "student" ? await userVotedSeats(pollId, req.user!.id) : new Set<string>();
  const allSeats = await db.select().from(pollSeatsTable).where(eq(pollSeatsTable.pollId, pollId)).orderBy(asc(pollSeatsTable.position));

  const seatsWithCandidates = await Promise.all(
    allSeats.map(async (s) => {
      const isEligible = eligibleSeats.some((es) => es.id === s.id);
      const candidateRows = await db
        .select({
          id: candidatesTable.id,
          name: usersTable.name,
          manifesto: candidatesTable.manifesto,
          photoUrl: candidatesTable.photoUrl,
          status: candidatesTable.status,
        })
        .from(candidatesTable)
        .leftJoin(usersTable, eq(candidatesTable.userId, usersTable.id))
        .where(and(eq(candidatesTable.seatId, s.id), eq(candidatesTable.status, "approved")));
      return {
        id: s.id,
        code: s.code,
        label: s.label,
        scope: s.scope as "school" | "department" | "hostel" | "src" | "university",
        scopeRefId: s.scopeRefId ?? null,
        gender: (s.gender as "male" | "female" | null) ?? null,
        eligible: isEligible,
        voted: votedSet.has(s.id),
        candidates: candidateRows.map((c) => ({
          id: c.id,
          name: c.name ?? "",
          manifesto: c.manifesto ?? "",
          photoUrl: c.photoUrl ?? null,
        })),
      };
    }),
  );
  res.json({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    startDate: poll.startDate.toISOString(),
    endDate: poll.endDate.toISOString(),
    status: status as PollStatus,
    locked: poll.locked,
    seats: seatsWithCandidates,
  });
}

export async function castVote(req: Request, res: Response) {
  const { pollId } = req.params;
  const { selections } = (req.body ?? {}) as {
    selections: Array<{ seatId: string; candidateId: string; encryptedPayload: string }>;
  };
  if (!Array.isArray(selections) || selections.length === 0) {
    res.status(400).json({ message: "At least one selection is required" });
    return;
  }
  const pollRows = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId)).limit(1);
  const poll = pollRows[0];
  if (!poll) {
    res.status(404).json({ message: "Poll not found" });
    return;
  }
  if (statusOf(poll) !== "active" || poll.locked) {
    res.status(400).json({ message: "Voting is not currently open for this poll" });
    return;
  }
  const eligibleSeats = await eligibleSeatsForUser(pollId, req.user!.id);
  const eligibleIds = new Set(eligibleSeats.map((s) => s.id));

  for (const sel of selections) {
    if (!eligibleIds.has(sel.seatId)) {
      res.status(403).json({ message: "Not eligible for one of the selected seats" });
      return;
    }
    const existingToken = await db
      .select()
      .from(ballotTokensTable)
      .where(
        and(
          eq(ballotTokensTable.pollId, pollId),
          eq(ballotTokensTable.seatId, sel.seatId),
          eq(ballotTokensTable.userId, req.user!.id),
          eq(ballotTokensTable.used, true),
        ),
      )
      .limit(1);
    if (existingToken[0]) {
      res.status(409).json({ message: "You have already voted for one of the seats in this poll" });
      return;
    }
    const candRows = await db
      .select()
      .from(candidatesTable)
      .where(
        and(
          eq(candidatesTable.id, sel.candidateId),
          eq(candidatesTable.seatId, sel.seatId),
          eq(candidatesTable.status, "approved"),
        ),
      )
      .limit(1);
    if (!candRows[0]) {
      res.status(400).json({ message: "Selected candidate is not valid for this seat" });
      return;
    }
  }

  const recorded: string[] = [];
  for (const sel of selections) {
    const tokenRaw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(tokenRaw).digest("hex");
    const ballotHash = crypto
      .createHash("sha256")
      .update(`${tokenRaw}|${sel.candidateId}|${sel.seatId}|${pollId}`)
      .digest("hex");
    await db.insert(ballotTokensTable).values({
      pollId,
      seatId: sel.seatId,
      userId: req.user!.id,
      tokenHash,
      used: true,
      usedAt: new Date(),
    });
    await db.insert(votesTable).values({
      pollId,
      seatId: sel.seatId,
      candidateId: sel.candidateId,
      encryptedPayload: sel.encryptedPayload,
      ballotHash,
      tokenHash,
    });
    recorded.push(sel.seatId);
  }
  await audit({
    action: "vote.cast",
    actorEmail: req.user!.email,
    actorRole: "student",
    target: pollId,
    details: `seats=${recorded.length}`,
  });
  res.json({ message: "Your vote has been recorded successfully", recordedSeats: recorded });
}

export async function getPollResults(req: Request, res: Response) {
  const { pollId } = req.params;
  const pollRows = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId)).limit(1);
  const poll = pollRows[0];
  if (!poll) {
    res.status(404).json({ message: "Poll not found" });
    return;
  }
  const status = statusOf(poll);
  if (status !== "closed" && req.user!.role !== "admin") {
    res.status(403).json({ message: "Results are not yet available" });
    return;
  }
  const seats = await db.select().from(pollSeatsTable).where(eq(pollSeatsTable.pollId, pollId)).orderBy(asc(pollSeatsTable.position));
  const seatResults = await Promise.all(
    seats.map(async (s) => {
      const candidates = await db
        .select({
          id: candidatesTable.id,
          name: usersTable.name,
        })
        .from(candidatesTable)
        .leftJoin(usersTable, eq(candidatesTable.userId, usersTable.id))
        .where(and(eq(candidatesTable.seatId, s.id), eq(candidatesTable.status, "approved")));
      const counts = await Promise.all(
        candidates.map(async (c) => {
          const r = await db
            .select({ n: count() })
            .from(votesTable)
            .where(and(eq(votesTable.seatId, s.id), eq(votesTable.candidateId, c.id)));
          return { id: c.id, name: c.name ?? "", votes: Number(r[0]?.n ?? 0) };
        }),
      );
      const totalForSeat = counts.reduce((acc, c) => acc + c.votes, 0);
      const winner = counts.length
        ? counts.reduce((best, c) => (c.votes > best.votes ? c : best), counts[0])
        : null;
      return {
        seatId: s.id,
        seatLabel: s.label,
        scope: s.scope,
        totalVotes: totalForSeat,
        candidates: counts,
        winnerId: winner && winner.votes > 0 ? winner.id : null,
      };
    }),
  );
  res.json({
    pollId: poll.id,
    title: poll.title,
    startDate: poll.startDate.toISOString(),
    endDate: poll.endDate.toISOString(),
    status: status as PollStatus,
    seats: seatResults,
  });
}
