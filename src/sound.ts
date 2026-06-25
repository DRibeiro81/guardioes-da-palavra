// src/sound.ts
// Motor de SOM de "Guardiões da Palavra".
// Sons 100% SINTETIZADOS via Web Audio API — nenhum arquivo externo.
// Lida com a política de autoplay (AudioContext suspended) e persiste mute
// em localStorage. Não importa/edita nenhum componente: é self-contained.
//
// API exportada:
//   playClick(), playCorrect(), playWrong(), playLevelUp(),
//   playStreak(milestone), startMusic(), stopMusic(),
//   setMuted(b), isMuted(), resumeOnFirstGesture()

const MUTE_KEY = "gdp_muted";

// --- estado de mute (persistido) -------------------------------------------

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

let muted = loadMuted();

export function isMuted(): boolean {
  return muted;
}

export function setMuted(b: boolean): void {
  muted = b;
  try {
    localStorage.setItem(MUTE_KEY, b ? "1" : "0");
  } catch {
    /* localStorage indisponível: segue só em memória */
  }
  // ao mutar, corta a música; ao desmutar, religa se ela deveria tocar
  if (b) {
    stopMusicNodes();
  } else if (musicWanted) {
    startMusic();
  }
}

// --- AudioContext (lazy + resume) ------------------------------------------

type AnyWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const w = window as AnyWindow;
    const Ctor = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

// Garante contexto ativo. Retorna o par [ctx, master] ou null se indisponível
// ou ainda suspenso (autoplay). Tenta resume() de forma best-effort.
function ensureAudio(): [AudioContext, GainNode] | null {
  const c = getCtx();
  if (!c || !master) return null;
  if (c.state === "suspended") {
    void c.resume().catch(() => {});
  }
  if (c.state !== "running") return null;
  return [c, master];
}

// --- helper de síntese ------------------------------------------------------

type WaveType = OscillatorType;

// Toca uma nota com envelope ADSR simples (ataque rápido, decay exponencial).
function tone(
  c: AudioContext,
  out: GainNode,
  freq: number,
  startAt: number,
  dur: number,
  type: WaveType,
  peak: number,
  detune = 0,
): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (detune) osc.detune.setValueAtTime(detune, startAt);

  const attack = Math.min(0.012, dur * 0.3);
  g.gain.setValueAtTime(0.0001, startAt);
  g.gain.exponentialRampToValueAtTime(peak, startAt + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  osc.connect(g);
  g.connect(out);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.02);
}

// Sino: fundamental + parciais inarmônicas com decaimento longo.
function bell(
  c: AudioContext,
  out: GainNode,
  freq: number,
  startAt: number,
  peak: number,
): void {
  const partials = [1, 2.0, 2.97, 4.1];
  const gains = [1, 0.5, 0.32, 0.18];
  for (let i = 0; i < partials.length; i++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * partials[i], startAt);
    const p = peak * gains[i];
    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.exponentialRampToValueAtTime(p, startAt + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.1);
    osc.connect(g);
    g.connect(out);
    osc.start(startAt);
    osc.stop(startAt + 1.15);
  }
}

// --- efeitos ----------------------------------------------------------------

// Clique: blip curtinho e neutro.
export function playClick(): void {
  if (muted) return;
  const a = ensureAudio();
  if (!a) return;
  const [c, out] = a;
  const t = c.currentTime;
  tone(c, out, 440, t, 0.06, "triangle", 0.18);
}

// Acerto: arpejo alegre SUBINDO (acorde maior, dó–mi–sol–dó).
export function playCorrect(): void {
  if (muted) return;
  const a = ensureAudio();
  if (!a) return;
  const [c, out] = a;
  const t = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const step = 0.075;
  notes.forEach((f, i) => {
    tone(c, out, f, t + i * step, 0.22, "triangle", 0.22);
  });
}

// Erro: som suave e grave, NADA punitivo (queda leve de dois tons macios).
export function playWrong(): void {
  if (muted) return;
  const a = ensureAudio();
  if (!a) return;
  const [c, out] = a;
  const t = c.currentTime;
  tone(c, out, 220, t, 0.2, "sine", 0.16);
  tone(c, out, 174.61, t + 0.12, 0.26, "sine", 0.16); // F3, descendo de leve
}

// Level up: fanfarra (arpejo ascendente + acorde final brilhante).
export function playLevelUp(): void {
  if (muted) return;
  const a = ensureAudio();
  if (!a) return;
  const [c, out] = a;
  const t = c.currentTime;
  const seq = [392.0, 523.25, 659.25, 783.99]; // G4 C5 E5 G5
  const step = 0.1;
  seq.forEach((f, i) => {
    tone(c, out, f, t + i * step, 0.18, "sawtooth", 0.14);
    tone(c, out, f, t + i * step, 0.18, "triangle", 0.12); // brilho
  });
  // acorde final
  const end = t + seq.length * step;
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => {
    tone(c, out, f, end, 0.5, "triangle", 0.16);
  });
}

