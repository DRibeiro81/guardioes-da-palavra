import type { Progresso } from "./types";

const CHAVE = "guardioes-progresso-v1";

export const progressoInicial: Progresso = {
  xp: 0,
  nivel: 1,
  streak: 0,
  melhorStreak: 0,
  acertos: 0,
  erros: 0,
  revisar: [],
};

// Curva de nível: cada nível custa um pouco mais de XP.
// Nível N exige 50*N*(N-1) de XP acumulado (1=0, 2=100, 3=300, 4=600...).
export function nivelPorXp(xp: number): number {
  let nivel = 1;
  while (50 * (nivel + 1) * nivel <= xp) nivel++;
  return nivel;
}

export function xpDoNivel(nivel: number): number {
  return 50 * nivel * (nivel - 1);
}

export function carregarProgresso(): Progresso {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return { ...progressoInicial };
    const dados = JSON.parse(bruto) as Partial<Progresso>;
    return { ...progressoInicial, ...dados };
  } catch {
    return { ...progressoInicial };
  }
}

export function salvarProgresso(p: Progresso): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    // localStorage indisponível (modo privado): ignora, jogo segue em memória.
  }
}

export function resetarProgresso(): Progresso {
  const novo = { ...progressoInicial };
  salvarProgresso(novo);
  return novo;
}
