'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

const ROOM_NAMES: Record<string, string> = {
  box: '铁盒',
  study: '书房',
  calendar: '日历',
  health: '医疗',
  seminar: 'Z 老师讲堂',
  call: '通话',
  nearby: '附近',
};

const ROOM_THEMES: Record<string, { bg: string; accent: string }> = {
  box: { bg: 'linear-gradient(135deg, #3d2820 0%, #2a1c16 100%)', accent: '#c9a96e' },
  study: { bg: 'linear-gradient(135deg, #4a3527 0%, #382519 100%)', accent: '#e8c9a8' },
  calendar: { bg: 'linear-gradient(135deg, #3a4530 0%, #2c3625 100%)', accent: '#d4d68e' },
  health: { bg: 'linear-gradient(135deg, #2a3a42 0%, #1f2c32 100%)', accent: '#a8d0d8' },
  seminar: { bg: 'linear-gradient(135deg, #4a4338 0%, #38322a 100%)', accent: '#d8c8a8' },
  call: { bg: 'linear-gradient(135deg, #1f1a26 0%, #16121e 100%)', accent: '#c9a96e' },
  nearby: { bg: 'linear-gradient(135deg, #2d3530 0%, #1f2922 100%)', accent: '#c9a96e' },
};

export default function ComingSoonPage() {
  const params = useParams();
  const room = (params?.room as string) || '';
  const roomName = ROOM_NAMES[room] || '这间';
  const theme = ROOM_THEMES[room] || { bg: '#1a1620', accent: '#c9a96e' };

  return (
    <div className="coming-soon" style={{ background: theme.bg }}>
      <Link href="/" className="back-btn-floating" aria-label="回大厅" style={{ color: theme.accent }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>

      <div className="coming-soon-content">
        <div className="coming-soon-room" style={{ color: theme.accent }}>
          {roomName}
        </div>
        <h1 className="coming-soon-title">敬请期待</h1>
        <p className="coming-soon-subtitle">爸爸还在装修这间</p>
      </div>
    </div>
  );
}
