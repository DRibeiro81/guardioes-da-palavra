# Guardiões da Palavra — Spec do Protótipo (v0)

Jogo educacional web pra alunos do **8º ano** estudarem Português.
Foco do MVP: duas trilhas — **Verbos** e **Interpretação de Texto**. Alinhado à BNCC.

## Princípios (baseados em pesquisa)
- Autonomia: o aluno ESCOLHE a trilha na tela inicial.
- Competência: dificuldade adaptativa, sobe ao acertar, alivia ao errar.
- Feedback imediato a cada resposta, com "estado de vitória" satisfatório.
- Microdesafios de 2-3 min. Nada de bloco massante.
- Repetição espaçada: o que o aluno errou volta em intervalos crescentes.
- Errar NÃO pune feio: só agenda revisão. Recompensa: XP, nível, ofensiva (streak).
- Narrativa leve por cima: o aluno é um "Guardião" consertando textos corrompidos.

## Habilidades BNCC alvo (8º ano)
- EF08LP08 — voz ativa x voz passiva e o efeito de sentido do agente.
- EF08LP04 — modos/tempos verbais, concordância verbal.
- Trilha de leitura: ideia central, inferência, efeito de sentido, gênero textual.

## Stack do protótipo
- React + Vite + TypeScript, roda 100% no navegador (sem backend no MVP).
- Estado/progresso em localStorage. Sem dependências pesadas.
- Pasta do projeto: /Users/deividsoares/guardioes-da-palavra

## Contrato de dados (todos seguem este formato de exercício)
```ts
type Exercicio = {
  id: string;
  trilha: "verbos" | "interpretacao";
  habilidade: string;        // ex: "EF08LP08"
  tipo: "multipla" | "arrastar" | "caca-pista" | "completar";
  dificuldade: 1 | 2 | 3;
  enunciado: string;
  texto?: string;            // texto-base (interpretação)
  alternativas?: string[];
  resposta: string | string[];
  explicacao: string;        // feedback que aparece ao responder
  xp: number;
};
```

## Divisão de trabalho
- Felipe (Pedagógico): banco de exercícios em `content/exercicios.json` seguindo o contrato. Mín. 12 verbos + 12 interpretação, dificuldade variada, com `explicacao` boa.
- Eduardo (Game Design): documento `GAME_DESIGN.md` — loop de sessão, economia de XP/níveis, regra de repetição espaçada, copy da narrativa, telas.
- Lucas (Frontend): scaffold Vite+React+TS, tela inicial de seleção de trilha, motor de exercícios que consome `content/exercicios.json`, HUD de XP/streak, repetição espaçada via localStorage.
