import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import * as z from "zod";

// GET single lease
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      }, { status: 401 });
    }

    const lease = await db.lease.findUnique({
      where: {
        id: params.id,
        OR: [
          { userId: user.id },
          { sharedLeases: { some: { userId: user.id } } }
        ]
      },
      include: {
        sharedLeases: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!lease) {
      return NextResponse.json({
        success: false,
        message: "Lease not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: lease
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to fetch lease",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// PUT - Update lease
const updateLeaseSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  monthlyRent: z.number().positive().optional(),
  securityDeposit: z.number().min(0).optional(),
  additionalCharges: z.number().min(0).optional(),
  annualRentIncrease: z.number().min(0).optional(),
  leaseType: z.enum(["RESIDENTIAL", "COMMERCIAL"]).optional(),
  utilitiesIncluded: z.boolean().optional(),
  monthlyMaintenanceFee: z.number().min(0).optional(),
  latePaymentPenalty: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Extract only the fields we want to update
    const { sharedLeases, ...updateData } = body;

    const updatedLease = await db.lease.update({
      where: { id: params.id },
      data: updateData, // Only pass the direct fields, not relations
    });

    return NextResponse.json({ data: updatedLease });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lease" },
      { status: 500 }
    );
  }
}

// DELETE lease
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      }, { status: 401 });
    }

    // Verify user owns the lease
    const existingLease = await db.lease.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingLease) {
      return NextResponse.json({
        success: false,
        message: "Lease not found or you don't have permission to delete it"
      }, { status: 404 });
    }

    await db.lease.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: "Lease successfully deleted"
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to delete lease",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}