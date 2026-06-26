import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercicio, Trilha, Progresso } from "./types";
import bancoBruto from "../content/exercicios.json";
import matematicaBruto from "../content/matematica.json";
import historiaBruto from "../content/historia.json";
import inglesBruto from "../content/ingles.json";
import { carregarProgresso, salvarProgresso, resetarProgresso, nivelPorXp } from "./storage";
import { montarFila, reagendarErro, type Fila } from "./engine";
import {
  playCorrect,
  playWrong,
  playLevelUp,
  playStreak,
  setMuted as somSetMuted,
  isMuted as somIsMuted,
  resumeOnFirstGesture,
} from "./sound";
import HUD from "./components/HUD";
import TrackSelect from "./components/TrackSelect";
import Exercise from "./components/Exercise";
import Confetti from "./components/Confetti";
import Mascote, { type EstadoMascote } from "./components/Mascote";

// Banco único: Português (verbos + interpretação) + as 3 matérias novas.
// Cada matéria vive em seu próprio JSON; aqui só concatenamos.
const banco = [
  ...(bancoBruto as Exercicio[]),
  ...(matematicaBruto as Exercicio[]),
  ...(historiaBruto as Exercicio[]),
  ...(inglesBruto as Exercicio[]),
];

// partículas leves do fundo (geradas uma vez)
const PARTICULAS = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => (Math.sin((i + 1) * 51.3 + n) + 1) / 2;
  return {
    left: r(1) * 100,
    size: 4 + r(2) * 10,
    dur: 12 + r(3) * 16,
    delay: r(4) * 12,
    drift: (r(5) * 80 - 40).toFixed(0),
  };
});

const MILESTONES = new Set([3, 5, 10]);

