"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { withAuth } from "@/lib/auth";
import {
  AppError,
  ErrorCode,
  withErrorHandling,
  NotFoundError,
} from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const finishOnboarding = withErrorHandling(
  withAuth(
    async (
      { user },
      data: {
        salt: string;
        publicKey: string;
        wrappedPrivateKey: string;
      }
    ) => {
      const client = await clerkClient();

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
        if (error instanceof AppError) {
          throw error;
        }
        console.error("Finish onboarding error:", error);
        throw new AppError(
          "Failed to finish onboarding. Please try again later.",
          ErrorCode.ONBOARDING_FAILED
        );
      }
    }
  )
);

export const getUserData = withErrorHandling(
  withAuth(async ({ user }) => {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        salt: true,
        wrappedPrivateKey: true,
        publicKey: true,
      },
    });

    if (!userData) {
      throw new NotFoundError("User data not found.", ErrorCode.NOT_FOUND);
    }

    return userData;
  })
);
