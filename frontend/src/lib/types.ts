// ─── CRM Types (shared with backend) ───

export const CRM_STATUS_VALUES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;

export type CRMStatus = (typeof CRM_STATUS_VALUES)[number];

export interface CRMRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: CRMStatus | '';
  crm_note?: string;
  data_source?: string;
  possession_time?: string;
  description?: string;
}

export interface SkippedRecord {
  row: number;
  reason: string;
  raw: Record<string, string>;
}

export interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  batches: number;
}

export interface ImportResult {
  stats: ImportStats;
  records: CRMRecord[];
  skipped: SkippedRecord[];
}

export interface APIResponse {
  success: boolean;
  data?: ImportResult;
  error?: string;
}

export type AppStep = 'upload' | 'preview' | 'processing' | 'results';
