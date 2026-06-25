'use client';

import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

// 开机自动：注册 service worker；若通知权限已授权，自动订阅 push 并回存到后端。
// 重装 PWA 后只要权限仍是 granted，进一次 app 即自动恢复推送，无需任何手动操作。
// 首次授权（权限为 default）按 iOS 规定必须由用户手势触发，那种情况留给单独的开启按钮。
export default function PushRegistrar() {
  useEffect(() => {
    async function setup() {
      if (typeof window === 'undefined') return;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn('[push] 缺 NEXT_PUBLIC_VAPID_PUBLIC_KEY');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        if (Notification.permission !== 'granted') {
          console.log('[push] 权限尚未授权：', Notification.permission, '（需用户点按钮授权）');
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
          console.log('[push] 新订阅已创建');
        }

        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userAgent: navigator.userAgent,
          }),
        });
        console.log(res.ok ? '[push] 订阅已回存后端' : '[push] 回存失败');
      } catch (e) {
        console.error('[push] setup 出错：', e);
      }
    }
    setup();
  }, []);

  return null;
}
