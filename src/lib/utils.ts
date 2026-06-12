import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize a string for safe embedding in JSON-LD <script> blocks.
 * Prevents XSS by escaping </script> tags and other dangerous sequences.
 */
export function sanitizeForJsonLd(str: string): string {
  return str
    .replace(/<\/script>/gi, "<\\/script>")
    .replace(/<!--/g, "<\\!--")
    .replace(/]]>/g, "]\\]>");
}
