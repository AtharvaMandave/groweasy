// ─── CRM Status Enum ───
export const CRM_STATUS_VALUES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;

export type CRMStatus = (typeof CRM_STATUS_VALUES)[number];

// ─── Data Source Enum ───
export const DATA_SOURCE_VALUES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
] as const;

export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

// ─── CRM Record ───
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
  data_source?: DataSource | '';
  possession_time?: string;
  description?: string;
}

// ─── Skipped Record ───
export interface SkippedRecord {
  row: number;
  reason: string;
  raw: Record<string, string>;
}

// ─── Import Result ───
export interface ImportResult {
  stats: {
    total: number;
    imported: number;
    skipped: number;
    batches: number;
  };
  records: CRMRecord[];
  skipped: SkippedRecord[];
}

// ─── AI Batch Response ───
export interface AIBatchRecord extends CRMRecord {
  _skipped?: boolean;
  _reason?: string;
  _original_row_index?: number;
}
