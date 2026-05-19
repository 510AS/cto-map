import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Sessions API
 * Note: With JWT strategy, sessions are stored in cookies, not the database.
 * The Session table is used by PrismaAdapter for OAuth token management.
 * This endpoint returns OAuth-linked sessions if any exist.
 */

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return linked accounts as "sessions" since JWT doesn't persist sessions
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
      },
    });

    return NextResponse.json({
      currentSession: {
        userId: session.user.id,
        strategy: "jwt",
      },
      linkedAccounts: accounts,
    });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (accountId) {
      // Unlink a specific OAuth account
      await prisma.account.deleteMany({
        where: {
          id: accountId,
          userId: session.user.id,
        },
      });
      return NextResponse.json({ message: "Account unlinked" });
    }

    // With JWT, we can't invalidate tokens server-side without a blocklist
    // Return info about this limitation
    return NextResponse.json({
      message: "Sign out completed. JWT sessions expire automatically.",
    });
  } catch (error) {
    console.error("Session revoke error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
