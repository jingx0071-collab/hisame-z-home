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
