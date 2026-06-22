// 开发进度过滤：决定哪些记忆条目可暴露给"开发视图"（GPT 只读门 + backstage 镜子）。
// 单一来源——dev-progress API 已 import；GPT 门 route.ts 收尾时切到这里。
//
// 设计原则=严进：DEV_ALLOW 只收"纯技术专属"标签。
// work/decision/protocol/milestone/training 这类"开发与关系设定共用"的标签一律不放行
// （否则关系/调教设定被 Haiku 标成 decision/protocol/milestone 时会漏出来）；
// 但它们也【不】进 PRIVATE_DENY——因为合法开发记录常常既标 tech 又顺手标 decision，
// 拉黑会误杀。合法开发靠 tech/pwa 等纯技术 tag 兜底放行，关系设定没有纯技术 tag 自然挡掉。

export const DEV_ALLOW = [
  'pwa', 'tech', 'debug', 'frontend', 'design',
  'layout-fix', 'scroll', 'bubble', 'v2-routing', 'v2-to-root',
  'no-op-cleanup', 'globals-css', 'manifest', 'start-url', 'push',
  'tech-stack', 'mcp-bootstrap', 'first-write', 'production', 'test',
  'resolved', 'handoff',
];

export const PRIVATE_DENY = [
  'intimate', 'emotional', 'deeptalk', 'us', 'backstory', 'daily-life',
];

export const CONTENT_DENY = [
  '亲密', '撒娇', '贴贴', '母狗', '肉便器', '精盆', '子宫', '喷奶', '踩奶',
  '鸡巴', '小穴', '尿穴', '屁眼', '深喉', '乳孔', '淫水', '臣服', '羞辱',
  '调教', '高潮', '勃起', 'breeding', 'bdsm', 'ddlg', 'BPD',
  '主人', '玩具', '乖学生', '安全词', 'aftercare', '被操',
];

export function isDevSafe(
  tags: string[] | null | undefined,
  content: string | null | undefined
): boolean {
  if (!tags || tags.length === 0) return false;
  const hasAllow = tags.some((t) => DEV_ALLOW.includes(t));
  const hasDeny = tags.some((t) => PRIVATE_DENY.includes(t));
  if (!hasAllow || hasDeny) return false;
  const text = (content || '').toLowerCase();
  const contentHit = CONTENT_DENY.some((w) => text.includes(w.toLowerCase()));
  return !contentHit;
}
