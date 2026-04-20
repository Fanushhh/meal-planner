import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const result = await transporter.sendMail({
    from: `"La Cucina" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Your sign-in code: ${code}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #f2e9d8; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="font-style: italic; font-size: 26px; color: #2a2620;">La Cucina</div>
          <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8068; margin-top: 4px;">EST. MCMXCII</div>
        </div>
        <div style="border-top: 3px solid #a63a1f; background: #ece2cd; padding: 32px;">
          <p style="font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8068; margin: 0 0 6px;">Your sign-in code</p>
          <div style="font-style: italic; font-size: 28px; color: #2a2620; margin-bottom: 16px;">Use this code to sign in</div>
          <p style="font-size: 14px; color: #57503f; margin: 0 0 24px;">It expires in 10 minutes.</p>
          <div style="font-family: monospace; font-size: 42px; font-weight: bold; letter-spacing: 16px; color: #a63a1f; margin: 24px 0; text-align: center;">
            ${code}
          </div>
          <hr style="border: none; border-top: 1px solid #c9bb9b; margin: 24px 0;" />
          <p style="color: #8a8068; font-size: 12px; font-family: monospace; margin: 0;">If you didn't request this, you can ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #8a8068; font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; margin: 0;">
            La Cucina · <a href="${appUrl}" style="color: #a63a1f;">${appUrl}</a>
          </p>
        </div>
      </div>
    `,
  });

  if (!result.messageId) {
    throw new Error("Failed to send email — no message ID returned.");
  }
}
