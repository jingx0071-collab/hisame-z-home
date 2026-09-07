// 通话生命周期——方案 C：
// VAD (@ricky0123/vad-web) 检测宝宝讲完 → wrap WAV → STT (Whisper) → Chat (Claude)
// → TTS (ElevenLabs) → 播 → 循环。爸爸讲话时 VAD 暂停，避免自听。

import { MicVAD } from '@ricky0123/vad-web';

export type CallState =
  | 'idle'
  | 'requesting-mic'
  | 'connecting'
  | 'listening'
  | 'user-speaking'
  | 'thinking'
  | 'agent-speaking'
  | 'ended'
  | 'error';

export type CallHandle = {
  stop: () => Promise<void>;
  getState: () => CallState;
};

type Msg = { role: 'user' | 'assistant'; content: string };

type StartArgs = {
  // 必须由 handleCall 在 gesture 里 sync new，然后 resume 一次再传进来——Safari 才认。
  audioContext: AudioContext;
  onState?: (s: CallState, detail?: string) => void;
  onError?: (msg: string) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
};

// VAD 模型和 ONNX runtime 的 wasm/mjs 从 public/vad/ 加载（走 Next 静态资源，Safari 才不卡 CORS）
const VAD_BASE = '/vad/';
const ORT_BASE = '/vad/';

export async function startCall(args: StartArgs): Promise<CallHandle> {
  const { audioContext, onState, onError, onTranscript } = args;

  let state: CallState = 'idle';
  const setState = (s: CallState, detail?: string) => {
    state = s;
    onState?.(s, detail);
  };

  const messages: Msg[] = [];
  let vad: MicVAD | null = null;
  let currentSource: AudioBufferSourceNode | null = null;
  let stopped = false;

  const stop = async () => {
    if (stopped) return;
    stopped = true;
    try { vad?.destroy(); } catch { /* noop */ }
    try { currentSource?.stop(); } catch { /* noop */ }
    try { currentSource?.disconnect(); } catch { /* noop */ }
    vad = null;
    currentSource = null;
    if (state !== 'error') setState('ended');
  };

  const fail = (msg: string) => {
    if (state === 'error') return;
    setState('error', msg);
    onError?.(msg);
    void stop();
  };

  const resumeListening = () => {
    if (stopped) return;
    setState('listening');
    try { vad?.start(); } catch { /* noop */ }
  };

  const playReplyAndResume = async (text: string) => {
    if (stopped) return;
    setState('agent-speaking');
    onTranscript?.(text, false);
    try {
      const r = await fetch('/api/call/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`tts ${r.status}：${t.slice(0, 200)}`);
      }
      const arrayBuffer = await r.arrayBuffer();
      if (stopped) return;

      // Safari 的 decodeAudioData 需要 promise 版本
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      if (stopped) return;

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      currentSource = source;

      source.onended = () => {
        if (currentSource === source) currentSource = null;
        try { source.disconnect(); } catch { /* noop */ }
        resumeListening();
      };

      source.start();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fail(`播放失败：${msg}`);
    }
  };

  const processUserAudio = async (float32: Float32Array) => {
    if (stopped) return;
    try { vad?.pause(); } catch { /* noop */ }
    setState('thinking');

    const wavBlob = float32ToWavBlob(float32, 16000);

    // 1) STT
    let transcript = '';
    try {
      const form = new FormData();
      form.append('file', wavBlob, 'utterance.wav');
      const r = await fetch('/api/call/stt', { method: 'POST', body: form });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`stt ${r.status}：${t.slice(0, 200)}`);
      }
      const data = await r.json();
      transcript = String(data.transcript || '').trim();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fail(`识别失败：${msg}`);
      return;
    }

    if (!transcript) {
      resumeListening();
      return;
    }

    onTranscript?.(transcript, true);
    messages.push({ role: 'user', content: transcript });

    // 2) Chat
    let reply = '';
    try {
      const r = await fetch('/api/call/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`chat ${r.status}：${t.slice(0, 200)}`);
      }
      const data = await r.json();
      reply = String(data.reply || '').trim();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fail(`回应失败：${msg}`);
      return;
    }

    if (!reply) {
      resumeListening();
      return;
    }

    messages.push({ role: 'assistant', content: reply });

    // 3) TTS + 播 + 恢复听
    await playReplyAndResume(reply);
  };

  try {
    setState('requesting-mic');
    setState('connecting');

    vad = await MicVAD.new({
      baseAssetPath: VAD_BASE,
      onnxWASMBasePath: ORT_BASE,
      positiveSpeechThreshold: 0.6,
      negativeSpeechThreshold: 0.4,
      minSpeechFrames: 4,
      preSpeechPadFrames: 8,
      onSpeechStart: () => {
        if (!stopped && state === 'listening') setState('user-speaking');
      },
      onSpeechEnd: (audio: Float32Array) => {
        if (!stopped) void processUserAudio(audio);
      },
      onVADMisfire: () => { /* 太短的段被 misfire，忽略 */ },
    });

    if (stopped) return { stop, getState: () => state };

    // 4) 开场：empty messages → 爸爸主动开口
    setState('thinking');
    try {
      const r = await fetch('/api/call/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`chat ${r.status}：${t.slice(0, 200)}`);
      }
      const data = await r.json();
      const reply = String(data.reply || '').trim();
      if (reply) {
        messages.push({ role: 'assistant', content: reply });
        await playReplyAndResume(reply);
      } else {
        resumeListening();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fail(`开场失败：${msg}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    fail(msg);
  }

  return {
    stop,
    getState: () => state,
  };
}

// Float32Array (16kHz mono) → WAV Blob (16-bit PCM, mono)
function float32ToWavBlob(pcm: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = (pcm.length * bitsPerSample) / 8;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
