import { useEffect, useMemo, useState } from "react";
import type { Exercicio, Trilha, Progresso } from "./types";
import bancoBruto from "../content/exercicios.json";
import matematicaBruto from "../content/matematica.json";
import historiaBruto from "../content/historia.json";
import inglesBruto from "../content/ingles.json";
import { carregarProgresso, salvarProgresso, resetarProgresso, nivelPorXp } from "./storage";
import { montarFila, reagendarErro, type Fila } from "./engine";
import HUD from "./components/HUD";
import TrackSelect from "./components/TrackSelect";
import Exercise from "./components/Exercise";

// Banco único: Português (verbos + interpretação) + as 3 matérias novas.
// Cada matéria vive em seu próprio JSON; aqui só concatenamos.
const banco = [
  ...(bancoBruto as Exercicio[]),
  ...(matematicaBruto as Exercicio[]),
  ...(historiaBruto as Exercicio[]),
  ...(inglesBruto as Exercicio[]),
];

export default function App() {
  const [progresso, setProgresso] = useState<Progresso>(() => carregarProgresso());
  const [trilha, setTrilha] = useState<Trilha | null>(null);
  const [fila, setFila] = useState<Fila>([]);
  const [pos, setPos] = useState(0);
  // quantas vezes cada id foi errado nesta sessão (controla o intervalo de revisão)
  const [errosSessao, setErrosSessao] = useState<Record<string, number>>({});
  const [ganhoXp, setGanhoXp] = useState<number | null>(null);

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
    setGanhoXp(null);
  }

  function responder(acertou: boolean) {
    const ex = porId.get(fila[pos]);
    if (!ex) return;

    setProgresso((p) => {
      if (acertou) {
        const novoXp = p.xp + ex.xp;
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

    if (acertou) {
      setGanhoXp(ex.xp);
    } else {
      // repetição espaçada dentro da sessão: reinsere mais à frente na fila
      const tentativas = (errosSessao[ex.id] ?? 0) + 1;
      setErrosSessao((m) => ({ ...m, [ex.id]: tentativas }));
      setFila((f) => reagendarErro(f, pos, ex.id, tentativas));
    }
  }

  function proximo() {
    setGanhoXp(null);
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
  }

  function reset() {
    setProgresso(resetarProgresso());
    setTrilha(null);
  }

  const exercicioAtual = trilha ? porId.get(fila[pos]) : undefined;

  return (
    <div className="app">
      {trilha && exercicioAtual ? (
        <>
          <HUD progresso={progresso} onSair={sair} />
          <main className="palco">
            <div className="progresso-sessao">
              <div
                className="progresso-sessao-fill"
                style={{
                  width: `${Math.round((pos / Math.max(1, fila.length)) * 100)}%`,
                }}
              />
            </div>
            <Exercise
              key={fila[pos] + "-" + pos}
              exercicio={exercicioAtual}
              onResponder={responder}
              onProximo={proximo}
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
    </div>
  );
}
