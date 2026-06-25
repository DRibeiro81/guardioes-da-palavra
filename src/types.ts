// Contrato de dados — espelha o SPEC.md.
// O Felipe popula content/exercicios.json seguindo exatamente este formato.

export type Trilha =
  | "verbos"
  | "interpretacao"
  | "matematica"
  | "historia"
  | "ingles";

export type TipoExercicio = "multipla" | "arrastar" | "caca-pista" | "completar";

export type Exercicio = {
  id: string;
  trilha: Trilha;
  habilidade: string; // ex: "EF08LP08"
  tipo: TipoExercicio;
  dificuldade: 1 | 2 | 3;
  enunciado: string;
  texto?: string; // texto-base (interpretação)
  alternativas?: string[];
  resposta: string | string[];
  explicacao: string; // feedback que aparece ao responder
  xp: number;
};

export type Progresso = {
  xp: number;
  nivel: number;
  streak: number; // ofensiva: acertos consecutivos
  melhorStreak: number;
  acertos: number;
  erros: number;
  // ids errados que precisam voltar (repetição espaçada simples)
  revisar: string[];
};
