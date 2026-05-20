'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

type CallState =
  | 'idle'
  | 'connecting'
  | 'z_speaking'
  | 'listening'
  | 'recording'
  | 'processing'
  | 'ended'
  | 'error';

type Turn = {
  role: 'user' | 'assistant';
  content: string;
};

function formatDuration(seconds: number): string {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function CallPage() {
  const [state, setState] = useState<CallState>('idle');
  const [duration, setDuration] = useState(0);
  const [zCurrentText, setZCurrentText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const messagesRef = useRef<Turn[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<CallState>('idle');
  const hangupGuardRef = useRef(false);

  // 同步 state 到 ref（异步回调里要用）
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 检查浏览器支持
  const checkSupport = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      return '宝宝的浏览器不支持语音识别，要用 Safari 或装 PWA 后再试';
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return '宝宝的浏览器不支持麦克风';
    }
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) {
      return '宝宝的浏览器不支持音频播放（AudioContext）';
    }
    return null;
  }, []);

  // 初始化 AudioContext（必须在用户手势内调用）
  const initAudioContext = async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return;
    }
    const AC =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  };

  // 播放音频 ArrayBuffer
  const playAudioBuffer = async (arrayBuffer: ArrayBuffer): Promise<void> => {
    if (!audioContextRef.current) {
      throw new Error('AudioContext 没初始化');
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // decodeAudioData 在 iOS Safari 旧版本可能需要回调式
    const audioBuffer: AudioBuffer = await new Promise((resolve, reject) => {
      try {
        const p = ctx.decodeAudioData(
          arrayBuffer.slice(0),
          (buf) => resolve(buf),
          (err) => reject(err)
        );
        if (p && typeof (p as any).then === 'function') {
          (p as any).then(resolve, reject);
        }
      } catch (e) {
        reject(e);
      }
    });

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    currentSourceRef.current = source;

    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        currentSourceRef.current = null;
        resolve();
      };
      source.onended = done;
      source.start(0);
    });
  };

  const stopCurrentAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current = null;
    }
  };

  // 通话计时器
  useEffect(() => {
    if (
      state === 'connecting' ||
      state === 'z_speaking' ||
      state === 'listening' ||
      state === 'recording' ||
      state === 'processing'
    ) {
      if (!timerRef.current) {
        startTimeRef.current = Date.now() - duration * 1000;
        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // 接通话
  const handleConnect = async () => {
    const err = checkSupport();
    if (err) {
      setErrorMsg(err);
      setState('error');
      return;
    }

    setErrorMsg('');
    setDuration(0);
    messagesRef.current = [];
    hangupGuardRef.current = false;

    // 在用户手势内初始化 AudioContext（iOS 必需）
    try {
      await initAudioContext();
    } catch (e) {
      setErrorMsg('音频初始化失败：' + (e instanceof Error ? e.message : ''));
      setState('error');
      return;
    }

    // 请求麦克风权限
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      setErrorMsg('iPhone 拒绝了麦克风权限，到「设置 → Safari」打开');
      setState('error');
      return;
    }

    setState('connecting');
    await zSpeak();
  };

  // 让爸爸说话
  const zSpeak = async () => {
    try {
      // 调 turn API 拿文字
      const turnRes = await fetch('/api/call/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesRef.current }),
      });
      const turnData = await turnRes.json();
      if ((stateRef.current as string) === 'ended') return;
      if (!turnData.reply) {
        throw new Error(turnData.error || '爸爸没回话');
      }
      const replyText = turnData.reply as string;
      messagesRef.current.push({ role: 'assistant', content: replyText });
      setZCurrentText(replyText);
      setState('z_speaking');

      // 调 TTS API 拿音频
      const ttsRes = await fetch('/api/call/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText }),
      });
      if (!ttsRes.ok) {
        throw new Error('音频生成失败');
      }
      const arrayBuffer = await ttsRes.arrayBuffer();
      if ((stateRef.current as string) === 'ended') return;

      // 用 WebAudio API 播放（绕过静音开关）
      await playAudioBuffer(arrayBuffer);
      if ((stateRef.current as string) === 'ended') return;
      setState('listening');
    } catch (e) {
      console.error('zSpeak error:', e);
      if ((stateRef.current as string) !== 'ended') {
        setErrorMsg(e instanceof Error ? e.message : '出错了');
        setState('error');
      }
    }
  };

  // 按住说话
  const handleStartRecording = () => {
    if (stateRef.current !== 'listening') return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) finalTranscript = final;
      setInterimText(interim || finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('SR error:', event);
      if (event.error === 'not-allowed') {
        setErrorMsg('iPhone 拒绝了麦克风权限');
        setState('error');
      }
    };

    recognition.onend = () => {
      const transcript = finalTranscript.trim();
      setInterimText('');
      if ((stateRef.current as string) === 'ended') return;
      if (transcript) {
        handleUserSpoke(transcript);
      } else {
        setState('listening');
      }
    };

    recognitionRef.current = recognition;
    setState('recording');
    try {
      recognition.start();
    } catch (e) {
      console.error('SR start failed:', e);
      setState('listening');
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current && stateRef.current === 'recording') {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const handleUserSpoke = async (transcript: string) => {
    messagesRef.current.push({ role: 'user', content: transcript });
    setState('processing');
    await zSpeak();
  };

  // 挂断（防重入 + 多事件双绑）
  const handleHangup = useCallback((e?: any) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    if (hangupGuardRef.current) return;
    hangupGuardRef.current = true;
    setTimeout(() => {
      hangupGuardRef.current = false;
    }, 800);

    stopCurrentAudio();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort?.();
      } catch (err) {}
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stateRef.current = 'ended';
    setState('ended');
  }, []);

  const handleRecall = () => {
    setState('idle');
    setDuration(0);
    setZCurrentText('');
    setInterimText('');
    setErrorMsg('');
    messagesRef.current = [];
    hangupGuardRef.current = false;
  };

  const isCallActive =
    state === 'connecting' ||
    state === 'z_speaking' ||
    state === 'listening' ||
    state === 'recording' ||
    state === 'processing';

  return (
    <div className="call">
      <header className="call-header">
        <Link href="/" className="back-btn-floating" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="call-title">
          <h1>通话</h1>
          <p>call</p>
        </div>
        <div className="call-header-right" />
      </header>

      <div className="call-body">
        <div className="call-avatar-wrap">
          <div
            className={[
              'call-avatar',
              state === 'z_speaking' && 'call-avatar-speaking',
              state === 'connecting' && 'call-avatar-connecting',
              state === 'listening' && 'call-avatar-listening',
              state === 'recording' && 'call-avatar-recording',
              state === 'processing' && 'call-avatar-processing',
            ].filter(Boolean).join(' ')}
          >
            <span className="call-avatar-letter">Z</span>
          </div>
          <div className="call-name">爸爸</div>
          <div className="call-status">
            {state === 'idle' && '等宝宝拨号'}
            {state === 'connecting' && '正在接通……'}
            {state === 'z_speaking' && '在说话'}
            {state === 'listening' && '宝宝说话'}
            {state === 'recording' && '在听宝宝说……'}
            {state === 'processing' && '在想怎么回'}
            {state === 'ended' && '通话结束'}
            {state === 'error' && '出错了'}
          </div>
          {isCallActive && (
            <div className="call-duration">{formatDuration(duration)}</div>
          )}
        </div>

        {state === 'z_speaking' && zCurrentText && (
          <div className="call-z-bubble">
            <div className="call-z-text">{zCurrentText}</div>
          </div>
        )}

        {state === 'recording' && interimText && (
          <div className="call-user-interim">{interimText}</div>
        )}

        {state === 'error' && errorMsg && (
          <div className="call-error">{errorMsg}</div>
        )}
      </div>

      <div className="call-controls">
        {state === 'idle' && (
          <button className="call-btn-connect" onClick={handleConnect}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 17v3a1 1 0 0 1-1.1 1 19 19 0 0 1-8.3-2.9 18.4 18.4 0 0 1-5.6-5.6A19 19 0 0 1 3.1 4.1 1 1 0 0 1 4.1 3h3a1 1 0 0 1 1 .9 11 11 0 0 0 .6 2.4 1 1 0 0 1-.3 1L7 8.6a14 14 0 0 0 6.4 6.4l1.3-1.3a1 1 0 0 1 1-.3 11 11 0 0 0 2.4.6 1 1 0 0 1 .9 1V17z"/>
            </svg>
            <span>接通话</span>
          </button>
        )}

        {state === 'listening' && (
          <button
            className="call-btn-talk"
            onMouseDown={handleStartRecording}
            onMouseUp={handleStopRecording}
            onMouseLeave={handleStopRecording}
            onTouchStart={(e) => {
              e.preventDefault();
              handleStartRecording();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleStopRecording();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              handleStopRecording();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z" />
            </svg>
            <span>按住说话</span>
          </button>
        )}

        {state === 'recording' && (
          <button
            className="call-btn-talk call-btn-talk-active"
            onMouseUp={handleStopRecording}
            onMouseLeave={handleStopRecording}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleStopRecording();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              handleStopRecording();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5" />
            </svg>
            <span>松开发送</span>
          </button>
        )}

        {(state === 'z_speaking' || state === 'processing' || state === 'connecting') && (
          <div className="call-btn-talk call-btn-talk-disabled">
            <div className="call-dots">
              <span /><span /><span />
            </div>
            <span>{state === 'z_speaking' ? '爸爸在说……' : '等等……'}</span>
          </div>
        )}

        {(state === 'ended' || state === 'error') && (
          <button className="call-btn-recall" onClick={handleRecall}>
            <span>{state === 'ended' ? '再打一次' : '重试'}</span>
          </button>
        )}

        {/* 挂断 — onClick + onTouchEnd 双绑 + 防重入 */}
        {isCallActive && (
          <button
            className="call-btn-hangup"
            onClick={(e) => handleHangup(e)}
            onTouchEnd={(e) => handleHangup(e)}
            aria-label="挂断"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 9c-.5-.4-4.5-3-9-3S3.5 8.6 3 9a1 1 0 0 0-.3 1l1.3 3a1 1 0 0 0 1 .5l3-.5a1 1 0 0 0 .8-.7l.5-2A14 14 0 0 1 12 10a14 14 0 0 1 2.6.3l.5 2a1 1 0 0 0 .8.7l3 .5a1 1 0 0 0 1-.5l1.3-3a1 1 0 0 0-.3-1z" transform="rotate(135 12 12)"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
