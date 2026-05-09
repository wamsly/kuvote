import {
  db,
  schoolsTable,
  departmentsTable,
  coursesTable,
  hostelsTable,
  usersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { SCHOOLS_SEED, HOSTELS_SEED } from "./data/schools.js";
import { hashPassword } from "./lib/auth.js";
import { logger } from "./lib/logger.js";

export async function seedCatalog(): Promise<void> {
  // Wrap in a transaction to ensure atomicity
  await db.transaction(async (tx) => {
    const existingSchools = await tx
      .select({ id: schoolsTable.id })
      .from(schoolsTable)
      .limit(1);

    if (existingSchools.length === 0) {
      logger.info("Seeding schools / departments / courses ...");
      for (const s of SCHOOLS_SEED) {
        await tx
          .insert(schoolsTable)
          .values({ id: s.id, name: s.name })
          .onConflictDoNothing();

        for (const d of s.departments) {
          await db
            .insert(departmentsTable)
            .values({ id: d.id, schoolId: s.id, name: d.name })
            .onConflictDoNothing();

          for (const c of d.courses) {
            await tx
              .insert(coursesTable)
              .values({
                id: c.id,
                departmentId: d.id,
                name: c.name,
                level: c.level,
              })
              .onConflictDoNothing();
          }
        }
      }
    }
  });

  const existingHostels = await db
    .select({ id: hostelsTable.id })
    .from(hostelsTable)
    .limit(1);
  if (existingHostels.length === 0) {
    logger.info("Seeding hostels ...");
    for (const h of HOSTELS_SEED) {
      await db
        .insert(hostelsTable)
        .values({ id: h.id, name: h.name, zone: h.zone, gender: h.gender })
        .onConflictDoNothing();
    }
  }
  const adminEmail = "admin@ku.ac.ke";
  const existingAdmin = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, adminEmail))
    .limit(1);
  if (!existingAdmin[0]) {
    logger.info("Seeding default admin ...");
    // FIX: Await the password hashing
    await db.insert(usersTable).values({
      name: "KUVOTE Administrator",
      email: adminEmail,
      passwordHash: await hashPassword(
        process.env.INITIAL_ADMIN_PASSWORD ?? "Admin123",
      ),
      role: "admin",
      status: "active",
    });
  }
}
