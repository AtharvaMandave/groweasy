import { parse } from 'csv-parse/sync';

/**
 * Parse a CSV buffer into an array of key-value objects.
 * Handles BOM, auto-detects delimiters, and trims whitespace.
 */
export function parseCSV(buffer: Buffer): Record<string, string>[] {
  // Remove BOM if present
  let content = buffer.toString('utf-8');
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  // Auto-detect delimiter from the first line
  const firstLine = content.split(/\r?\n/)[0] || '';
  const delimiter = detectDelimiter(firstLine);

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter,
    relax_column_count: true,
    relax_quotes: true,
    skip_records_with_error: true,
  }) as Record<string, string>[];

  return records;
}

/**
 * Auto-detect delimiter by counting occurrences in the header line.
 */
function detectDelimiter(headerLine: string): string {
  const candidates = [',', '\t', ';', '|'];
  let best = ',';
  let maxCount = 0;

  for (const d of candidates) {
    const count = (headerLine.match(new RegExp(escapeRegex(d), 'g')) || [])
      .length;
    if (count > maxCount) {
      maxCount = count;
      best = d;
    }
  }

  return best;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
