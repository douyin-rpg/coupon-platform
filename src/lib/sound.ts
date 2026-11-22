// 客服工作台 - 高音量新消息提示音（Web Audio API 合成，无外部音频依赖）
// 使用多振荡器叠加 + 高增益，确保提示音足够响亮；支持开关与音量调节（localStorage 持久化）

export interface SoundPrefs {
  enabled: boolean;
  volume: number; // 0-1
}

const PREFS_KEY = 'support_sound_prefs';

export function getSoundPrefs(): SoundPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as SoundPrefs;
      return { enabled: p.enabled !== false, volume: Math.min(1, Math.max(0, Number(p.volume) || 0.9)) };
    }
  } catch {
    // ignore
  }
  return { enabled: true, volume: 0.9 };
}

export function saveSoundPrefs(prefs: SoundPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

let audioCtx: AudioContext | null = null;
let lastPlayAt = 0;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// 合成"叮-咚"双音 + 高频层次，叠加后响度显著
function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  duration: number,
  peak: number,
  type: OscillatorType = 'sine',
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  // 短促衰减包络，形成敲击感
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export function playNewMessageSound() {
  try {
    const prefs = getSoundPrefs();
    if (!prefs.enabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const now = performance.now();
    if (now - lastPlayAt < 600) return; // 防抖：同一时刻连发消息只响一次
    lastPlayAt = now;

    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 2.6 * prefs.volume; // 主增益放大，保证响亮
    master.connect(ctx.destination);

    // 第一声"叮"：880Hz 基音 + 1760Hz 泛音
    tone(ctx, master, 880, t, 0.22, 0.9, 'sine');
    tone(ctx, master, 1760, t, 0.16, 0.35, 'triangle');
    // 第二声"咚"：660Hz 基音 + 1320Hz 泛音（稍低，形成标准提示音节奏）
    tone(ctx, master, 660, t + 0.18, 0.3, 0.95, 'sine');
    tone(ctx, master, 1320, t + 0.18, 0.22, 0.4, 'triangle');
  } catch {
    // 提示音失败不阻塞业务
  }
}

// 浏览器标签页标题闪烁提醒（新消息到达且页面不在前台时）
let titleTimer: ReturnType<typeof setInterval> | null = null;
let originalTitle = '';

export function flashTitle(text = '【新消息】') {
  try {
    const prefs = getSoundPrefs();
    if (!prefs.enabled) return;
    if (document.hasFocus()) return;
    if (titleTimer) return;
    originalTitle = document.title;
    let flag = false;
    titleTimer = setInterval(() => {
      document.title = flag ? originalTitle : text;
      flag = !flag;
    }, 1000);
    window.addEventListener(
      'focus',
      () => {
        stopFlashTitle();
      },
      { once: true },
    );
  } catch {
    // ignore
  }
}

export function stopFlashTitle() {
  if (titleTimer) {
    clearInterval(titleTimer);
    titleTimer = null;
    document.title = originalTitle;
  }
}