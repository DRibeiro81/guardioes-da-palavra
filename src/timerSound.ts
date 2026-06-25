// src/timerSound.ts
// Ponte de som do TIMER. As funções reais (startTick/stopTick/playTimeout) são
// do Eduardo (squad Áudio) e vivem em src/sound.ts. Convergência feita: este
// arquivo agora SÓ re-exporta o som de verdade — Exercise.tsx continua
// importando daqui e passa a tocar o WebAudio real, sem mexer no componente.
export { startTick, stopTick, playTimeout } from "./sound";
