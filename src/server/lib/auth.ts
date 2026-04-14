import { cookies } from "next/headers";
import { db } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { User, Session } from "@/server/db/schema";

const SESSION_COOKIE = "session";
const now = () => Math.floor(Date.now() / 1000);

export type SessionData = {
  user: User;
  session: Session;
};

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const result = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now())))
    .limit(1);

  return result[0] ?? null;
}

export async function setSessionCookie(sessionId: string, expiresAt: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt * 1000),
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
