'use client';

// Vanilla Purple / 香草天使 — room shell primitives.
// A shared wrapper + small kit of components that any deep-page room can
// adopt to feel like a native app screen rather than a webpage. Provides:
//   • VpRoomShell — consistent content area under AppHeader, safe-area padded,
//     with an optional segmented control at the top and an optional FAB.
//   • VpSegmentedControl — iOS-style pill segmented control with a sliding
//     active indicator.
//   • VpFab — floating action button, fixed bottom-right, gold-gradient fill.
//   • VpEmptyState — centered icon + title + subtitle + CTA, on-palette.
//   • VpListRow — card-shaped list row with corner ornaments and chevron.
// All are scoped to the vanilla-purple skin via CSS; other skins are untouched.

import type { ReactNode } from 'react';
import { CornerOrnaments } from './ornaments';

// ---------- VpRoomShell ----------

type Segment = { id: string; label: string; sub?: string };

type VpRoomShellProps = {
  children: ReactNode;
  segments?: Segment[];
  activeSegment?: string;
  onSegmentChange?: (id: string) => void;
  fab?: { icon?: ReactNode; label?: string; onClick: () => void };
  className?: string;
};

export function VpRoomShell({
  children,
  segments,
  activeSegment,
  onSegmentChange,
  fab,
  className,
}: VpRoomShellProps) {
  return (
    <div className={`vp-room-shell${className ? ` ${className}` : ''}`}>
      {segments && segments.length > 0 && (
        <VpSegmentedControl
          segments={segments}
          active={activeSegment ?? segments[0].id}
          onChange={onSegmentChange ?? (() => {})}
        />
      )}
      <div className="vp-room-body">{children}</div>
      {fab && (
        <VpFab
          icon={fab.icon}
          label={fab.label}
          onClick={fab.onClick}
        />
      )}
    </div>
  );
}

// ---------- VpSegmentedControl ----------

type VpSegmentedControlProps = {
  segments: Segment[];
  active: string;
  onChange: (id: string) => void;
};

export function VpSegmentedControl({
  segments, active, onChange,
}: VpSegmentedControlProps) {
  const activeIdx = Math.max(0, segments.findIndex((s) => s.id === active));
  const pct = segments.length > 0 ? 100 / segments.length : 0;
  return (
    <div className="vp-seg" role="tablist">
      <div
        className="vp-seg-thumb"
        aria-hidden="true"
        style={{ width: `${pct}%`, transform: `translateX(${activeIdx * 100}%)` }}
      />
      {segments.map((s) => {
        const on = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={on}
            className={`vp-seg-btn${on ? ' is-active' : ''}`}
            onClick={() => onChange(s.id)}
          >
            <span className="vp-seg-en">{s.label}</span>
            {s.sub && <span className="vp-seg-cn">{s.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ---------- VpFab ----------

type VpFabProps = {
  icon?: ReactNode;
  label?: string;
  onClick: () => void;
};

export function VpFab({ icon, label = 'Add', onClick }: VpFabProps) {
  return (
    <button
      type="button"
      className="vp-fab"
      aria-label={label}
      onClick={onClick}
    >
      {icon ?? (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M 12 5 L 12 19 M 5 12 L 19 12" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}

// ---------- VpEmptyState ----------

type VpEmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
};

export function VpEmptyState({
  icon, title, subtitle, action,
}: VpEmptyStateProps) {
  return (
    <div className="vp-empty">
      {icon && <div className="vp-empty-icon">{icon}</div>}
      <div className="vp-empty-title v2-display">{title}</div>
      {subtitle && <div className="vp-empty-sub v2-serif">{subtitle}</div>}
      {action && <div className="vp-empty-action">{action}</div>}
    </div>
  );
}

// ---------- VpListRow ----------

type VpListRowProps = {
  index?: string | number;
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
};

// A card-shaped list row with 4-corner ornaments and a right-side chevron.
// Renders as a button by default; if href is set, callers wrap it in a Link.
export function VpListRow({
  index, icon, title, subtitle, meta, onClick, ariaLabel,
}: VpListRowProps) {
  return (
    <button
      type="button"
      className="vp-list-row"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <CornerOrnaments size={10} inset={5} color="var(--v2-gold)"/>
      {index !== undefined && (
        <span className="vp-list-row-index">{index}</span>
      )}
      {icon && <span className="vp-list-row-icon">{icon}</span>}
      <span className="vp-list-row-body">
        <span className="v2-display vp-list-row-title">{title}</span>
        {subtitle && <span className="vp-list-row-sub">{subtitle}</span>}
      </span>
      {meta && <span className="vp-list-row-meta">{meta}</span>}
      <span className="vp-list-row-chev" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M 5 3 L 9 7 L 5 11" stroke="currentColor" strokeWidth="1"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </button>
  );
}
