import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// 只在真机触发；web / 模拟器静默跳过，绝不报错
const native = () => Capacitor.isNativePlatform();

async function safe(fn: () => Promise<void>) {
  if (!native()) return;
  try { await fn(); } catch { /* 忽略：震动失败不该影响任何交互 */ }
}

export const haptic = {
  // 轻点：按钮、链接、切房间、返回
  tap:    () => safe(() => Haptics.impact({ style: ImpactStyle.Light })),
  // 中：确认、提交、翻页
  press:  () => safe(() => Haptics.impact({ style: ImpactStyle.Medium })),
  // 重：删除、长按触发
  heavy:  () => safe(() => Haptics.impact({ style: ImpactStyle.Heavy })),
  // 成功：打卡、保存成功
  success:() => safe(() => Haptics.notification({ type: NotificationType.Success })),
  // 警告
  warn:   () => safe(() => Haptics.notification({ type: NotificationType.Warning })),
  // 错误
  error:  () => safe(() => Haptics.notification({ type: NotificationType.Error })),
  // 选择器连续滑动的细腻反馈
  selectStart:  () => safe(() => Haptics.selectionStart()),
  selectChange: () => safe(() => Haptics.selectionChanged()),
  selectEnd:    () => safe(() => Haptics.selectionEnd()),
};
