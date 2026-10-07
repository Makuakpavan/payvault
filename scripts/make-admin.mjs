// Usage: npm run make-admin -- you@example.com   (the user must already have signed up)
import { PrismaClient } from "@prisma/client";
const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) { console.error("Usage: npm run make-admin -- you@example.com"); process.exit(1); }
const db = new PrismaClient();
try {
  await db.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`${email} is now an admin.`);
} catch { console.error("No user with that email. Sign up first."); process.exitCode = 1; }
finally { await db.$disconnect(); }
