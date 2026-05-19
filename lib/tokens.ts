import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function generateVerificationToken(email: string) {
  const token = randomUUID();
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  // Delete existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return verificationToken;
}

export async function generatePasswordResetToken(email: string) {
  const token = randomUUID();
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  // Delete existing tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  const passwordResetToken = await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return passwordResetToken;
}
