import type { Trilha, Progresso } from "../types";

type Props = {
  progresso: Progresso;
  // Parcial: trilhas sem exercícios ainda nem aparecem no mapa.
  contagem: Partial<Record<Trilha, number>>;
  onEscolher: (t: Trilha) => void;
  onResetar: () => void;
};

const TRILHAS: {
  id: Trilha;
  nome: string;
  emoji: string;
  descricao: string;
  cor: string;
}[] = [
  {
    id: "verbos",
    nome: "Verbos",
    emoji: "⚔️",
    descricao: "Voz ativa e passiva, tempos, concordância. Domine a ação das palavras.",
    cor: "card-verbos",
  },
  {
    id: "interpretacao",
    nome: "Interpretação",
    emoji: "🔍",
    descricao: "Ideia central, inferência e efeitos de sentido. Decifre o texto.",
    cor: "card-interpretacao",
  },
  {
    id: "matematica",
    nome: "Matemática",
    emoji: "📐",
    descricao: "Equações, porcentagem, geometria e gráficos. Domine os números.",
    cor: "card-matematica",
  },
  {
    id: "historia",
    nome: "História",
    emoji: "🏛️",
    descricao: "Iluminismo, revoluções e o Brasil Império. Reviva o passado.",
    cor: "card-historia",
  },
  {
    id: "ingles",
    nome: "Inglês",
    emoji: "🌎",
    descricao: "Tempos verbais, comparativos e leitura em inglês. Speak up!",
    cor: "card-ingles",
  },
];

export default function TrackSelect({
  progresso,
  contagem,
  onEscolher,
  onResetar,
}: Props) {
  return (
    <div className="tela-inicial">
      <div className="hero">
        <div className="hero-emblema">🛡️</div>
        <h1>Guardiões da Palavra</h1>
        <p className="hero-sub">
          Os textos da vila foram corrompidos. Escolha sua trilha e conserte as
          palavras pra recuperar o poder do Guardião.
        </p>
        <div className="hero-stats">
          <span>🛡️ Nível {progresso.nivel}</span>
          <span>⭐ {progresso.xp} XP</span>
          <span>🔥 {progresso.melhorStreak} melhor ofensiva</span>
        </div>
      </div>

      <h2 className="secao-titulo">Escolha sua trilha</h2>
      <div className="trilhas">
        {TRILHAS.map((t) => {
          const total = contagem[t.id] ?? 0;
          return (
          <button
            key={t.id}
            className={"card-trilha " + t.cor}
            onClick={() => onEscolher(t.id)}
            disabled={total === 0}
          >
            <span className="card-emoji">{t.emoji}</span>
            <span className="card-nome">{t.nome}</span>
            <span className="card-desc">{t.descricao}</span>
            <span className="card-badge">
              {total > 0 ? `${total} desafios` : "em breve"}
            </span>
            {progresso.revisar.length > 0 && (
              <span className="card-revisar">
                {progresso.revisar.length} pra revisar 🔁
              </span>
            )}
          </button>
          );
        })}
      </div>

      <button className="link-reset" onClick={onResetar}>
        Recomeçar progresso
      </button>
    </div>
  );
}
