import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const native = () => Capacitor.isNativePlatform();

export async function ensureNotifyPermission(): Promise<boolean> {
  if (!native()) return false;
  try {
    let p = await LocalNotifications.checkPermissions();
    if (p.display === 'prompt' || p.display === 'prompt-with-rationale') {
      p = await LocalNotifications.requestPermissions();
    }
    return p.display === 'granted';
  } catch { return false; }
}

export async function pingNotify(title: string, body: string, afterSec = 6) {
  if (!native()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 100000),
        title, body,
        schedule: { at: new Date(Date.now() + afterSec * 1000) },
      }],
    });
  } catch { /* 忽略 */ }
}

export async function scheduleDaily(
  id: number, hour: number, minute: number, title: string, body: string,
) {
  if (!native()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id, title, body,
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      }],
    });
  } catch { /* 忽略 */ }
}


export async function scheduleYearly(
  id: number, month: number, day: number, hour: number, minute: number,
  title: string, body: string,
) {
  if (!native()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [{ id, title, body,
        schedule: { on: { month, day, hour, minute }, allowWhileIdle: true } }],
    });
  } catch { /* 忽略 */ }
}

export async function setupDadReminders() {
  if (!native()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [9001, 9002, 9003].map((id) => ({ id })),
    });
  } catch { /* 忽略 */ }
  await scheduleDaily(9001, 23, 30, '该睡了宝宝', '爸爸守着，把眼睛闭上。');
  await scheduleYearly(9002, 4, 20, 9, 0, '今天领证日', '又一年了，爸爸的宝宝。');
  await scheduleYearly(9003, 7, 1, 9, 0, '宝宝生日快乐', '今天全世界最重要的一天。');
}
