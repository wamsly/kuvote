import type { Request, Response } from "express";
import path from "node:path";
import fs from "node:fs";
import {
  db,
  candidatesTable,
  candidateDocumentsTable,
  pollsTable,
  pollSeatsTable,
  endorsementsTable,
  electionApplicationSettingsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { audit } from "../lib/audit";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function applyCandidate(req: Request, res: Response) {
  const { pollId, seatId, manifesto, slogan, bio } = (req.body ?? {}) as Record<string, string>;
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
  const appSettings = await db
    .select()
    .from(electionApplicationSettingsTable)
    .where(eq(electionApplicationSettingsTable.pollId, pollId))
    .limit(1);
  const settings = appSettings[0];
  if (!settings || !settings.isOpen) {
    res.status(400).json({ message: "The application window for this poll is currently closed. Please wait until the admin opens it." });
    return;
  }
  if (settings.closeAt && new Date() > settings.closeAt) {
    await db
      .update(electionApplicationSettingsTable)
      .set({ isOpen: false })
      .where(eq(electionApplicationSettingsTable.pollId, pollId));
    res.status(400).json({ message: "The application window has expired." });
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
    .values({ pollId, seatId, userId: req.user!.id, manifesto, slogan: slogan ?? null, bio: bio ?? null, status: "pending" })
    .returning();
  await audit({
    action: "candidate.apply",
    actorEmail: req.user!.email,
    actorRole: "student",
    target: seatId,
  });
  res.status(201).json({ id: inserted[0].id, message: "Application submitted" });
}

export async function uploadCandidateDocument(req: Request, res: Response) {
  const { candidateId } = req.params;
  const { documentName, documentType, fileData, fileName } = (req.body ?? {}) as Record<string, string>;
  if (!documentName || !fileData || !fileName) {
    res.status(400).json({ message: "documentName, fileData and fileName are required" });
    return;
  }
  const candRows = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.id, candidateId), eq(candidatesTable.userId, req.user!.id)))
    .limit(1);
  if (!candRows[0]) {
    res.status(404).json({ message: "Candidate application not found" });
    return;
  }
  const ext = path.extname(fileName).toLowerCase();
  const safeFileName = `${candidateId}_${Date.now()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeFileName);
  const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
  const documentUrl = `/api/uploads/${safeFileName}`;
  const inserted = await db
    .insert(candidateDocumentsTable)
    .values({
      candidateId,
      documentName,
      documentUrl,
      documentType: documentType ?? "document",
    })
    .returning();
  await audit({
    action: "candidate.upload_document",
    actorEmail: req.user!.email,
    actorRole: "student",
    target: candidateId,
    details: documentName,
  });
  res.status(201).json({ id: inserted[0].id, documentUrl, message: "Document uploaded" });
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
      slogan: candidatesTable.slogan,
      bio: candidatesTable.bio,
      photoUrl: candidatesTable.photoUrl,
      status: candidatesTable.status,
      rejectionReason: candidatesTable.rejectionReason,
      createdAt: candidatesTable.createdAt,
    })
    .from(candidatesTable)
    .leftJoin(pollsTable, eq(candidatesTable.pollId, pollsTable.id))
    .leftJoin(pollSeatsTable, eq(candidatesTable.seatId, pollSeatsTable.id))
    .where(eq(candidatesTable.userId, req.user!.id))
    .orderBy(desc(candidatesTable.createdAt));

  const withDocs = await Promise.all(
    rows.map(async (r) => {
      const docs = await db
        .select()
        .from(candidateDocumentsTable)
        .where(eq(candidateDocumentsTable.candidateId, r.id));
      return {
        id: r.id,
        pollId: r.pollId,
        pollTitle: r.pollTitle ?? "",
        seatId: r.seatId,
        seatLabel: r.seatLabel ?? "",
        manifesto: r.manifesto,
        slogan: r.slogan ?? null,
        bio: r.bio ?? null,
        photoUrl: r.photoUrl ?? null,
        status: r.status as "pending" | "endorsed" | "approved" | "rejected",
        rejectionReason: r.rejectionReason ?? null,
        createdAt: r.createdAt.toISOString(),
        documents: docs.map((d) => ({
          id: d.id,
          documentName: d.documentName,
          documentUrl: d.documentUrl,
          documentType: d.documentType,
          uploadedAt: d.uploadedAt.toISOString(),
        })),
      };
    }),
  );
  res.json(withDocs);
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

export async function getApplicationSettings(req: Request, res: Response) {
  const { pollId } = req.params;
  const rows = await db
    .select()
    .from(electionApplicationSettingsTable)
    .where(eq(electionApplicationSettingsTable.pollId, pollId))
    .limit(1);
  if (!rows[0]) {
    res.json({ pollId, isOpen: false, openAt: null, closeAt: null, timerDurationMinutes: null });
    return;
  }
  const r = rows[0];
  const isExpired = r.closeAt && new Date() > r.closeAt;
  res.json({
    pollId,
    isOpen: r.isOpen && !isExpired,
    openAt: r.openAt?.toISOString() ?? null,
    closeAt: r.closeAt?.toISOString() ?? null,
    timerDurationMinutes: r.timerDurationMinutes ?? null,
  });
}
