"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { generateOtp, generateSalt, hashOtp, verifyOtp } from "@/server/lib/otp";
import { sendOtpEmail } from "@/server/lib/email";
import {
  findOrCreateUser,
  createOtpCode,
  getValidOtpCode,
  markOtpUsed,
  createSession,
  deleteSession,
  getUserPreferences,
} from "@/server/queries/users";
import { getSession, setSessionCookie, clearSessionCookie } from "@/server/lib/auth";

const emailSchema = z.string().email();
const otpSchema = z.string().length(6).regex(/^\d+$/);

export type ActionResult = { error: string } | { success: true };

export async function sendOtp(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = formData.get("email");
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { error: "Please enter a valid email address." };

  const normalizedEmail = parsed.data.toLowerCase();

  await findOrCreateUser(normalizedEmail);

  const code = generateOtp();
  const salt = generateSalt();
  const hashedCode = hashOtp(code, salt);

  await createOtpCode(normalizedEmail, hashedCode, salt);

  try {
    await sendOtpEmail(normalizedEmail, code);
  } catch (err) {
    console.error("[sendOtp] email error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { error: `Failed to send email: ${msg}` };
  }

  redirect(`/verify?email=${encodeURIComponent(normalizedEmail)}`);
}

export async function verifyOtpAction(
  email: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const code = formData.get("code");
  const emailParsed = emailSchema.safeParse(email);
  const codeParsed = otpSchema.safeParse(code);

  if (!emailParsed.success) return { error: "Invalid email." };
  if (!codeParsed.success) return { error: "Please enter a valid 6-digit code." };

  const otpRecord = await getValidOtpCode(emailParsed.data.toLowerCase());
  if (!otpRecord) return { error: "Code expired or not found. Please request a new one." };

  const valid = verifyOtp(codeParsed.data, otpRecord.salt, otpRecord.code);
  if (!valid) return { error: "Incorrect code. Please try again." };

  await markOtpUsed(otpRecord.id);

  const user = await findOrCreateUser(emailParsed.data.toLowerCase());
  const session = await createSession(user.id);
  await setSessionCookie(session.id, session.expiresAt);

  const prefs = await getUserPreferences(user.id);
  if (!prefs || !prefs.onboardingCompleted) {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const sessionData = await getSession();
  if (sessionData) {
    await deleteSession(sessionData.session.id);
  }
  await clearSessionCookie();
  redirect("/login");
}
