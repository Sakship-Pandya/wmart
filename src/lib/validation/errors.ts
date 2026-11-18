import type { z } from "zod";

/**
 * Turns zod issues into { "field.path": ["message"] } so nested form fields like
 * name="shipping.city" can show their own error.
 */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Text value of a form field ("" when missing). */
export function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}
