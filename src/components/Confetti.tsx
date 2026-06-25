import { useEffect, useMemo, useState } from "react";

type Props = {
  // contador: cada incremento dispara uma nova chuva de confete
  fire: number;
  pieces?: number;
};

const CORES = [
  "#ffd54f",
  "#ff8a3d",
  "#2bd47a",
  "#7c4dff",
  "#2196f3",
  "#ff6fae",
  "#ffffff",
];

function reduzMovimento(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// Chuva de confete CSS leve. Não usa libs: gera N peças com posição/cor/atraso
// pseudo-aleatórios e se limpa sozinha após a animação. Em prefers-reduced-motion
// não renderiza nada (o feedback de cor/som já cobre a recompensa).
export default function Confetti({ fire, pieces = 70 }: Props) {
  const [ativo, setAtivo] = useState(false);

  const reduz = useMemo(() => reduzMovimento(), []);

  const pecas = useMemo(() => {
    return Array.from({ length: pieces }, (_, i) => {
      // semente determinística por índice — varia o suficiente visualmente
      const r = (n: number) => ((Math.sin((i + 1) * 99.7 + n) + 1) / 2);
      const left = r(1) * 100;
      const cor = CORES[Math.floor(r(2) * CORES.length)];
      const atraso = r(3) * 0.35;
      const dur = 1.1 + r(4) * 0.9;
      const giro = (r(5) * 720 - 360).toFixed(0);
      const tam = 7 + Math.round(r(6) * 8);
      const desvio = (r(7) * 120 - 60).toFixed(0);
      const redondo = r(8) > 0.6;
      return { left, cor, atraso, dur, giro, tam, desvio, redondo, i };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, fire]);

  useEffect(() => {
    if (fire === 0 || reduz) return;
    setAtivo(true);
    const t = setTimeout(() => setAtivo(false), 2200);
    return () => clearTimeout(t);
  }, [fire, reduz]);

  if (!ativo || reduz) return null;

  return (
    <div className="confete" aria-hidden="true">
      {pecas.map((p) => (
        <span
          key={p.i}
          className="confete-peca"
          style={{
            left: `${p.left}%`,
            background: p.cor,
            width: `${p.tam}px`,
            height: `${p.tam * (p.redondo ? 1 : 1.6)}px`,
            borderRadius: p.redondo ? "50%" : "2px",
            animationDelay: `${p.atraso}s`,
            animationDuration: `${p.dur}s`,
            // @ts-expect-error custom props p/ CSS
            "--giro": `${p.giro}deg`,
            "--desvio": `${p.desvio}px`,
          }}
        />
      ))}
    </div>
  );
}
