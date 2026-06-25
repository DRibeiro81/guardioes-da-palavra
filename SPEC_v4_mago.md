# Guardiões da Palavra — Adendo v4: trocar mascote por um MAGO reativo

Substituir a coruja por um MAGO com 4 emoções (+ neutro) que mudam conforme o
momento do aluno no app.

## Regra anti-conflito (dono de arquivo)
- ILUSTRADOR (squad Arte): cria SOMENTE os SVGs do mago em public/. Não edita código.
- FRONTEND (squad): dono de src/components/Mascote.tsx e dos call sites
  (App.tsx, Exercise.tsx, TrackSelect.tsx). Religa os estados.

## SVGs do MAGO (public/) — mesmo viewBox/enquadramento nos 5
- mago-neutro.svg       (calmo, sorriso leve, cajado — estado base)
- mago-feliz.svg        (radiante, cajado brilhando, faíscas)
- mago-triste.svg       (cabisbaixo, cajado apagado)
- mago-impaciente.svg   (braços cruzados / batendo o pé, sobrancelha erguida, olhar no relógio)
- mago-raiva.svg        (cenho franzido, fumaça/vermelho, cajado faiscando)
Estilo: flat, colorido, amigável (não assustador), chapéu de mago com estrelas,
fundo transparente. Carisma pra criança de 13-14 anos. Consistência entre estados
(mesmo personagem, só muda a expressão/pose) pra trocar sem "pular".

## Frontend — Mascote.tsx
- Trocar o type de estado para: "neutro" | "feliz" | "triste" | "impaciente" | "raiva".
- src = `${import.meta.env.BASE_URL}mago-${estado}.svg`.
- Remover referências aos SVGs antigos da coruja (mascote-*.svg) nos componentes.

## Mapeamento momento -> emoção (call sites)
- Tela de seleção / ocioso: neutro.
- ACERTOU / level up / streak: feliz.
- ERROU a resposta: triste.
- Reta final do timer (<=15s restantes, enquanto não respondeu): impaciente.
- TEMPO ESGOTADO (timeout) OU 2+ erros seguidos: raiva.
  (Sugestão de fala da raiva: encorajadora-bravinha, ex: "Foco, aprendiz! O tempo
   voou!" — nunca ofensiva.)
- Falas curtas combinando com a emoção, sempre gentis.

## Cuidados
- Não quebrar o timer/bônus já existentes. Build tem que passar (npm run build).
- prefers-reduced-motion: ok, é troca de imagem.
- Pode apagar os arquivos public/mascote-*.svg antigos da coruja (opcional, mas
  remover as referências no código é obrigatório).

## Pós-convergência
Lino rebuilda, redeploya no GitHub Pages e avisa no Telegram (@linohermes1_bot).
