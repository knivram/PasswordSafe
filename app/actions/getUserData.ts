"use server";

import { AuthError } from "@/lib/errors";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getUserData() {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      salt: true,
      wrappedPrivateKey: true,
      publicKey: true,
    },
  });

  if (!userData) {
    throw new AuthError("User data not found.");
  }

  return userData;
}
