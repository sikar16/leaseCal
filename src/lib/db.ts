// import {PrismaClient} from '@prisma/client';

// const globalForPrisma=globalThis as unknown as {
//     prisma:PrismaClient | undefined
// }

// const prisma=globalForPrisma.prisma ?? new PrismaClient()

// if(process.env.NODE_ENV !=='production') globalForPrisma.prisma=prisma

// export const db=prisma

// lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;