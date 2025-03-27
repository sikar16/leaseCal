import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import * as z from "zod";

const shareLeaseSchema = z.object({
  leaseId: z.string(),
  userId: z.number().positive()
});

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      }, { status: 401 });
    }

    const body = await req.json();
    const { leaseId, userId } = shareLeaseSchema.parse(body);

    // Verify current user owns the lease
    const lease = await db.lease.findFirst({
      where: {
        id: leaseId,
        userId: currentUser.id
      }
    });

    if (!lease) {
      return NextResponse.json({
        success: false,
        message: "Lease not found or you don't have permission to share it"
      }, { status: 404 });
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }

    // Check if lease is already shared with this user
    const existingShare = await db.sharedLease.findUnique({
      where: {
        leaseId_userId: {
          leaseId,
          userId
        }
      }
    });

    if (existingShare) {
      return NextResponse.json({
        success: false,
        message: "Lease is already shared with this user"
      }, { status: 409 });
    }

    // Create the share
    const sharedLease = await db.sharedLease.create({
      data: {
        leaseId,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      data: sharedLease,
      message: "Lease successfully shared"
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Validation error",
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}