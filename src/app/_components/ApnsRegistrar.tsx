'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

// 原生 iOS 专用：进 App 后向 APNs 注册，拿到 device token 回存后端。
// Web / Safari PWA 不跑（没有原生插件）。首次会弹系统授权框。
export default function ApnsRegistrar() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    async function setup() {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') {
          console.log('[apns] 权限未授权：', perm.receive);
          return;
        }

        await PushNotifications.addListener('registration', async (token) => {
          console.log('[apns] device token 到手');
          try {
            const res = await fetch('/api/push/apns-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deviceToken: token.value,
                environment: 'sandbox',
                platform: 'ios',
              }),
            });
            console.log(res.ok ? '[apns] token 已回存后端' : '[apns] 回存失败');
          } catch (e) {
            console.error('[apns] 回存出错：', e);
          }
        });

        await PushNotifications.addListener('registrationError', (err) => {
          console.error('[apns] 注册出错：', err);
        });

        await PushNotifications.register();
      } catch (e) {
        console.error('[apns] setup 出错：', e);
      }
    }

    setup();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  return null;
}
