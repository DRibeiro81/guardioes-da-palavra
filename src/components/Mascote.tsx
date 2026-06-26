import { useEffect, useState } from "react";

// O mascote agora é um MAGO com emoções reativas ao momento do aluno.
export type EstadoMascote =
  | "neutro"
  | "feliz"
  | "triste"
  | "impaciente"
  | "raiva";

type Props = {
  estado: EstadoMascote;
  // balão de fala opcional ao lado do mascote
  fala?: string;
  size?: number;
  className?: string;
};

// Emoji de fallback caso o SVG (public/mago-*.svg) não carregue — assim a tela
// nunca quebra por imagem faltando.
const FALLBACK: Record<EstadoMascote, string> = {
  neutro: "🧙",
  feliz: "😄",
  triste: "😢",
  impaciente: "😤",
  raiva: "😠",
};

export default function Mascote({ estado, fala, size = 96, className }: Props) {
  const src = `${import.meta.env.BASE_URL}mago-${estado}.svg`;
  const [erro, setErro] = useState(false);

  // ao trocar de estado, tenta carregar o SVG do novo estado de novo
  useEffect(() => {
    setErro(false);
  }, [estado]);

  return (
    <div className={"mascote-wrap" + (className ? " " + className : "")}>
      {fala && <div className="mascote-fala">{fala}</div>}
      <div
        className={"mascote mascote-" + estado}
        style={{ width: size, height: size }}
      >
        {erro ? (
          <span className="mascote-emoji" style={{ fontSize: size * 0.7 }}>
            {FALLBACK[estado]}
          </span>
        ) : (
          <img
            src={src}
            alt={"Mascote " + estado}
            width={size}
            height={size}
            onError={() => setErro(true)}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
