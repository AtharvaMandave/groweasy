'use client';

import React, { useState, useCallback, useEffect } from 'react';
import UploadStep from '@/components/steps/UploadStep';
import PreviewStep from '@/components/steps/PreviewStep';
import ProcessingStep from '@/components/steps/ProcessingStep';
import ResultsStep from '@/components/steps/ResultsStep';
import { importCSV } from '@/lib/api';
import { IconGrowEasy, IconCheck, IconSun, IconMoon } from '@/components/ui/Icons';
import type { AppStep, ImportResult } from '@/lib/types';

const STEPS: { key: AppStep; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'processing', label: 'Processing' },
  { key: 'results', label: 'Results' },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme from localStorage or preferences
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const activeTheme = storedTheme || systemTheme;
    setTheme(activeTheme);
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setCurrentStep('preview');
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile) return;
    setCurrentStep('processing');
    setError(null);
    try {
      const response = await importCSV(selectedFile);
      if (response.success && response.data) {
        setImportResult(response.data);
        setCurrentStep('results');
      } else {
        throw new Error(response.error || 'Import failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setCurrentStep('preview');
    }
  }, [selectedFile]);

  const handleBack = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setImportResult(null);
    setError(null);
  }, []);

  return (
    <div className="app-wrapper">
      {/* Navigation Bar */}
      <nav className="app-nav">
        <div className="nav-left">
          <div className="nav-logo">
            <div className="nav-logo-mark">
              <IconGrowEasy />
            </div>
            <span className="nav-logo-text">GrowEasy</span>
          </div>
          <div className="nav-divider" />
          <span className="nav-page-title">CSV Importer</span>
        </div>
        <div className="nav-right" style={{ gap: '12px' }}>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            id="theme-toggle"
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <div className="nav-badge">
            <span className="nav-badge-dot" />
            Llama 3.3 &middot; Groq
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Import CSV Data</h1>
          <p className="page-description">
            Upload any CSV file — AI will intelligently map your columns to CRM fields, regardless of format or naming convention.
          </p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <div className={`step-connector ${i < stepIndex ? 'completed' : i === stepIndex ? 'active' : ''}`} />
              )}
              <div className={`step ${i === stepIndex ? 'active' : i < stepIndex ? 'completed' : ''}`}>
                <span className="step-number">
                  {i < stepIndex ? <IconCheck style={{ width: 12, height: 12 }} /> : i + 1}
                </span>
                <span>{step.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && currentStep !== 'processing' && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Import failed</strong> — {error}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="card" key={currentStep}>
          <div className="card-body">
            {currentStep === 'upload' && (
              <UploadStep onFileSelected={handleFileSelected} />
            )}
            {currentStep === 'preview' && selectedFile && (
              <PreviewStep file={selectedFile} onConfirm={handleConfirmImport} onBack={handleBack} />
            )}
            {currentStep === 'processing' && selectedFile && (
              <ProcessingStep fileName={selectedFile.name} />
            )}
            {currentStep === 'results' && importResult && (
              <ResultsStep result={importResult} onReset={handleReset} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>GrowEasy CSV Importer</span>
        <div className="footer-tech">
          <span>Next.js</span>
          <span className="footer-sep">·</span>
          <span>Express</span>
          <span className="footer-sep">·</span>
          <span>Llama 3.3</span>
          <span className="footer-sep">·</span>
          <span>Groq</span>
        </div>
      </footer>
    </div>
  );
}
