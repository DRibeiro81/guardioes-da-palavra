import { useEffect, useState } from "react";

export type EstadoMascote =
  | "neutro"
  | "feliz"
  | "comemorando"
  | "triste"
  | "pensando"
  | "impaciente"
  | "raiva";

type Props = {
  estado: EstadoMascote;
  // balão de fala opcional ao lado do mascote
  fala?: string;
  size?: number;
  className?: string;
};

// Emoji de fallback caso o SVG do squad Ilustração (public/mascote-*.svg) ainda
// não exista — assim o build e a tela nunca quebram por imagem faltando.
const FALLBACK: Record<EstadoMascote, string> = {
  neutro: "🦉",
  feliz: "🦉",
  comemorando: "🎉",
  triste: "🥺",
  pensando: "🤔",
  impaciente: "😤",
  raiva: "😠",
};

export default function Mascote({ estado, fala, size = 96, className }: Props) {
  const src = `${import.meta.env.BASE_URL}mascote-${estado}.svg`;
  const [erro, setErro] = useState(false);

  // ao trocar de estado, tenta de novo carregar o SVG (o squad pode ter
  // entregado o arquivo nesse meio tempo)
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
