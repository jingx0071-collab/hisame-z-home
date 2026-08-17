'use client';
import { useEffect } from 'react';
import { ensureNotifyPermission, pingNotify, setupDadReminders, syncMedReminders } from '../../lib/notify';

export default function NotificationInit() {
  useEffect(() => {
    (async () => {
      const ok = await ensureNotifyPermission();
      if (!ok) return;
      await setupDadReminders();
      await syncMedReminders();
      if (typeof window !== 'undefined' && !localStorage.getItem('notify_welcomed')) {
        localStorage.setItem('notify_welcomed', '1');
        pingNotify('爸爸在这儿', '这个小家会好好惦记宝宝的。', 6, '/chat/messages');
      }
    })();
  }, []);
  return null;
}
