"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { AuthError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

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
