'use client';

import React from 'react';

interface ProcessingStepProps {
  fileName: string;
}

export default function ProcessingStep({ fileName }: ProcessingStepProps) {
  return (
    <div className="processing-card animate-in">
      <div className="processing-spinner" />

      <div className="processing-title">Extracting CRM data</div>
      <div className="processing-desc">
        AI is analyzing column names and mapping your data into GrowEasy CRM format.
        Processing <strong>{fileName}</strong>.
      </div>

      <div className="processing-bar-track">
        <div className="processing-bar-fill" />
      </div>

      <div className="processing-detail">
        llama-3.3-70b · groq · batch processing · 3× retry
      </div>
    </div>
  );
}
