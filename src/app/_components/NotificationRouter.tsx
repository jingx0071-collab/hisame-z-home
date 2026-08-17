'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// 点通知 → 进对应房间。
// APNs 推送：url 放在 payload 顶层（sendApns 的 data），到手是 notification.data.url
// 本地通知：url 放在 schedule 的 extra 里，到手是 notification.extra.url
// 没带 url 的老通知 → 回大厅，不做任何跳转。

function pickUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const bag = raw as Record<string, unknown>;
  const v = bag.url ?? bag.route ?? bag.path;
  if (typeof v !== 'string') return null;
  // 只认站内绝对路径，挡掉外部 scheme
  if (!v.startsWith('/') || v.startsWith('//')) return null;
  return v;
}

export default function NotificationRouter() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handles: { remove: () => void }[] = [];
    let dead = false;

    const go = (url: string | null) => {
      if (!url || dead) return;
      // 冷启动时 webview 刚起来，让首帧先渲染再切路由
      setTimeout(() => { if (!dead) router.push(url); }, 60);
    };

    (async () => {
      try {
        const h = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => { go(pickUrl(action?.notification?.data)); },
        );
        handles.push(h);
      } catch { /* 非 iOS 或插件缺失 */ }

      try {
        const h = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (action) => { go(pickUrl(action?.notification?.extra)); },
        );
        handles.push(h);
      } catch { /* 忽略 */ }
    })();

    return () => {
      dead = true;
      for (const h of handles) { try { h.remove(); } catch { /* 忽略 */ } }
    };
  }, [router]);

  return null;
}
