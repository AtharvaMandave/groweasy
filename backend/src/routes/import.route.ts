import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { parseCSV } from '../services/csv.service';
import { extractCRMRecords } from '../services/ai.service';

const router = Router();

// ─── Multer config: memory storage, 10MB limit, CSV only ───
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'text/plain',
      'application/csv',
      'text/comma-separated-values',
    ];
    // Also check extension since MIME detection can be unreliable
    const isCSV =
      allowedMimes.includes(file.mimetype) ||
      file.originalname.toLowerCase().endsWith('.csv');

    if (isCSV) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * POST /api/import
 * Accept CSV file, parse it, extract CRM records via AI, return results.
 */
router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Validate file presence
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded. Please upload a CSV file.',
        });
        return;
      }

      console.log(
        `Received file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`
      );

      // 2. Parse CSV
      let rows: Record<string, string>[];
      try {
        rows = parseCSV(req.file.buffer);
      } catch (err) {
        res.status(422).json({
          success: false,
          error: `Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
        return;
      }

      if (rows.length === 0) {
        res.status(400).json({
          success: false,
          error: 'CSV file contains no data rows.',
        });
        return;
      }

      console.log(`Parsed ${rows.length} rows with columns: ${Object.keys(rows[0]).join(', ')}`);

      // 3. AI extraction
      const result = await extractCRMRecords(rows);

      console.log(
        `Extraction complete: ${result.stats.imported} imported, ${result.stats.skipped} skipped`
      );

      // 4. Return results
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
