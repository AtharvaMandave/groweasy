import { z } from 'zod';
import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from '../types/crm.types';

// ─── Zod schema for validating a single CRM record from AI output ───
export const CRMRecordSchema = z.object({
  created_at: z.string().optional().default(''),
  name: z.string().optional().default(''),
  email: z.string().optional().default(''),
  country_code: z.string().optional().default(''),
  mobile_without_country_code: z.string().optional().default(''),
  company: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  country: z.string().optional().default(''),
  lead_owner: z.string().optional().default(''),
  crm_status: z
    .enum([...CRM_STATUS_VALUES, '' as const])
    .optional()
    .default(''),
  crm_note: z.string().optional().default(''),
  data_source: z
    .enum([...DATA_SOURCE_VALUES, '' as const])
    .optional()
    .default(''),
  possession_time: z.string().optional().default(''),
  description: z.string().optional().default(''),
});

// ─── Schema for AI batch response item (includes skip metadata) ───
export const AIBatchRecordSchema = CRMRecordSchema.extend({
  _skipped: z.boolean().optional().default(false),
  _reason: z.string().optional().default(''),
  _original_row_index: z.number().optional(),
});

// ─── Schema for full AI response array ───
export const AIBatchResponseSchema = z.array(AIBatchRecordSchema);

/**
 * Validate and normalize a raw AI response into typed CRM records.
 * Returns the parsed array or throws a ZodError.
 */
export function validateAIResponse(raw: unknown) {
  return AIBatchResponseSchema.parse(raw);
}

/**
 * Sanitize a CRM record — enforce date validity, strip line breaks from
 * fields that shouldn't have them, trim whitespace.
 */
export function sanitizeCRMRecord(
  record: z.infer<typeof CRMRecordSchema>
): z.infer<typeof CRMRecordSchema> {
  const sanitized = { ...record };

  // Trim all string fields
  for (const key of Object.keys(sanitized) as (keyof typeof sanitized)[]) {
    const val = sanitized[key];
    if (typeof val === 'string') {
      (sanitized as Record<string, unknown>)[key] = val.trim();
    }
  }

  // Validate created_at is parseable by new Date()
  if (sanitized.created_at) {
    const d = new Date(sanitized.created_at);
    if (isNaN(d.getTime())) {
      // If AI gave a bad date, clear it
      sanitized.created_at = '';
    }
  }

  // Escape line breaks in crm_note and description for CSV safety
  if (sanitized.crm_note) {
    sanitized.crm_note = sanitized.crm_note.replace(/\r?\n/g, '\\n');
  }
  if (sanitized.description) {
    sanitized.description = sanitized.description.replace(/\r?\n/g, '\\n');
  }

  // Strip country_code to just the code (e.g., "+91")
  if (sanitized.country_code) {
    sanitized.country_code = sanitized.country_code.replace(/[^+\d]/g, '');
  }

  // Strip mobile to just digits
  if (sanitized.mobile_without_country_code) {
    sanitized.mobile_without_country_code =
      sanitized.mobile_without_country_code.replace(/\D/g, '');
  }

  return sanitized;
}
