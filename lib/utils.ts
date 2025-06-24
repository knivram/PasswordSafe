import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AccessRole } from "@/generated/prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureFullUrl(url: string): string | undefined {
  const trimmedUrl = url.trim();
  if (trimmedUrl === "") {
    return undefined;
  }
  if (!trimmedUrl.toLowerCase().startsWith("http")) {
    return `https://${trimmedUrl}`;
  }
  return trimmedUrl;
}

export function getRoleDisplayName(
  role: AccessRole,
  withDescription: boolean = false
): string {
  const roleDisplayNames: Record<AccessRole, string> = {
    VIEWER: "Viewer" + (withDescription ? " - Can view secrets" : ""),
    EDITOR: "Editor" + (withDescription ? " - Can add and edit secrets" : ""),
    OWNER: "Owner" + (withDescription ? " - Can do anything" : ""),
  };
  // eslint-disable-next-line security/detect-object-injection -- role is a valid AccessRole
  return roleDisplayNames[role] ?? role;
}
