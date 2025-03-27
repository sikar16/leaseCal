import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions ";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true } // Only select needed fields
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Validate lease ownership
    const lease = await db.lease.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
      select: {
        id: true,
        shareToken: true
      }
    });

    if (!lease) {
      return NextResponse.json(
        { error: "Lease not found or access denied" },
        { status: 404 }
      );
    }

    // Generate or reuse token in a single transaction
    const updatedLease = await db.lease.update({
      where: { id: params.id },
      data: {
        shareToken: lease.shareToken || uuidv4()
      },
      select: {
        shareToken: true
      }
    });

    if (!updatedLease.shareToken) {
      throw new Error("Failed to generate share token");
    }

    return NextResponse.json(
      { 
        token: updatedLease.shareToken,
        shareUrl: `${process.env.NEXTAUTH_URL}/dashboard/share/${updatedLease.shareToken}`
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[SHARE_TOKEN_ERROR]", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}