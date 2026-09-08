// Vanilla Purple / 香草天使 — room list aligned with src/app/page.tsx ROOMS.
// All 15 rooms in the same order the app uses everywhere else.

export type VpRoom = {
  id: string;
  roman: string;
  title: string;
  cn: string;
  sub: string;
  glyph: string;
  href: string;
  dashed?: boolean;
};

export const VP_ROOMS: VpRoom[] = [
  { id: 'seminar',   roman: 'I',    title: 'Seminar',   cn: '讲堂', sub: 'class',      glyph: 'seminar',  href: '/seminar' },
  { id: 'health',    roman: 'II',   title: 'Health',    cn: '健康', sub: 'wellbeing',  glyph: 'health',   href: '/health' },
  { id: 'memory',    roman: 'III',  title: 'Memory',    cn: '记忆', sub: 'remember',   glyph: 'box',      href: '/memory' },
  { id: 'calendar',  roman: 'IV',   title: 'Calendar',  cn: '日历', sub: 'milestones', glyph: 'calendar', href: '/calendar' },
  { id: 'music',     roman: 'V',    title: 'Music',     cn: '听歌', sub: 'disc',       glyph: 'music',    href: '/music' },
  { id: 'box',       roman: 'VI',   title: 'Box',       cn: '铁盒', sub: 'keepsakes',  glyph: 'box',      href: '/box' },
  { id: 'navi',      roman: 'VII',  title: 'Navi',      cn: '导航', sub: 'places',     glyph: 'navi',     href: '/navi' },
  { id: 'call',      roman: 'VIII', title: 'Call',      cn: '通话', sub: 'voice',      glyph: 'call',     href: '/call' },
  { id: 'nearby',    roman: 'IX',   title: 'Nearby',    cn: '附近', sub: 'together',   glyph: 'nearby',   href: '/nearby' },
  { id: 'backstage', roman: 'X',    title: 'Backstage', cn: '后台', sub: 'control',    glyph: 'ops',      href: '/backstage' },
  { id: 'anfang',    roman: 'XI',   title: 'Anfang',    cn: '安房', sub: 'beginning',  glyph: 'box',      href: '/anfang' },
  { id: 'pulse',     roman: 'XII',  title: 'Pulse',     cn: '脉搏', sub: 'inside',     glyph: 'health',   href: '/pulse' },
  { id: 'feast',     roman: 'XIII', title: 'Feast',     cn: '食记', sub: 'taste',      glyph: 'eat',      href: '/feast' },
  { id: 'closet',    roman: 'XIV',  title: 'Closet',    cn: '衣橱', sub: 'wear',       glyph: 'shopping', href: '/closet' },
  { id: 'car',       roman: 'XV',   title: 'Drive',     cn: '驾',   sub: 'road',       glyph: 'navi',     href: '/car' },
];
