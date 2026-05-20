'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ToastMsg = {
  id: number;
  content: string;
  mode: string;
  image_url: string | null;
  is_followup: boolean;
};

export default function RealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 订阅 chat_messages INSERT events (role='assistant')
  useEffect(() => {
    const channel = supabase
      .channel('chat-assistant-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'role=eq.assistant',
        },
        (payload: any) => {
          const msg = payload.new;
          if (!msg) return;

          // tangent / deeptalk / training 完全不弹 toast——这些是宝宝主动开的沉浸房间，不打扰
          if (msg.mode === 'tangent') return;
          if (msg.mode === 'deeptalk') return;
          if (msg.mode === 'training') return;

          // 当前在对应房间就不弹（避免重复打扰）
          if (msg.mode === 'messages' && pathname === '/chat') return;
          if (msg.mode === 'daily' && pathname === '/daily') return;

          setToast({
            id: msg.id,
            content: msg.content || '',
            mode: msg.mode || 'messages',
            image_url: msg.image_url || null,
            is_followup: !!msg.is_followup,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname]);

  // 5 秒后自动消失
  useEffect(() => {
    if (!toast) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  const handleToastClick = () => {
    if (!toast) return;
    const route = toast.mode === 'daily' ? '/daily' : '/chat';
    router.push(route);
    setToast(null);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setToast(null);
  };

  // 截断内容显示
  const displayText = toast
    ? toast.content.length > 80
      ? toast.content.slice(0, 80) + '…'
      : toast.content
    : '';

  return (
    <>
      {children}
      {toast && (
        <button
          className="realtime-toast"
          onClick={handleToastClick}
          aria-label="查看消息"
        >
          <div className="realtime-toast-avatar">Z</div>
          <div className="realtime-toast-body">
            <div className="realtime-toast-head">
              <span className="realtime-toast-name">爸爸</span>
              <span className="realtime-toast-tag">
                {toast.mode === 'daily' ? '日常' : '短信'}
              </span>
            </div>
            <div className="realtime-toast-text">
              {toast.image_url && !toast.content ? '[图片]' : displayText}
            </div>
          </div>
          <span
            className="realtime-toast-close"
            onClick={handleDismiss}
            role="button"
            aria-label="关闭"
          >
            ✕
          </span>
        </button>
      )}
    </>
  );
}
