import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
