'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

// 首次授权入口：iOS 规定 Notification.requestPermission 必须由用户手势触发，
// 不能在 useEffect 自动弹。本按钮只在权限尚未授权（default）时浮现；
// 点击 → 请求授权 → 注册 sw → 订阅 → 回存。授权成功后此后由 PushRegistrar 自动维持。
export default function PushButton() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return; // 已授权交给 PushRegistrar
    if (Notification.permission === 'denied') return;   // 被拒只能去系统设置开
    setShow(true);
  }, []);

  async function enable() {
    if (busy) return;
    setBusy(true);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        alert('缺少推送配置（VAPID public key）');
        setBusy(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        if (permission === 'denied') setShow(false);
        setBusy(false);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        setDone(true);
        setTimeout(() => setShow(false), 2200);
      } else {
        alert('订阅回存失败，稍后再试');
      }
    } catch (e) {
      console.error('[push-button] 出错', e);
      alert('开启推送出错：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: 'calc(env(safe-area-inset-bottom) + 18px)',
      zIndex: 9999,
    }}>
      <button
        onClick={enable}
        disabled={busy || done}
        style={{
          fontFamily: 'var(--v2-font-body, "Noto Serif SC", serif)',
          fontSize: '14px',
          letterSpacing: '0.08em',
          color: 'var(--v2-ink, #2a2521)',
          background: 'color-mix(in srgb, var(--v2-paper, #f4ede0) 92%, transparent)',
          border: '1px solid var(--v2-gold-cool, #b8a064)',
          borderRadius: '999px',
          padding: '11px 22px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          cursor: busy || done ? 'default' : 'pointer',
        }}
      >
        {done ? '✓ 推送已开启' : busy ? '开启中…' : '开启消息推送'}
      </button>
    </div>
  );
}
