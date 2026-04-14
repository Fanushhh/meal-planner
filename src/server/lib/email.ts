import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: email,
    subject: `Your login code: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Your Meal Planner login code</h2>
        <p style="color: #555;">Use this code to sign in. It expires in 10 minutes.</p>
        <div style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #16a34a; margin: 32px 0;">
          ${code}
        </div>
        <p style="color: #888; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">Meal Planner · <a href="${appUrl}" style="color: #16a34a;">${appUrl}</a></p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }
}
