import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Zod schema for token validation
const tokenSchema = z.string().uuid();

router.get('/dashboard/share/:token', async (req: Request, res: Response) => {
    try {
        // Validate the token format
        const validation = tokenSchema.safeParse(req.params.token);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid share token format',
                details: validation.error.errors
            });
        }

        const { token } = req.params;

        const sharedLease = await prisma.sharedLease.findUnique({
            where: { shareToken: token },
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
            return res.status(404).json({
                success: false,
                error: 'Shared lease not found or token expired'
            });
        }

        // Check if lease is active
        if (new Date(sharedLease.lease.endDate) < new Date()) {
            return res.status(410).json({
                success: false,
                error: 'This lease has expired',
                endedAt: sharedLease.lease.endDate
            });
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

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Error fetching shared lease:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
});

export default router;