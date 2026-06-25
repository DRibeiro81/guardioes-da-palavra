import type { Exercicio } from "./types";

// Normaliza texto pra comparar respostas digitadas (completar):
// minúsculas, sem acento, sem pontuação nas bordas, espaços colapsados.
export function normalizar(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,;:!?"']/g, "")
    .replace(/\s+/g, " ");
}

// Confere a resposta do aluno contra o gabarito.
// - resposta string[]: ORDEM EXATA (arrastar) — a sequência montada tem que
//   bater posição a posição com o gabarito.
// - resposta string: comparação normalizada (multipla, completar, caca-pista).
export function conferir(ex: Exercicio, escolha: string | string[]): boolean {
  if (Array.isArray(ex.resposta)) {
    const dado = Array.isArray(escolha) ? escolha : [escolha];
    if (dado.length !== ex.resposta.length) return false;
    return ex.resposta.every((v, i) => normalizar(v) === normalizar(dado[i]));
  }
  const dado = Array.isArray(escolha) ? escolha.join(" ") : escolha;
  return normalizar(ex.resposta) === normalizar(dado);
}

// Embaralho determinístico por string (estável entre reloads de um exercício).
// Usado pra apresentar os chips do arrastar fora da ordem do gabarito.
export function embaralharPorChave<T>(arr: T[], chave: string): T[] {
  let seed = 0;
  for (let i = 0; i < chave.length; i++) seed = (seed * 31 + chave.charCodeAt(i)) >>> 0;
  return embaralhar(arr, seed || 1);
}

// ---- Fila de sessão com repetição espaçada simples ----
// Cada item da fila é um id de exercício. Ao errar, o exercício volta
// algumas posições à frente (intervalo crescente conforme erra de novo).

export type Fila = string[];

// Monta a fila inicial de uma trilha, embaralhando dentro de cada nível de
// dificuldade e subindo a dificuldade gradualmente (1 -> 2 -> 3).
export function montarFila(exercicios: Exercicio[], seed = 1): Fila {
  const porDif = [1, 2, 3].map((d) =>
    embaralhar(
      exercicios.filter((e) => e.dificuldade === d).map((e) => e.id),
      seed + d,
    ),
  );
  return porDif.flat();
}

// Reinsere um exercício errado mais à frente na fila.
// tentativas = quantas vezes já errou este id nesta sessão (1, 2, 3...).
export function reagendarErro(
  fila: Fila,
  posAtual: number,
  id: string,
  tentativas: number,
): Fila {
  const nova = fila.slice();
  // intervalo cresce: 1ª vez +2, 2ª +4, 3ª +6... (repetição espaçada simples)
  const passo = 2 * tentativas;
  const destino = Math.min(posAtual + passo, nova.length);
  nova.splice(destino, 0, id);
  return nova;
}

// Embaralho determinístico (Fisher-Yates com PRNG por seed) — estável entre
// reloads pra fila não "pular" no meio da sessão.
function embaralhar<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed >>> 0 || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
