"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@/generated/prisma";
import { AuthError } from "@/lib/errors";

const prisma = new PrismaClient();

export async function finishOnboarding(data: {
  salt: string;
  publicKey: string;
  wrappedPrivateKey: string;
}) {
  const client = await clerkClient();
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

  // TODO: handle user without primary email correctly
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const email = user.primaryEmailAddress!.emailAddress;

  const { salt, publicKey, wrappedPrivateKey } = data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (existingUser) {
      await client.users.updateUser(user.id, {
        publicMetadata: {
          onboardingComplete: true,
        },
      });
      return;
    }

    // Persist the new user
    await prisma.user.create({
      data: {
        id: user.id,
        email,
        salt,
        publicKey,
        wrappedPrivateKey,
      },
    });

    await client.users.updateUser(user.id, {
      publicMetadata: {
        onboardingComplete: true,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Finish onboarding error:", error);
    throw new AuthError("Failed to finish onboarding. Please try again later.");
  }
}
