'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import { IconArrowLeft, IconSparkles, IconTable } from '@/components/ui/Icons';

interface PreviewStepProps {
  file: File;
  onConfirm: () => void;
  onBack: () => void;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export default function PreviewStep({ file, onConfirm, onBack }: PreviewStepProps) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setParseError(null);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length < 2) {
          setParseError('CSV must contain a header row and at least one data row.');
          setLoading(false);
          return;
        }
        setParsedData({ headers: data[0], rows: data.slice(1), totalRows: data.length - 1 });
        setLoading(false);
      },
      error: (err) => {
        setParseError(`Parse error: ${err.message}`);
        setLoading(false);
      },
    });
  }, [file]);

  const displayRows = useMemo(() => parsedData?.rows.slice(0, 200) ?? [], [parsedData]);

  if (loading) {
    return (
      <div className="processing-card">
        <div className="processing-spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Parsing CSV...</p>
      </div>
    );
  }

  if (parseError) {
    return (
      <div className="animate-in">
        <div className="error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{parseError}</span>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={onBack}>
            <IconArrowLeft /> Back
          </button>
        </div>
      </div>
    );
  }

  if (!parsedData) return null;

  return (
    <div className="animate-in">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconTable style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
          <span className="section-title">Data Preview</span>
        </div>
        <div className="section-meta">
          <span className="meta-tag"><strong>{parsedData.totalRows.toLocaleString()}</strong>&nbsp;rows</span>
          <span className="meta-tag"><strong>{parsedData.headers.length}</strong>&nbsp;columns</span>
        </div>
      </div>

      <div className="table-container">
        <div className="table-scroll">
          <table className="data-table" id="preview-table">
            <thead>
              <tr>
                <th className="row-num">#</th>
                {parsedData.headers.map((h, i) => (
                  <th key={i}>{h || `Column ${i + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, ri) => (
                <tr key={ri}>
                  <td className="row-num">{ri + 1}</td>
                  {parsedData.headers.map((_, ci) => (
                    <td key={ci} title={row[ci] || ''}>
                      {row[ci] || <span style={{ color: 'var(--text-faint)' }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {parsedData.totalRows > 200 && (
          <div className="table-footer">
            Showing 200 of {parsedData.totalRows.toLocaleString()} rows — all rows will be processed
          </div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={onBack} id="back-btn">
          <IconArrowLeft /> Back
        </button>
        <button className="btn btn-primary" onClick={onConfirm} id="confirm-import-btn">
          <IconSparkles /> Extract with AI
        </button>
      </div>
    </div>
  );
}
