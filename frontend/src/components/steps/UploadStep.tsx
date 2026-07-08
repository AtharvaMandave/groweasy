'use client';

import React, { useCallback, useRef, useState } from 'react';
import { IconUpload, IconFile, IconX } from '@/components/ui/Icons';

interface UploadStepProps {
  onFileSelected: (file: File) => void;
}

export default function UploadStep({ onFileSelected }: UploadStepProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file type. Please upload a .csv file.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit.');
      return false;
    }
    if (file.size === 0) {
      setError('File is empty.');
      return false;
    }
    return true;
  }, []);

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  }, [validateFile, onFileSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
  }, [handleFile]);

  const removeFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="animate-in">
      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        id="upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          id="csv-file-input"
        />

        <IconUpload className="upload-icon" />

        <div className="upload-title">
          {dragOver ? 'Drop file to upload' : 'Drop your CSV file here, or browse'}
        </div>
        <div className="upload-subtitle">
          Supports any CSV format — <span className="upload-browse">click to browse</span>
        </div>

        <div className="upload-meta">
          <span className="upload-meta-item">CSV only</span>
          <span className="upload-meta-item">·</span>
          <span className="upload-meta-item">Max 10MB</span>
        </div>

        {selectedFile && (
          <div className="upload-file-card" onClick={(e) => e.stopPropagation()}>
            <div className="upload-file-icon">
              <IconFile />
            </div>
            <div className="upload-file-info">
              <div className="upload-file-name">{selectedFile.name}</div>
              <div className="upload-file-size">{formatSize(selectedFile.size)}</div>
            </div>
            <button className="upload-remove-btn" onClick={removeFile} id="remove-file-btn">
              <IconX />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner" style={{ marginTop: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
