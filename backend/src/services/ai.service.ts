import Groq from 'groq-sdk';
import { SYSTEM_PROMPT, buildBatchPrompt } from '../prompts/crm-extraction.prompt';
import { validateAIResponse, sanitizeCRMRecord } from '../utils/validate.utils';
import {
  chunkArray,
  processBatchesConcurrently,
  withRetry,
} from '../utils/batch.utils';
import type {
  CRMRecord,
  SkippedRecord,
  ImportResult,
  AIBatchRecord,
} from '../types/crm.types';

// ─── Initialize Groq client ───
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Main extraction pipeline.
 * Takes raw CSV rows and returns structured CRM records.
 */
export async function extractCRMRecords(
  rows: Record<string, string>[]
): Promise<ImportResult> {
  const batchSize = parseInt(process.env.BATCH_SIZE || '25', 10);
  const concurrency = parseInt(process.env.MAX_CONCURRENT_BATCHES || '3', 10);

  const batches = chunkArray(rows, batchSize);
  console.log(
    `Processing ${rows.length} rows in ${batches.length} batches (size: ${batchSize}, concurrency: ${concurrency})`
  );

  const allRecords: CRMRecord[] = [];
  const allSkipped: SkippedRecord[] = [];

  // Process all batches with concurrency control
  const batchResults = await processBatchesConcurrently(
    batches,
    async (batch, batchIndex) => {
      const startIndex = batchIndex * batchSize;
      console.log(
        `  Batch ${batchIndex + 1}/${batches.length}: rows ${startIndex + 1}-${startIndex + batch.length}`
      );

      try {
        return await withRetry(
          () => processSingleBatch(batch, startIndex),
          3,
          1000
        );
      } catch (err) {
        // If all retries fail, mark entire batch as skipped
        console.error(
          `  Batch ${batchIndex + 1} failed after all retries:`,
          err
        );
        return {
          records: [] as CRMRecord[],
          skipped: batch.map((row, i) => ({
            row: startIndex + i + 1,
            reason: `AI extraction failed after 3 retries: ${err instanceof Error ? err.message : String(err)}`,
            raw: row,
          })) as SkippedRecord[],
        };
      }
    },
    concurrency
  );

  // Aggregate results from all batches
  for (const result of batchResults) {
    allRecords.push(...result.records);
    allSkipped.push(...result.skipped);
  }

  return {
    stats: {
      total: rows.length,
      imported: allRecords.length,
      skipped: allSkipped.length,
      batches: batches.length,
    },
    records: allRecords,
    skipped: allSkipped,
  };
}

/**
 * Process a single batch of rows through the AI.
 */
async function processSingleBatch(
  batch: Record<string, string>[],
  startIndex: number
): Promise<{ records: CRMRecord[]; skipped: SkippedRecord[] }> {
  const userPrompt = buildBatchPrompt(batch, startIndex);

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    model: MODEL,
    temperature: 0.1, // Low temperature for consistent extraction
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  });

  const responseText = chatCompletion.choices[0]?.message?.content || '';

  // Parse the AI response
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // Sometimes the AI wraps in an object like { "records": [...] }
    // Try to extract the array
    const arrayMatch = responseText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      parsed = JSON.parse(arrayMatch[0]);
    } else {
      throw new Error(`Failed to parse AI response as JSON: ${responseText.slice(0, 200)}`);
    }
  }

  // Handle case where AI returns { records: [...] } instead of [...]
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    // Find the first array-valued property
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        parsed = obj[key];
        break;
      }
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI response is not an array');
  }

  // Validate with zod
  const validated = validateAIResponse(parsed);

  // Separate into records and skipped
  const records: CRMRecord[] = [];
  const skipped: SkippedRecord[] = [];

  for (const item of validated as AIBatchRecord[]) {
    if (item._skipped) {
      const rowIndex = item._original_row_index ?? 0;
      skipped.push({
        row: rowIndex + 1, // 1-indexed for user display
        reason: item._reason || 'Skipped by AI',
        raw: batch[rowIndex - startIndex] || {},
      });
    } else {
      // Remove internal AI metadata fields
      const { _skipped, _reason, _original_row_index, ...crmFields } = item;

      // Final sanitization pass
      // zod .default('') guarantees all fields are populated strings at runtime
      const sanitized = sanitizeCRMRecord(crmFields as Parameters<typeof sanitizeCRMRecord>[0]);

      // Double-check: skip if no email and no mobile
      if (!sanitized.email && !sanitized.mobile_without_country_code) {
        const rowIndex = _original_row_index ?? startIndex;
        skipped.push({
          row: rowIndex + 1,
          reason: 'No email or mobile number found',
          raw: batch[rowIndex - startIndex] || {},
        });
      } else {
        records.push(sanitized);
      }
    }
  }

  return { records, skipped };
}
