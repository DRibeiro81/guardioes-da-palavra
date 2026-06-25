import { useEffect, useMemo, useState } from "react";
import type { Exercicio } from "../types";
import { conferir, embaralharPorChave } from "../engine";
import { playClick } from "../sound";

type Props = {
  exercicio: Exercicio;
  onResponder: (acertou: boolean) => void;
  onProximo: () => void;
};

function reduzMovimento(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// ripple + clique sonoro num único handler. Degrada (só som) em reduced-motion.
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

export default function Exercise({ exercicio, onResponder, onProximo }: Props) {
  // estado de resposta para esta questão
  const [escolhaUnica, setEscolhaUnica] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [ordem, setOrdem] = useState<string[]>([]); // sequência montada (arrastar)
  const [resultado, setResultado] = useState<null | boolean>(null);

  const tipo = exercicio.tipo;
  const ehArrastar = tipo === "arrastar";
  const ehCacaPista = tipo === "caca-pista";
  const ehCompletar = tipo === "completar";
  // multipla é o caso padrão de escolha única em botões grandes
  const ehMultipla = !ehArrastar && !ehCacaPista && !ehCompletar;

  // chips do arrastar embaralhados (o gabarito do Felipe vem na ordem certa)
  const chips = useMemo(
    () => embaralharPorChave(exercicio.alternativas ?? [], exercicio.id),
    [exercicio.id, exercicio.alternativas],
  );

  // reseta tudo ao trocar de exercício
  useEffect(() => {
    setEscolhaUnica(null);
    setTexto("");
    setOrdem([]);
    setResultado(null);
  }, [exercicio.id]);

  const respondido = resultado !== null;

  const podeEnviar = useMemo(() => {
    if (respondido) return false;
    if (ehCompletar) return texto.trim().length > 0;
    if (ehArrastar) return ordem.length === (exercicio.alternativas?.length ?? 0);
    return escolhaUnica !== null;
  }, [respondido, ehCompletar, ehArrastar, texto, ordem, escolhaUnica, exercicio.alternativas]);

  // ---- arrastar: adicionar/remover da fila ----
  function adicionarChip(chip: string) {
    if (respondido) return;
    setOrdem((cur) => (cur.includes(chip) ? cur : [...cur, chip]));
  }
  function removerDaFila(idx: number) {
    if (respondido) return;
    setOrdem((cur) => cur.filter((_, i) => i !== idx));
  }

  function enviar() {
    if (!podeEnviar) return;
    const escolha: string | string[] = ehCompletar
      ? texto
      : ehArrastar
        ? ordem
        : (escolhaUnica as string);
    const acertou = conferir(exercicio, escolha);
    setResultado(acertou);
    onResponder(acertou);
  }

  // classe de uma alternativa de escolha única (multipla / caca-pista)
  function classeAlt(alt: string, base: string): string {
    const selecionada = escolhaUnica === alt;
    let cls = base;
    if (selecionada) cls += " selecionada";
    if (respondido) {
      if (exercicio.resposta === alt) cls += " correta";
      else if (selecionada) cls += " errada";
    }
    return cls;
  }

  // cada posição da fila do arrastar fica verde/vermelha após responder
  function classeFila(idx: number): string {
    let cls = "fila-item";
    if (respondido && Array.isArray(exercicio.resposta)) {
      cls += exercicio.resposta[idx] === ordem[idx] ? " correta" : " errada";
    }
    return cls;
  }

  const gabaritoTexto = Array.isArray(exercicio.resposta)
    ? exercicio.resposta.join("  →  ")
    : exercicio.resposta;

  return (
    <div className={"exercicio" + (resultado === false ? " shake" : "")}>
      <div className="exercicio-tags">
        <span className="tag tag-habilidade">{exercicio.habilidade}</span>
        <span className="tag tag-tipo">{rotuloTipo(tipo)}</span>
        <span className="tag tag-dif">
          {"★".repeat(exercicio.dificuldade)}
          <span className="tag-dif-off">{"★".repeat(3 - exercicio.dificuldade)}</span>
        </span>
        <span className="tag tag-xp">+{exercicio.xp} XP</span>
      </div>

      {exercicio.texto && <blockquote className="texto-base">{exercicio.texto}</blockquote>}

      <h2 className="enunciado">{exercicio.enunciado}</h2>

      {/* MÚLTIPLA ESCOLHA */}
      {ehMultipla && (
        <div className="alternativas">
          {exercicio.alternativas!.map((alt) => (
            <button
              key={alt}
              className={classeAlt(alt, "alternativa")}
              disabled={respondido}
              onClick={(e) => {
                fx(e);
                setEscolhaUnica(alt);
              }}
            >
              {alt}
            </button>
          ))}
        </div>
      )}

      {/* CAÇA-PISTA: trechos clicáveis (escolha única) */}
      {ehCacaPista && (
        <>
          {!respondido && <p className="dica-tipo">Clique no trecho que é a pista certa.</p>}
          <div className="trechos">
            {exercicio.alternativas!.map((alt) => (
              <button
                key={alt}
                className={classeAlt(alt, "trecho")}
                disabled={respondido}
                onClick={(e) => {
                  fx(e);
                  setEscolhaUnica(alt);
                }}
              >
                {alt}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ARRASTAR: montar sequência clicando nos chips */}
      {ehArrastar && (
        <div className="arrastar">
          <div className={"fila" + (ordem.length === 0 ? " vazia" : "")}>
            {ordem.length === 0 ? (
              <span className="fila-placeholder">Monte a sequência aqui ↓</span>
            ) : (
              ordem.map((chip, idx) => (
                <button
                  key={chip + idx}
                  className={classeFila(idx)}
                  disabled={respondido}
                  onClick={(e) => {
                    fx(e);
                    removerDaFila(idx);
                  }}
                  title={respondido ? "" : "Clique pra remover"}
                >
                  <span className="fila-num">{idx + 1}</span>
                  {chip}
                </button>
              ))
            )}
          </div>
          {!respondido && (
            <>
              <div className="chips">
                {chips
                  .filter((c) => !ordem.includes(c))
                  .map((chip) => (
                    <button
                      key={chip}
                      className="chip"
                      onClick={(e) => {
                        fx(e);
                        adicionarChip(chip);
                      }}
                    >
                      {chip}
                    </button>
                  ))}
              </div>
              <p className="dica-tipo">Clique nas peças na ordem certa. Clique numa peça da fila pra tirá-la.</p>
            </>
          )}
        </div>
      )}

      {/* COMPLETAR: campo de texto */}
      {ehCompletar && (
        <input
          className="campo-completar"
          type="text"
          placeholder="Digite sua resposta..."
          value={texto}
          disabled={respondido}
          autoFocus
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && podeEnviar) enviar();
          }}
        />
      )}

      {!respondido ? (
        <button
          className="btn-principal"
          disabled={!podeEnviar}
          onClick={(e) => {
            fx(e);
            enviar();
          }}
        >
          Confirmar
        </button>
      ) : (
        <div className={"feedback " + (resultado ? "ok" : "nao")}>
          <div className="feedback-titulo">
            {resultado ? "✅ Mandou bem, Guardião!" : "🔁 Quase! Isso volta pra revisão."}
          </div>
          {!resultado && (
            <div className="feedback-gabarito">
              Resposta certa: <strong>{gabaritoTexto}</strong>
            </div>
          )}
          <p className="feedback-explicacao">{exercicio.explicacao}</p>
          <button
            className="btn-principal"
            onClick={(e) => {
              fx(e);
              onProximo();
            }}
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}

function rotuloTipo(tipo: Exercicio["tipo"]): string {
  switch (tipo) {
    case "multipla":
      return "Escolha";
    case "completar":
      return "Complete";
    case "arrastar":
      return "Monte a ordem";
    case "caca-pista":
      return "Cace a pista";
  }
}
