import { useEffect, useRef, useState } from "react";
import type { Progresso } from "../types";
import { xpDoNivel } from "../storage";

type Props = {
  progresso: Progresso;
  muted: boolean;
  onToggleMute: () => void;
  onSair?: () => void;
};

export default function HUD({ progresso, muted, onToggleMute, onSair }: Props) {
  const baseNivel = xpDoNivel(progresso.nivel);
  const proxNivel = xpDoNivel(progresso.nivel + 1);
  const faixa = Math.max(1, proxNivel - baseNivel);
  const pct = Math.min(100, Math.round(((progresso.xp - baseNivel) / faixa) * 100));

  // pop rápido na ofensiva quando ela cresce
  const [subiu, setSubiu] = useState(false);
  const anterior = useRef(progresso.streak);
  useEffect(() => {
    if (progresso.streak > anterior.current) {
      setSubiu(true);
      const t = setTimeout(() => setSubiu(false), 500);
      anterior.current = progresso.streak;
      return () => clearTimeout(t);
    }
    anterior.current = progresso.streak;
  }, [progresso.streak]);

  return (
    <header className="hud">
      <div className="hud-bloco hud-nivel" title="Nível do guardião">
        <span className="hud-emblema">🛡️</span>
        <div className="hud-nivel-info">
          <span className="hud-label">Nível {progresso.nivel}</span>
          <div className="hud-barra">
            <div className="hud-barra-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="hud-bloco" title="Experiência acumulada">
        <span className="hud-emblema">⭐</span>
        <span className="hud-valor">{progresso.xp}</span>
        <span className="hud-mini">XP</span>
      </div>

      <div
        className={
          "hud-bloco hud-streak" +
          (progresso.streak > 0 ? " ativa" : "") +
          (subiu ? " subiu" : "")
        }
        title="Ofensiva: acertos seguidos"
      >
        <span className="hud-emblema">🔥</span>
        <span className="hud-valor">{progresso.streak}</span>
        <span className="hud-mini">ofensiva</span>
      </div>

      <button
        className={"hud-mute" + (muted ? " mudo" : "")}
        onClick={onToggleMute}
        title={muted ? "Ativar som" : "Desativar som"}
        aria-label={muted ? "Ativar som" : "Desativar som"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {onSair && (
        <button className="hud-sair" onClick={onSair} title="Voltar às trilhas">
          ✕
        </button>
      )}
    </header>
  );
}
