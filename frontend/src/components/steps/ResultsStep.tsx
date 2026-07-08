'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ImportResult, CRMRecord, SkippedRecord } from '@/lib/types';
import {
  IconCheckCircle, IconAlertTriangle, IconDownload,
  IconPlus, IconBarChart, IconZap, IconCheck,
} from '@/components/ui/Icons';

interface ResultsStepProps {
  result: ImportResult;
  onReset: () => void;
}

const CRM_FIELDS: { key: keyof CRMRecord; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'country_code', label: 'Code' },
  { key: 'mobile_without_country_code', label: 'Mobile' },
  { key: 'company', label: 'Company' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'crm_status', label: 'Status' },
  { key: 'lead_owner', label: 'Owner' },
  { key: 'crm_note', label: 'Notes' },
  { key: 'data_source', label: 'Source' },
  { key: 'created_at', label: 'Created' },
  { key: 'possession_time', label: 'Possession' },
  { key: 'description', label: 'Description' },
];

/* ─── Animated counter ─── */
function useCounter(target: number, ms = 900): number {
  const [val, setVal] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / ms, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return val;
}

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    GOOD_LEAD_FOLLOW_UP: { cls: 'good-lead', label: 'Good Lead' },
    DID_NOT_CONNECT: { cls: 'did-not-connect', label: 'No Connect' },
    BAD_LEAD: { cls: 'bad-lead', label: 'Bad Lead' },
    SALE_DONE: { cls: 'sale-done', label: 'Sale Done' },
  };
  const m = map[status];
  if (!m) return <span style={{ color: 'var(--text-faint)' }}>—</span>;
  return (
    <span className={`status-badge ${m.cls}`}>
      <span className="status-dot" />
      {m.label}
    </span>
  );
}

export default function ResultsStep({ result, onReset }: ResultsStepProps) {
  const [tab, setTab] = useState<'imported' | 'skipped'>('imported');

  const total = useCounter(result.stats.total);
  const imported = useCounter(result.stats.imported);
  const skipped = useCounter(result.stats.skipped);
  const batches = useCounter(result.stats.batches);

  const displayRecords = useMemo(() => result.records.slice(0, 200), [result.records]);
  const displaySkipped = useMemo(() => result.skipped.slice(0, 100), [result.skipped]);

  const downloadCSV = () => {
    const headers = CRM_FIELDS.map((f) => f.key);
    const rows = [
      headers.join(','),
      ...result.records.map((r) =>
        headers.map((k) => {
          const v = String(r[k as keyof CRMRecord] || '').replace(/"/g, '""');
          return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
        }).join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groweasy_import_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in">
      {/* Result header */}
      <div className="result-header">
        <div className="result-icon">
          <IconCheckCircle />
        </div>
        <div className="result-text">
          <h2>Import complete</h2>
          <p>{result.stats.imported} records extracted from {result.stats.total} rows</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">
            <IconBarChart /> Total rows
          </div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">
            <IconCheck /> Imported
          </div>
          <div className="stat-value">{imported}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">
            <IconAlertTriangle /> Skipped
          </div>
          <div className="stat-value">{skipped}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <IconZap /> Batches
          </div>
          <div className="stat-value">{batches}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'imported' ? 'active' : ''}`} onClick={() => setTab('imported')} id="tab-imported">
          <IconCheckCircle />
          Imported
          <span className="tab-count">{result.stats.imported}</span>
        </button>
        <button className={`tab-btn ${tab === 'skipped' ? 'active' : ''}`} onClick={() => setTab('skipped')} id="tab-skipped">
          <IconAlertTriangle />
          Skipped
          <span className="tab-count">{result.stats.skipped}</span>
        </button>
      </div>

      {/* Imported Table */}
      {tab === 'imported' && (
        <div className="table-container">
          {result.records.length === 0 ? (
            <div className="empty-state">
              <IconBarChart />
              <p>No records imported</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table" id="results-table">
                <thead>
                  <tr>
                    <th className="row-num">#</th>
                    {CRM_FIELDS.map((f) => <th key={f.key}>{f.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {displayRecords.map((rec, i) => (
                    <tr key={i}>
                      <td className="row-num">{i + 1}</td>
                      {CRM_FIELDS.map((f) => (
                        <td key={f.key} title={String(rec[f.key] || '')}>
                          {f.key === 'crm_status' ? (
                            <StatusBadge status={String(rec.crm_status || '')} />
                          ) : (
                            String(rec[f.key] || '') || <span style={{ color: 'var(--text-faint)' }}>—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.records.length > 200 && (
            <div className="table-footer">
              Showing 200 of {result.records.length} — download CSV for full data
            </div>
          )}
        </div>
      )}

      {/* Skipped Table */}
      {tab === 'skipped' && (
        <div className="table-container">
          {result.skipped.length === 0 ? (
            <div className="empty-state">
              <IconCheckCircle />
              <p>All records imported successfully</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table" id="skipped-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Reason</th>
                    <th>Raw data</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySkipped.map((item: SkippedRecord, i: number) => (
                    <tr key={i}>
                      <td className="row-num">{item.row}</td>
                      <td style={{ color: 'var(--amber-text)' }}>{item.reason}</td>
                      <td style={{ maxWidth: 360 }}>
                        <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(item.raw, null, 0).slice(0, 180)}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="btn-group">
        <button className="btn btn-secondary" onClick={onReset} id="import-another-btn">
          <IconPlus /> New import
        </button>
        {result.records.length > 0 && (
          <button className="btn btn-primary" onClick={downloadCSV} id="download-csv-btn">
            <IconDownload /> Download CSV
          </button>
        )}
      </div>
    </div>
  );
}
