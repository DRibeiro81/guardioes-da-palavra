# Guardiões da Palavra — Adendo v3: timer, urgência e bônus de velocidade

Objetivo: mais emoção. Tempo por pergunta, som de relógio na reta final e
pontuação que premia rapidez. Manter o jogo divertido, não estressante demais.

## Regra anti-conflito (dono de arquivo)
- SOM (squad Áudio): edita SOMENTE src/sound.ts. Adiciona:
  - startTick() / stopTick(): som de relógio/tique-taque em loop, urgente mas não
    irritante; respeita o mute global existente.
  - playTimeout(): som curto de "tempo esgotado" (nada agressivo).
  Não mexe em componentes.
- GAMEPLAY/LEAD (squad Frontend): dono de Exercise.tsx, engine.ts (pontuação),
  HUD.tsx, styles.css e App.tsx se preciso. Importa src/sound.ts.

## Comportamento do TIMER (Exercise.tsx)
- 60 segundos por pergunta, começa quando a pergunta aparece.
- Indicador visual: anel circular OU barra no topo que esvazia. Cor muda:
  verde (60-30s) -> amarelo (30-15s) -> vermelho (15-0s).
- Aos 15s restantes: chamar startTick() + barra/anel pulsando em vermelho.
  Ao responder ou trocar de pergunta: stopTick() SEMPRE (não vazar som).
- Aos 0s: tempo esgotado -> playTimeout(), trata como ERRADA (sem bônus), revela a
  explicacao, mascote triste/encorajando, botao "continuar". Mostrar contador de
  tempo gasto pra feedback.

## Pontuação por VELOCIDADE (engine.ts + onde soma XP)
- Acerto: pontos = base + round(base * (segundosRestantes / 60)).
  Ex.: base 10, respondeu com 48s restantes -> 10 + round(10*0.8)=18.
- Mostrar na hora "+X" e, se segundosRestantes >= 45, selo "RÁPIDO!"; >=55 "VOANDO!".
- Erro ou timeout: sem bônus de velocidade (XP do erro segue a regra atual).
- Persistir total no progresso (localStorage) como já é hoje.

## Toque de EMOÇÃO (lead, sem exagerar)
- Flash/burst extra quando ganha bônus alto. Mensagem de incentivo curta.
- Combo: acertos rápidos seguidos podem reforçar a chama de streak já existente.
- prefers-reduced-motion: reduzir flashes; timer continua funcional.

## Cuidados técnicos
- Limpar timers no unmount/troca de pergunta (sem setInterval vazando).
- stopTick() em TODO caminho de saída (acerto, erro, timeout, desmontar).
- Build tem que passar (npm run build). Áudio respeita autoplay (resumeOnFirstGesture).

## Pós-convergência
Lino rebuilda, redeploya no GitHub Pages e avisa no Telegram (@linohermes1_bot).
