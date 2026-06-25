import type { Trilha, Progresso } from "../types";
import { playClick } from "../sound";
import Mascote from "./Mascote";

function reduzMovimento(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// ripple + clique sonoro (degrada p/ só som em reduced-motion)
function fx(e: React.MouseEvent<HTMLButtonElement>) {
  playClick();
  if (reduzMovimento()) return;
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const d = Math.max(btn.clientWidth, btn.clientHeight);
  const span = document.createElement("span");
  span.className = "ripple";
  span.style.width = span.style.height = `${d}px`;
  span.style.left = `${e.clientX - rect.left - d / 2}px`;
  span.style.top = `${e.clientY - rect.top - d / 2}px`;
  btn.querySelector(".ripple")?.remove();
  btn.appendChild(span);
  setTimeout(() => span.remove(), 600);
}

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
        <Mascote
          estado="feliz"
          fala="Oi! Escolhe uma trilha que eu vou contigo 🦉"
          size={104}
          className="mascote-hero"
        />
      </div>

      <h2 className="secao-titulo">Escolha sua trilha</h2>
      <div className="trilhas">
        {TRILHAS.map((t, i) => {
          const total = contagem[t.id] ?? 0;
          return (
          <button
            key={t.id}
            className={"card-trilha " + t.cor}
            style={{ animationDelay: `${i * 0.07}s` }}
            onClick={(e) => {
              fx(e);
              onEscolher(t.id);
            }}
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
