import { db } from "@/server/db";
import { users, sessions, otpCodes, userPreferences } from "@/server/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { User, Session, OtpCode, UserPreferences } from "@/server/db/schema";

const now = () => Math.floor(Date.now() / 1000);

// ─── Users ──────────────────────────────────────────────────────────────────

export async function findOrCreateUser(email: string): Promise<User> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing[0]) return existing[0];

  const t = now();
  const newUser: typeof users.$inferInsert = {
    id: createId(),
    email,
    createdAt: t,
    updatedAt: t,
  };
  await db.insert(users).values(newUser);
  return newUser as User;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<Session> {
  const t = now();
  const session: typeof sessions.$inferInsert = {
    id: createId(),
    userId,
    expiresAt: t + 30 * 24 * 60 * 60, // 30 days
    createdAt: t,
  };
  await db.insert(sessions).values(session);
  return session as Session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export async function createOtpCode(
  email: string,
  code: string,
  salt: string
): Promise<OtpCode> {
  const t = now();

  // Invalidate any existing unused codes for this email before creating a new one
  await db
    .update(otpCodes)
    .set({ used: 1 })
    .where(and(eq(otpCodes.email, email), eq(otpCodes.used, 0)));

  const otp: typeof otpCodes.$inferInsert = {
    id: createId(),
    email,
    code,
    salt,
    expiresAt: t + 10 * 60, // 10 minutes
    used: 0,
    createdAt: t,
  };
  await db.insert(otpCodes).values(otp);
  return otp as OtpCode;
}

export async function getValidOtpCode(email: string): Promise<OtpCode | null> {
  const result = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.used, 0),
        gt(otpCodes.expiresAt, now())
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function markOtpUsed(id: string): Promise<void> {
  await db.update(otpCodes).set({ used: 1 }).where(eq(otpCodes.id, id));
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export type PreferencesInput = {
  numPeople: number;
};

export async function upsertPreferences(
  userId: string,
  input: PreferencesInput
): Promise<void> {
  const t = now();
  const existing = await getUserPreferences(userId);

  const values = {
    numPeople: input.numPeople,
    onboardingCompleted: 1,
    updatedAt: t,
  };

  if (existing) {
    await db
      .update(userPreferences)
      .set(values)
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      id: createId(),
      userId,
      ...values,
      createdAt: t,
    });
  }
}
