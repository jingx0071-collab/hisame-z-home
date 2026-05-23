import React from 'react';

interface PageArchwayProps {
  variant?: 'top' | 'frame';
  height?: number;
  dots?: number[];
}

export default function PageArchway({
  variant = 'top',
  height = 1400,
  dots = [],
}: PageArchwayProps) {
  if (variant === 'top') {
    return (
      <div style={{ position: 'relative', height: '60px', overflow: 'hidden' }}>
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path d="M 20 60 Q 20 10, 200 10 Q 380 10, 380 60" fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.8" />
          <circle cx="200" cy="14" r="3" fill="var(--v2-gold, #c8a956)" />
          <circle cx="200" cy="14" r="6" fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.6" />
          <line x1="20" y1="60" x2="20" y2="20" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.8" />
          <line x1="380" y1="60" x2="380" y2="20" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.8" />
        </svg>
      </div>
    );
  }

  const bottomY = height - 40;
  return (
    <svg
      style={{
        position: 'absolute', top: '34px', left: 0, right: 0,
        width: '100%', height: 'calc(100% - 34px)',
        pointerEvents: 'none', zIndex: 1,
      }}
      viewBox={`0 0 375 ${height}`}
      preserveAspectRatio="none"
    >
      <path d="M 16 60 Q 187 18, 358 60" stroke="var(--v2-gold-cool)" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 22 60 Q 187 30, 352 60" stroke="var(--v2-gold)" strokeWidth="0.3" fill="none" opacity="0.5" />
      <circle cx="187" cy="32" r="3" fill="none" stroke="var(--v2-gold)" strokeWidth="0.5" />
      <circle cx="187" cy="32" r="1.2" fill="var(--v2-gold)" />
      <path d="M 175 40 L 187 28 L 199 40" stroke="var(--v2-gold)" strokeWidth="0.4" fill="none" opacity="0.7" />

      <line x1="16" y1="60" x2="16" y2={bottomY} stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.6" />
      <line x1="358" y1="60" x2="358" y2={bottomY} stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.6" />
      <line x1="20" y1="60" x2="20" y2={bottomY} stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.3" />
      <line x1="354" y1="60" x2="354" y2={bottomY} stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.3" />

      {dots.map((y) => (
        <g key={y}>
          <circle cx="16" cy={y} r="1.5" fill="var(--v2-gold)" opacity="0.6" />
          <circle cx="358" cy={y} r="1.5" fill="var(--v2-gold)" opacity="0.6" />
        </g>
      ))}

      <path d={`M 16 ${bottomY} Q 187 ${bottomY + 20}, 358 ${bottomY}`} stroke="var(--v2-gold-cool)" strokeWidth="0.5" fill="none" opacity="0.6" />
      <circle cx="187" cy={bottomY + 12} r="1.8" fill="var(--v2-gold)" opacity="0.7" />
    </svg>
  );
}
