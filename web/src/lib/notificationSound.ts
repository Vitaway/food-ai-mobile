/** Soft two-tone chime for incoming live events (browser autoplay may require a prior click). */

let audioCtx: AudioContext | null = null;
let lastPlayedAt = 0;

function getAudioContext() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function playSynthesizedChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().catch(() => undefined);

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  const makeTone = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(master);
    gain.gain.exponentialRampToValueAtTime(0.9, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  makeTone(880, now, 0.18);
  makeTone(1174.7, now + 0.12, 0.22);
}

export function playIncomingNotificationSound() {
  const now = Date.now();
  if (now - lastPlayedAt < 400) return;
  lastPlayedAt = now;

  try {
    const audio = new Audio('/sounds/notification.wav');
    audio.volume = 0.55;
    void audio.play().catch(() => {
      playSynthesizedChime();
    });
  } catch {
    playSynthesizedChime();
  }
}
