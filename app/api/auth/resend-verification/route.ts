import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 2 resend requests per IP per minute
    const ip = getClientIp(request);
    const { success } = rateLimit(`resend:${ip}`, { limit: 2, windowSeconds: 60 });
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json(
        { message: "If the account needs verification, a new link has been sent." },
        { status: 200 }
      );
    }

    // In development without Resend, auto-verify
    if (!process.env.RESEND_API_KEY) {
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
      return NextResponse.json(
        { message: "Account verified (dev mode)." },
        { status: 200 }
      );
    }

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token);

    return NextResponse.json(
      { message: "If the account needs verification, a new link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
