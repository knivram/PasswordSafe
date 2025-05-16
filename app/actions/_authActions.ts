"use server";

import { PrismaClient } from "@/generated/prisma";
import { AuthError } from "@/lib/errors";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function finishOnboarding(data: {
  salt: string;
  publicKey: string;
  wrappedPrivateKey: string;
}) {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

  // TODO: handle user without primary email correctly
  const email = user.primaryEmailAddress!.emailAddress;

  const { salt, publicKey, wrappedPrivateKey } = data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (existingUser) {
      throw new AuthError("Your account is allready onboarded.");
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

    const client = await clerkClient();
    await client.users.updateUser(user.id, {
      publicMetadata: {
        onboardingComplete: true,
      },
    });
    console.log("User onboarded successfully.");
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Finish onboarding error:", error);
    throw new AuthError(
      "Failed to finish onboarding. Please try again later.",
    );
  }
}
