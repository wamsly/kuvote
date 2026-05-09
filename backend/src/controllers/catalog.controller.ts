import type { Request, Response } from "express";
import { db, schoolsTable, departmentsTable, coursesTable, hostelsTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { SRC_ROLES, SEAT_TEMPLATES } from "../data/schools";

export async function getSchools(_req: Request, res: Response) {
  const schools = await db.select().from(schoolsTable).orderBy(asc(schoolsTable.name));
  const out = await Promise.all(
    schools.map(async (s) => {
      const depts = await db
        .select()
        .from(departmentsTable)
        .where(eq(departmentsTable.schoolId, s.id))
        .orderBy(asc(departmentsTable.name));
      const departments = await Promise.all(
        depts.map(async (d) => {
          const courses = await db
            .select()
            .from(coursesTable)
            .where(eq(coursesTable.departmentId, d.id))
            .orderBy(asc(coursesTable.name));
          return {
            id: d.id,
            name: d.name,
            courses: courses.map((c) => ({
              id: c.id,
              name: c.name,
              level: c.level as "bachelor" | "diploma",
            })),
          };
        }),
      );
      return { id: s.id, name: s.name, departments };
    }),
  );
  res.json(out);
}

export async function getHostels(_req: Request, res: Response) {
  const rows = await db.select().from(hostelsTable).orderBy(asc(hostelsTable.name));
  res.json(
    rows.map((h) => ({
      id: h.id,
      name: h.name,
      zone: h.zone as "eastern" | "western" | "nyayo",
      gender: h.gender as "male" | "female",
    })),
  );
}

export async function getPositions(_req: Request, res: Response) {
  res.json({
    srcRoles: SRC_ROLES,
    seatTemplates: SEAT_TEMPLATES,
  });
}
