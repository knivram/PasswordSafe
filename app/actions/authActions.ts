"use server";

import { PrismaClient } from "@/generated/prisma";
import argon2 from "argon2";
import { AuthError } from "@/lib/errors";

const prisma = new PrismaClient();

export async function registerUser(data: {
  email: string;
  password: string;
  salt: string; // base64-encoded Uint8Array
  publicKey: string; // base64-encoded SPKI
  wrappedPrivateKey: string; // base64-encoded AES-GCM blob
}) {
  const { email, password, salt, publicKey, wrappedPrivateKey } = data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AuthError("Email already registered");
    }

    // Hash the password with the same salt client-generated
    const hash = await argon2.hash(password, {
      salt: Buffer.from(salt, "base64"),
    });

    // Persist the new user
    await prisma.user.create({
      data: {
        email,
        hash,
        salt,
        publicKey,
        wrappedPrivateKey,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Registration error:", error);
    throw new AuthError("Failed to create account. Please try again later.");
  }
}
