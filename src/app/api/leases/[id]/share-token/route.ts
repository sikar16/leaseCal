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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const lease = await db.lease.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!lease) {
      return NextResponse.json(
        { error: "Lease not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Generate or reuse a share token
    const shareToken = lease.shareToken || uuidv4();

    // Update the lease with the share token
    await db.lease.update({
      where: { id: params.id },
      data: { shareToken },
    });

    return NextResponse.json(
      { token: shareToken },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating share token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}