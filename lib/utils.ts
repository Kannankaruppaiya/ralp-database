import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Initials from a person's name, ignoring honorifics —
 * "Mr. V. Kannan" -> "VK", "David Evans" -> "DE".
 */
export function initialsFrom(name: string): string {
  const parts = name
    .replace(/\b(mr|mrs|ms|dr|miss|prof|sister)\.?\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.map((p) => p[0]).join('');
  return (letters.slice(0, 2) || name.slice(0, 2)).toUpperCase();
}
