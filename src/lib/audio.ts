let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let bgmPlaying = false;
let soundEnabled = true;
const triggeredMilestones = new Set<number>();

// ── 自定义 BGM（背景音乐，必须是独立的音乐文件）─────────────────────────
const bgmAudio = new Audio();
bgmAudio.loop = true;
bgmAudio.volume = 0.25;
// 替换成你自己的 BGM 链接（完整一行，无空格）
bgmAudio.src = 'https://ezfbyqmpnrlbxkonvzgd.supabase.co/storage/v1/object/sign/audio/hypemanins.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81MDYyOTk5OC1lNzM1LTQyMjItOGIyZi0wMjYwNjAwM2M3ZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdWRpby9oeXBlbWFuaW5zLm1wMyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUwMzUyMTIsImV4cCI6MTg3MTQzNTIxMn0.B9NdU_bFzTBNTRUXZTRgM5A_ZwZqYvjvqYHjTGqvH68';

// 当浏览器阻止自动播放时，在用户首次交互后尝试播放
document.addEventListener('click', () => {
  if (soundEnabled && !bgmPlaying) startBGM();
}, { once: true });
document.addEventListener('touchstart', () => {
  if (soundEnabled && !bgmPlaying) startBGM();
}, { once: true });

// ── 里程碑奖励音频（短音频，不循环）───────────────────────────────────────
const MILESTONE_CUSTOM_SOUNDS: Record<number, string> = {
  0: 'https://ezfbyqmpnrlbxkonvzgd.supabase.co/storage/v1/object/sign/audio/newmilestone1%20(1).mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtlV81MDYyOTk5OC1lNzM1LTQyMjItOGIyZi0wMjYwNjAwM2M3ZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdWRpby9uZXdtaWxlc3RvbmUxICgxKS5tcDMiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1MDQ1MDAwLCJleHAiOjE4NzE0NDUwMDB9.r9lxyW3VQktbObFkHwNI5_hOZR70Qxmp47SYIyX_ay8',
  1: 'https://ezfbyqmpnrlbxkonvzgd.supabase.co/storage/v1/object/sign/audio/newmilestone2.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtlV81MDYyOTk5OC1lNzM1LTQyMjItOGIyZi0wMjYwNjAwM2M3ZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdWRpby9uZXdtaWxlc3RvbmUyLm1wMyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUwNDUwMjksImV4cCI6MTg3MTQ0NTAyOX0.wD11R_G7Wd1UKx-KJnzeQcuPDul-bHaX38EqJn8LNl8',
  2: 'https://ezfbyqmpnrlbxkonvzgd.supabase.co/storage/v1/object/sign/audio/newmilestone1%20(1).mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtlV81MDYyOTk5OC1lNzM1LTQyMjItOGIyZi0wMjYwNjAwM2M3ZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdWRpby9uZXdtaWxlc3RvbmUxICgxKS5tcDMiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1MDQ1MDAwLCJleHAiOjE4NzE0NDUwMDB9.r9lxyW3VQktbObFkHwNI5_hOZR70Qxmp47SYIyX_ay8',
  3: 'https://ezfbyqmpnrlbxkonvzgd.supabase.co/storage/v1/object/sign/audio/newmilestone2.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtlV81MDYyOTk5OC1lNzM1LTQyMjItOGIyZi0wMjYwNjAwM2M3ZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdWRpby9uZXdtaWxlc3RvbmUyLm1wMyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUwNDUwMjksImV4cCI6MTg3MTQ0NTAyOX0.wD11R_G7Wd1UKx-KJnzeQcuPDul-bHaX38EqJn8LNl8',
};

export const SCORE_MILESTONES = [
  { score: 500,  message: '起步啦！', color: '#FFD700' },
  { score: 1000, message: '太棒了！', color: '#FF6B9D' },
  { score: 1500, message: '超厉害！', color: '#00E5FF' },
  { score: 2000, message: '无敌大呐呐！', color: '#FF4081' },
];

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(audioCtx.destination);

    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = 0.18;
    bgmGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.7;
    sfxGain.connect(masterGain);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (!enabled) stopBGM();
  if (!masterGain) return;
  masterGain.gain.value = enabled ? 0.8 : 0;
}

export function isSoundEnabled() {
  return soundEnabled;
}

function note(freq: number, start: number, dur: number, gain: GainNode, wave: OscillatorType = 'sine', vol = 1) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(vol, start + 0.02);
  env.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(env);
  env.connect(gain);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

export function playMergeSound(level: number) {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const g = sfxGain!;
  const t = ctx.currentTime;
  const freqs = [523, 659, 784, 988, 1175, 1397, 1568, 2093];
  const f = freqs[Math.min(level - 1, freqs.length - 1)];
  note(f, t, 0.15, g, 'sine', 0.6);
  note(f * 1.5, t + 0.06, 0.12, g, 'sine', 0.3);
  if (level >= 6) {
    note(f * 2, t + 0.1, 0.2, g, 'sine', 0.4);
  }
}

export function playDropSound() {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const g = sfxGain!;
  const t = ctx.currentTime;
  note(200, t, 0.08, g, 'sine', 0.3);
  note(150, t + 0.05, 0.06, g, 'sine', 0.2);
}

export function playGameOverSound() {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const g = sfxGain!;
  const t = ctx.currentTime;
  const seq = [523, 466, 415, 370, 330];
  seq.forEach((f, i) => note(f, t + i * 0.15, 0.2, g, 'sawtooth', 0.4));
}

export function playMilestoneSound(tier: number) {
  if (!soundEnabled) return;

  const customUrl = MILESTONE_CUSTOM_SOUNDS[tier];
  if (customUrl && customUrl.length > 10) {  // 确保不是空字符串或无效 URL
    const audio = new Audio(customUrl);
    audio.volume = 0.8;
    audio.play().catch(() => {});
    return;
  }

  // 回退到合成音效
  const ctx = getCtx();
  const g = sfxGain!;
  const t = ctx.currentTime;
  const seqs = [
    [784, 988, 1175, 1568],
    [880, 1047, 1319, 1760],
    [1047, 1319, 1568, 2093, 2637],
    [1319, 1568, 1976, 2637, 3136, 3951],
  ];
  const seq = seqs[Math.min(tier, seqs.length - 1)];
  seq.forEach((f, i) => {
    note(f, t + i * 0.09, 0.25, g, 'sine', 0.55);
    note(f * 0.5, t + i * 0.09, 0.2, g, 'sine', 0.2);
  });
}

export function startBGM() {
  if (bgmPlaying || !soundEnabled) return;
  bgmPlaying = true;
  bgmAudio.play().catch((e) => {
    console.warn('BGM 播放失败（需要用户交互）:', e);
    bgmPlaying = false;
  });
}

export function stopBGM() {
  bgmPlaying = false;
  bgmAudio.pause();
  bgmAudio.currentTime = 0;
}

export function checkMilestone(score: number): { message: string; color: string; tier: number } | null {
  for (let i = SCORE_MILESTONES.length - 1; i >= 0; i--) {
    const m = SCORE_MILESTONES[i];
    if (score >= m.score && !triggeredMilestones.has(m.score)) {
      triggeredMilestones.add(m.score);
      playMilestoneSound(i);
      return { ...m, tier: i };
    }
  }
  return null;
}

export function resetMilestones() {
  triggeredMilestones.clear();
}