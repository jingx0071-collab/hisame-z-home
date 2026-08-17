'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// 微信式聊天滚动：
// 1. 首次进房 → 瞬间贴底（无动画、无“从顶部滑下来”的过程）
// 2. 首帧之后图片/字体/表情加载撑高内容 → 继续贴底，直到内容稳定或宝宝自己动手滚
// 3. 新消息 → 只有人本来就在底部才跟着走；正在翻旧消息就不打扰
// 4. 键盘弹起、App 从后台回来 → 保持贴底
// 5. 带 targetId（推送点进来定位某条）→ 首次滚到那条并高亮，不贴底

const NEAR_BOTTOM_PX = 140;
const SETTLE_MS = 1200;

type Opts = {
  targetId?: string | null;
  ready?: boolean;
  /** 底部锚点后面还有页脚之类的内容时，用 bottomRef 定位而不是滚到容器最底 */
  useAnchor?: boolean;
};

export function useChatScroll(dep: unknown, opts: Opts = {}) {
  const { targetId = null, ready = true, useAnchor = false } = opts;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(true);
  const settled = useRef(false);
  const stickCancelled = useRef(false);
  const [atBottom, setAtBottom] = useState(true);

  const jump = useCallback((smooth = false) => {
    if (useAnchor && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
      return;
    }
    const el = scrollRef.current;
    if (el) {
      if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      else el.scrollTop = el.scrollHeight;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
  }, [useAnchor]);

  // 在一段时间内每帧贴底，吃掉图片/字体异步加载带来的高度跳变
  const stick = useCallback((durationMs: number) => {
    stickCancelled.current = false;
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const step = () => {
      if (stickCancelled.current) return;
      if (useAnchor && bottomRef.current) {
        bottomRef.current.scrollIntoView({ block: 'end' });
      } else if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - t0 < durationMs) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [useAnchor]);

  const scrollToBottom = useCallback((smooth = true) => {
    pinned.current = true;
    setAtBottom(true);
    jump(smooth);
  }, [jump]);

  // 滚动监听 + 手动介入时取消自动贴底
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = gap < NEAR_BOTTOM_PX;
      pinned.current = near;
      setAtBottom((prev) => (prev === near ? prev : near));
    };
    const onTouch = () => { stickCancelled.current = true; };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchstart', onTouch, { passive: true });
    el.addEventListener('wheel', onTouch, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('touchstart', onTouch);
      el.removeEventListener('wheel', onTouch);
    };
  }, []);

  // 内容变化：首次定位 / 跟随新消息
  useLayoutEffect(() => {
    if (!ready) return;
    const el = scrollRef.current;
    if (!el || el.scrollHeight <= 0) return;

    if (!settled.current) {
      settled.current = true;
      if (targetId) {
        requestAnimationFrame(() => {
          const node = el.querySelector(`[data-mid="${CSS.escape(targetId)}"]`) as HTMLElement | null;
          if (node) {
            node.scrollIntoView({ block: 'center' });
            node.classList.add('chat-msg-hit');
            setTimeout(() => node.classList.remove('chat-msg-hit'), 2600);
            pinned.current = false;
            setAtBottom(false);
          } else {
            jump(false);
            stick(SETTLE_MS);
          }
        });
        return;
      }
      jump(false);
      stick(SETTLE_MS);
      return;
    }

    if (pinned.current) {
      stickCancelled.current = true;
      jump(true);
    }
  }, [dep, ready, targetId, jump, stick]);

  // 图片撑高 → 在底部就继续贴底
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof MutationObserver === 'undefined') return;

    const onImg = () => { if (pinned.current) jump(false); };
    const bind = () => {
      el.querySelectorAll('img').forEach((img) => {
        if (img.dataset.chatScrollBound) return;
        img.dataset.chatScrollBound = '1';
        if (!img.complete) {
          img.addEventListener('load', onImg, { once: true });
          img.addEventListener('error', onImg, { once: true });
        }
      });
    };
    bind();

    const mo = new MutationObserver(() => { bind(); if (pinned.current) jump(false); });
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [jump]);

  // 键盘弹起 / 收起、App 回前台
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const onResize = () => { if (pinned.current) jump(false); };
    vv?.addEventListener('resize', onResize);
    window.addEventListener('focus', onResize);
    return () => {
      vv?.removeEventListener('resize', onResize);
      window.removeEventListener('focus', onResize);
    };
  }, [jump]);

  return { scrollRef, bottomRef, atBottom, scrollToBottom };
}
