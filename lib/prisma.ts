import { type AccessRole, PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

const SHAREABLE_ROLES = ["VIEWER", "EDITOR"] as const satisfies Exclude<
  AccessRole,
  "OWNER"
>[];

export { prisma, SHAREABLE_ROLES };