export default function App() {
  const [progresso, setProgresso] = useState<Progresso>(() => carregarProgresso());
  const [trilha, setTrilha] = useState<Trilha | null>(null);
  const [fila, setFila] = useState<Fila>([]);
  const [pos, setPos] = useState(0);
  // quantas vezes cada id foi errado nesta sessão (controla o intervalo de revisão)
  const [errosSessao, setErrosSessao] = useState<Record<string, number>>({});
  // erros consecutivos na sessão -> alimenta a RAIVA do mago (2+ seguidos)
  const [errosSeguidos, setErrosSeguidos] = useState(0);
  const [ganhoXp, setGanhoXp] = useState<number | null>(null);

  // ---- estado de juice ----
  const [muted, setMutedState] = useState(() => somIsMuted());
  const [confettiFire, setConfettiFire] = useState(0);
  const [flash, setFlash] = useState<{ tipo: "ok" | "erro"; k: number } | null>(null);
  const [levelUp, setLevelUp] = useState<{ nivel: number; k: number } | null>(null);
  const [xpFly, setXpFly] = useState<{ val: number; selo: string | null; k: number } | null>(null);
  const [mascote, setMascote] = useState<EstadoMascote>("neutro");
  const [mascoteFala, setMascoteFala] = useState<string | undefined>(undefined);
  const fxKey = useRef(0);

  // destrava o áudio no 1º gesto (política de autoplay)
  useEffect(() => {
    resumeOnFirstGesture();
  }, []);

  // mapa id -> exercício pra lookup rápido
  const porId = useMemo(() => {
    const m = new Map<string, Exercicio>();
    for (const e of banco) m.set(e.id, e);
    return m;
  }, []);

  // Contagem genérica por trilha — cresce sozinha conforme o type Trilha.
  const contagem = useMemo(() => {
    const c = {} as Record<Trilha, number>;
    for (const e of banco) c[e.trilha] = (c[e.trilha] ?? 0) + 1;
    return c;
  }, []);

  // persiste a cada mudança de progresso
  useEffect(() => {
    salvarProgresso(progresso);
  }, [progresso]);

  function toggleMute() {
    const novo = !muted;
    somSetMuted(novo);
    setMutedState(novo);
  }

  function iniciarTrilha(t: Trilha) {
    const daTrilha = banco.filter((e) => e.trilha === t);
    // injeta itens marcados pra revisão (repetição espaçada entre sessões)
    const revisarDaTrilha = progresso.revisar.filter(
      (id) => porId.get(id)?.trilha === t,
    );
    const base = montarFila(daTrilha);
    // revisões entram primeiro pra fechar o ciclo de erro
    const novaFila = [...revisarDaTrilha, ...base];
    setTrilha(t);
    setFila(novaFila);
    setPos(0);
    setErrosSessao({});
    setErrosSeguidos(0);
    setGanhoXp(null);
    setMascote("neutro");
    setMascoteFala("Bora, aprendiz! 💪");
  }

  function responder(acertou: boolean, segundosRestantes: number) {
    const ex = porId.get(fila[pos]);
    if (!ex) return;
    const antes = progresso;

    // Bônus de velocidade: pontos = base + round(base * segRest/60). Só no acerto.
    const seg = Math.max(0, Math.min(60, segundosRestantes));
    const bonus = acertou ? Math.round(ex.xp * (seg / 60)) : 0;
    const ganho = ex.xp + bonus; // XP total da questão quando acerta
    // Selo de rapidez: >=55s "VOANDO!", >=45s "RÁPIDO!". Burst extra no topo.
    const selo = acertou ? (seg >= 55 ? "VOANDO!" : seg >= 45 ? "RÁPIDO!" : null) : null;

    if (acertou) {
      playCorrect();
      const novoXp = antes.xp + ganho;
      const novoNivel = nivelPorXp(novoXp);
      const subiuNivel = novoNivel > antes.nivel;
      const novoStreak = antes.streak + 1;

      setGanhoXp(ganho);
      const k = ++fxKey.current;
      setConfettiFire((f) => f + 1);
      // burst extra de confete quando o bônus é alto (selo) — sem exagero
      if (selo) setConfettiFire((f) => f + 1);
      setFlash({ tipo: "ok", k });
      setXpFly({ val: ganho, selo, k });
      setErrosSeguidos(0);
      setMascote("feliz");
      setMascoteFala(selo ? `${selo} Magia pura! ⚡` : "Mandou bem, aprendiz! ✨");

      if (subiuNivel) {
        playLevelUp();
        setLevelUp({ nivel: novoNivel, k });
      } else if (MILESTONES.has(novoStreak)) {
        playStreak(novoStreak);
      }
    } else {
      playWrong();
      const k = ++fxKey.current;
      setFlash({ tipo: "erro", k });
      // tempo esgotado (seg<=0) ou 2+ erros seguidos -> mago com RAIVA (bravo,
      // mas encorajador). Erro isolado -> triste.
      const timeout = seg <= 0;
      const seguidos = errosSeguidos + 1;
      setErrosSeguidos(seguidos);
      if (timeout || seguidos >= 2) {
        setMascote("raiva");
        setMascoteFala(
          timeout ? "Foco, aprendiz! O tempo voou! ⏳" : "Respira e concentra! 🔥",
        );
      } else {
        setMascote("triste");
        setMascoteFala("Quase! Isso volta pra revisão. 🔁");
      }
    }

    setProgresso((p) => {
      if (acertou) {
        const novoXp = p.xp + ganho;
        const novoStreak = p.streak + 1;
        return {
          ...p,
          xp: novoXp,
          nivel: nivelPorXp(novoXp),
          streak: novoStreak,
          melhorStreak: Math.max(p.melhorStreak, novoStreak),
          acertos: p.acertos + 1,
          // acertou: tira da lista de revisão (dominou)
          revisar: p.revisar.filter((id) => id !== ex.id),
        };
      }
      // errou: zera ofensiva, agenda revisão (sem punir XP)
      return {
        ...p,
        streak: 0,
        erros: p.erros + 1,
        revisar: p.revisar.includes(ex.id) ? p.revisar : [...p.revisar, ex.id],
      };
    });

    if (!acertou) {
      // repetição espaçada dentro da sessão: reinsere mais à frente na fila
      const tentativas = (errosSessao[ex.id] ?? 0) + 1;
      setErrosSessao((m) => ({ ...m, [ex.id]: tentativas }));
      setFila((f) => reagendarErro(f, pos, ex.id, tentativas));
    }
  }

  // limpa overlays efêmeros (flash / xp / level up)
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 650);
    return () => clearTimeout(t);
  }, [flash]);
  useEffect(() => {
    if (!xpFly) return;
    const t = setTimeout(() => setXpFly(null), 1050);
    return () => clearTimeout(t);
  }, [xpFly]);
  useEffect(() => {
    if (!levelUp) return;
    const t = setTimeout(() => setLevelUp(null), 1900);
    return () => clearTimeout(t);
  }, [levelUp]);

  function proximo() {
    setGanhoXp(null);
    setMascote("neutro");
    setMascoteFala(undefined);
    if (pos + 1 >= fila.length) {
      // fim da sessão -> volta pra seleção de trilha
      setTrilha(null);
      return;
    }
    setPos(pos + 1);
  }

  function sair() {
    setTrilha(null);
    setGanhoXp(null);
    setMascote("neutro");
    setMascoteFala(undefined);
  }

  function reset() {
    setProgresso(resetarProgresso());
    setTrilha(null);
  }

  const exercicioAtual = trilha ? porId.get(fila[pos]) : undefined;

  return (
    <div className="app">
      {/* fundo animado + partículas (decorativo) */}
      <div className="fundo-anim" aria-hidden="true">
        {PARTICULAS.map((p, i) => (
          <span
            key={i}
            className="particula"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              // @ts-expect-error custom prop p/ CSS
              "--drift": `${p.drift}px`,
            }}
          />
        ))}
      </div>

      <Confetti fire={confettiFire} />

      {flash && <div className={"flash-overlay " + flash.tipo} key={flash.k} />}

      {xpFly && (
        <div className="xp-fly" key={"xp" + xpFly.k}>
          +{xpFly.val} XP ⭐
          {xpFly.selo && <span className="xp-selo">{xpFly.selo}</span>}
        </div>
      )}

      {levelUp && (
        <div className="levelup" key={"lv" + levelUp.k}>
          <div className="levelup-card">
            <div className="levelup-emoji">🎉</div>
            <div className="levelup-titulo">Subiu de nível!</div>
            <div className="levelup-sub">Nível {levelUp.nivel} 🛡️</div>
          </div>
        </div>
      )}

      {trilha && exercicioAtual ? (
        <>
          <HUD progresso={progresso} muted={muted} onToggleMute={toggleMute} onSair={sair} />
          <main className="palco">
            <div className="progresso-sessao">
              <div
                className="progresso-sessao-fill"
                style={{
                  width: `${Math.round((pos / Math.max(1, fila.length)) * 100)}%`,
                }}
              />
            </div>
            <div className="mascote-palco">
              <Mascote estado={mascote} fala={mascoteFala} size={84} />
            </div>
            <Exercise
              key={fila[pos] + "-" + pos}
              exercicio={exercicioAtual}
              onResponder={responder}
              onProximo={proximo}
              onUrgencia={() => {
                // reta final do cronômetro: o mago fica IMPACIENTE
                setMascote("impaciente");
                setMascoteFala("Anda, aprendiz! O tempo tá acabando! ⏳");
              }}
            />
          </main>
          {ganhoXp !== null && (
            <div className="toast-xp" key={pos}>
              +{ganhoXp} XP 🔥
            </div>
          )}
        </>
      ) : (
        <TrackSelect
          progresso={progresso}
          contagem={contagem}
          onEscolher={iniciarTrilha}
          onResetar={reset}
        />
      )}
      <footer className="creditos">
        Personagem por{" "}
        <a href="https://www.dicebear.com" target="_blank" rel="noreferrer noopener">
          DiceBear
        </a>{" "}
        — estilo “Big Smile” de Ashley Seo (CC BY 4.0)
      </footer>
    </div>
  );
}
