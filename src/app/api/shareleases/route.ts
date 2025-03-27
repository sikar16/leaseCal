import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for token validation
const tokenSchema = z.string().uuid();

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
    try {
        const { token } = params;

        // Validate the token format
        const validation = tokenSchema.safeParse(token);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid share token format',
                    details: validation.error.errors
                },
                { status: 400 }
            );
        }

        const sharedLease = await prisma.sharedLease.findUnique({
            where: { shareToken: token }, // Now `shareToken` exists in SharedLease
            include: {
                lease: {
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
        

        if (!sharedLease) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Shared lease not found or token expired'
                },
                { status: 404 }
            );
        }

        // Check if lease is active
        if (new Date(sharedLease.lease.endDate) < new Date()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'This lease has expired',
                    endedAt: sharedLease.lease.endDate
                },
                { status: 410 }
            );
        }

        // Format response data
        const responseData = {
            lease: {
                id: sharedLease.lease.id,
                leaseType: sharedLease.lease.leaseType,
                startDate: sharedLease.lease.startDate,
                endDate: sharedLease.lease.endDate,
                monthlyRent: sharedLease.lease.monthlyRent,
                securityDeposit: sharedLease.lease.securityDeposit,
                utilitiesIncluded: sharedLease.lease.utilitiesIncluded,
                owner: {
                    name: sharedLease.lease.user.name,
                    email: sharedLease.lease.user.email
                }
            },
            sharedAt: sharedLease.createdAt,
            shareToken: sharedLease.shareToken
        };

        return NextResponse.json({ success: true, data: responseData });
    } catch (error) {
        console.error('Error fetching shared lease:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
