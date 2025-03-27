// app/api/leases/route.ts
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions ";
import { NextResponse } from "next/server";
import * as z from "zod";

const leaseSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  monthlyRent: z.number().positive(),
  securityDeposit: z.number().min(0),
  additionalCharges: z.number().min(0).optional(),
  annualRentIncrease: z.number().min(0).optional(),
  leaseType: z.enum(["RESIDENTIAL", "COMMERCIAL"]).optional(),
  utilitiesIncluded: z.boolean().optional(),
  monthlyMaintenanceFee: z.number().min(0).optional(),
  latePaymentPenalty: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        leases: true,
        sharedLeases: {
          include: {
            lease: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Combine owned leases and shared leases
    const allLeases = [
      ...user.leases,
      ...user.sharedLeases.map(shared => shared.lease)
    ];

    // Transform dates to strings and ensure all fields are present
    const formattedLeases = allLeases.map(lease => ({
      ...lease,
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate.toISOString(),
      leaseType: lease.leaseType || "RESIDENTIAL",
      utilitiesIncluded: lease.utilitiesIncluded || false,
      monthlyMaintenanceFee: lease.monthlyMaintenanceFee || 0,
      latePaymentPenalty: lease.latePaymentPenalty || 0,
      additionalCharges: lease.additionalCharges || undefined,
      annualRentIncrease: lease.annualRentIncrease || 0,
      notes: lease.notes || undefined
    }));

    return NextResponse.json(
      { success: true, data: formattedLeases },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching leases:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = leaseSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const lease = await db.lease.create({
      data: {
        ...data,
        userId: user.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        // Ensure optional fields have proper defaults
        leaseType: data.leaseType || "RESIDENTIAL",
        utilitiesIncluded: data.utilitiesIncluded || false,
        monthlyMaintenanceFee: data.monthlyMaintenanceFee || 0,
        latePaymentPenalty: data.latePaymentPenalty || 0,
        annualRentIncrease: data.annualRentIncrease || 0
      },
    });

    // Format the response to match frontend expectations
    const responseData = {
      ...lease,
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate.toISOString()
    };

    return NextResponse.json(
      { success: true, data: responseData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lease:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation error", 
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          })) 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}