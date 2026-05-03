import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireFeeCleared(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const rows = await db
    .select({ feeStatus: usersTable.feeStatus })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);
  const feeStatus = rows[0]?.feeStatus;
  if (feeStatus !== "cleared") {
    res.status(403).json({
      message: "Your fee balance must be cleared before you can vote. Please visit the finance office.",
      code: "FEE_NOT_CLEARED",
    });
    return;
  }
  next();
}
