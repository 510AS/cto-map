import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 5 reset attempts per IP per minute
    const ip = getClientIp(request);
    const { success } = rateLimit(`reset:${ip}`, { limit: 5, windowSeconds: 60 });
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const existingToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    if (new Date() > existingToken.expires) {
      await prisma.passwordResetToken.delete({
        where: { id: existingToken.id },
      });
      return NextResponse.json(
        { error: "Token has expired. Please request a new reset link." },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: existingToken.email },
      data: { password: hashedPassword },
    });

    // Delete the token
    await prisma.passwordResetToken.delete({
      where: { id: existingToken.id },
    });

    return NextResponse.json(
      { message: "Password reset successfully. You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
