import { Resend } from "resend";

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${domain}/auth/verify?token=${token}`;

  const resend = getResend();
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "CTO Map <noreply@resend.dev>",
    to: email,
    subject: "Verify your email — CTO Map",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1f2937;">Verify your email</h2>
        <p style="color: #4b5563;">Click the button below to verify your email address and activate your account.</p>
        <a href="${confirmLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #2563eb, #4f46e5); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        <p style="color: #9ca3af; font-size: 12px;">This link expires in 1 hour.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${domain}/auth/reset-password?token=${token}`;

  const resend = getResend();
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "CTO Map <noreply@resend.dev>",
    to: email,
    subject: "Reset your password — CTO Map",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1f2937;">Reset your password</h2>
        <p style="color: #4b5563;">Click the button below to reset your password.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #2563eb, #4f46e5); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #9ca3af; font-size: 12px;">This link expires in 1 hour.</p>
      </div>
    `,
  });
}