// Streak: sino. Marcos maiores tocam um toque mais agudo/duplo.
export function playStreak(milestone: number): void {
  if (muted) return;
  const a = ensureAudio();
  if (!a) return;
  const [c, out] = a;
  const t = c.currentTime;
  const base = milestone >= 10 ? 1318.51 : milestone >= 5 ? 1046.5 : 880.0;
  bell(c, out, base, t, 0.22);
  if (milestone >= 5) bell(c, out, base * 1.5, t + 0.14, 0.16);
  if (milestone >= 10) bell(c, out, base * 2, t + 0.28, 0.13);
}

// --- música de fundo (loop simples e leve) ---------------------------------

let musicWanted = false;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicGain: GainNode | null = null;
let musicStep = 0;

// Progressão suave e otimista em loop (notas de pad bem baixinhas).
const MELODY = [
  392.0, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23,
];

function musicTick(): void {
  const a = ensureAudio();
  if (!a || !musicGain) return;
  const [c] = a;
  const t = c.currentTime;
  const f = MELODY[musicStep % MELODY.length];
  musicStep++;
  // nota de melodia macia
  tone(c, musicGain, f, t, 0.45, "sine", 0.5);
  // quinta de apoio, ainda mais baixa
  tone(c, musicGain, f * 1.5, t, 0.45, "triangle", 0.22);
}

export function startMusic(): void {
  musicWanted = true;
  if (muted) return;
  const a = ensureAudio();
  if (!a) return; // sem gesture ainda; religa quando resumeOnFirstGesture rodar
  const [c, out] = a;
  if (musicTimer) return; // já tocando
  if (!musicGain) {
    musicGain = c.createGain();
    musicGain.gain.value = 0.12; // bem discreta, não compete com SFX
    musicGain.connect(out);
  }
  musicStep = 0;
  musicTick();
  musicTimer = setInterval(musicTick, 480);
}

function stopMusicNodes(): void {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function stopMusic(): void {
  musicWanted = false;
  stopMusicNodes();
}

// --- relógio do timer (tique-taque em loop) ---------------------------------

let tickTimer: ReturnType<typeof setInterval> | null = null;
let tickGain: GainNode | null = null;
let tickIsTock = false; // alterna tick (agudo) / tock (um tom abaixo)

// Um "click" mecânico de relógio: transiente bem curto com decaimento rápido.
// Mistura um tom alto (corpo metálico) com um harmônico grave, sem cauda longa,
// para soar seco como ponteiro — urgente mas discreto.
function clockClick(): void {
  if (muted) return; // mutou no meio do loop: silencia sem matar o timer
  const a = ensureAudio();
  if (!a || !tickGain) return;
  const [c] = a;
  const t = c.currentTime;
  // tock um pouco mais grave que o tick, para dar o "tique-taque"
  const base = tickIsTock ? 1500 : 1850;
  tickIsTock = !tickIsTock;
  tone(c, tickGain, base, t, 0.035, "square", 0.5);
  tone(c, tickGain, base * 0.5, t, 0.03, "triangle", 0.28);
}

// Inicia o tique-taque em loop. Idempotente: se já está tocando, não duplica.
// Respeita o mute global (a flag é checada a cada click; ao desmutar volta a
// soar sozinho, sem reiniciar o loop).
export function startTick(): void {
  const a = ensureAudio();
  if (!a) return; // sem contexto/gesto ainda; chamador pode re-tentar
  const [c, out] = a;
  if (tickTimer) return; // já tocando
  if (!tickGain) {
    tickGain = c.createGain();
    tickGain.gain.value = 0.22; // presente mas não estridente
    tickGain.connect(out);
  }
  tickIsTock = false;
  clockClick();
  tickTimer = setInterval(clockClick, 500); // 1 tique-taque por segundo
}

// Para o loop e zera o interval (sem vazar timers).
export function stopTick(): void {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

// Tempo esgotado: dois tons graves macios descendo, nada agressivo.
export function playTimeout(): void {
  if (muted) return;
  const a = ensureAudio();
  if (!a) return;
  const [c, out] = a;
  const t = c.currentTime;
  tone(c, out, 392.0, t, 0.28, "sine", 0.2); // G4
  tone(c, out, 261.63, t + 0.16, 0.5, "sine", 0.2); // C4, assentando suave
  tone(c, out, 130.81, t + 0.16, 0.5, "triangle", 0.12); // base grave discreta
}

// --- destravar áudio no 1º gesto do usuário (autoplay policy) ---------------

let gestureHooked = false;

// Liga listeners únicos que dão resume() no AudioContext assim que o usuário
// interage. Idempotente: chamar várias vezes não duplica handlers.
export function resumeOnFirstGesture(): void {
  if (gestureHooked) return;
  gestureHooked = true;

  const unlock = () => {
    const c = getCtx();
    if (c && c.state === "suspended") {
      void c.resume().catch(() => {});
    }
    // se a música foi pedida antes do gesto, ela começa agora
    if (musicWanted && !muted) startMusic();
    detach();
  };

  const detach = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });
  window.addEventListener("touchstart", unlock, { once: false });
}
