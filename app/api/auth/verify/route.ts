import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing verification token" },
        { status: 400 }
      );
    }

    const existingToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    if (new Date() > existingToken.expires) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: "Token has expired. Please register again." },
        { status: 400 }
      );
    }

    // Verify the user
    await prisma.user.update({
      where: { email: existingToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json(
      { message: "Email verified successfully. You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
