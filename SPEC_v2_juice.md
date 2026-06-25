# Guardiões da Palavra — Adendo v2: lúdico, animações e sons (juice)

Objetivo: deixar o jogo MUITO mais animado e divertido pra aluno de 13-14 anos.
Sem perder o conteúdo. Foco em reação imediata, recompensa visual e sonora.

## Regra anti-conflito (dono de arquivo)
- SOM (squad Áudio): cria SOMENTE src/sound.ts (novo, self-contained). Não edita componentes.
- MASCOTE (squad Ilustração): cria SOMENTE arquivos em public/ (SVGs). Não edita .tsx/.ts.
- ANIMAÇÃO/LEAD (squad Frontend): DONO de src/styles.css e de TODOS os componentes
  (App.tsx, components/*.tsx) + cria componentes novos (Confetti.tsx, Mascote.tsx).
  É quem IMPORTA e chama src/sound.ts e usa os SVGs do public/. Faz a costura.

## SOM — src/sound.ts (WebAudio, sintetizado, SEM arquivos externos)
Exportar funções: playClick(), playCorrect(), playWrong(), playLevelUp(),
playStreak(milestone:number), startMusic(), stopMusic(), setMuted(b:boolean),
isMuted(). Sons sintetizados via AudioContext (osciladores/envelopes) — acerto =
arpejo alegre subindo; erro = som suave grave, NADA punitivo; level up = fanfarra;
streak = sino. IMPORTANTE (política de autoplay): o AudioContext só pode iniciar
após o primeiro gesto do usuário — exporte resumeOnFirstGesture() e trate suspended.
Estado de mute persistido em localStorage. Ver lição WebAudio do projeto.

## MASCOTE — public/ (SVGs)
Criar um mascote simpático (ex: uma coruja/guardião do livro) em estados:
mascote-neutro.svg, mascote-feliz.svg, mascote-comemorando.svg, mascote-triste.svg,
mascote-pensando.svg. Estilo flat, colorido, traço amigável, fundo transparente,
mesmo enquadramento/tamanho (viewBox consistente) pra trocar sem "pular".

## ANIMAÇÃO/LEAD — onde aplicar o juice
Tela de seleção (TrackSelect): cards com hover/tap bounce, ícone animado, fundo
com gradiente animado e partículas leves, título com brilho/entrada. Mascote
dando "oi".
Ao ACERTAR: confete (Confetti.tsx), playCorrect(), mascote-comemorando, XP voando
pro HUD, flash verde suave. Ao ERRAR: shake no card, playWrong(), mascote-triste
encorajando ("quase! tenta de novo"), cor âmbar — nunca vermelho agressivo.
STREAK: chama/contador animado crescendo, playStreak nos marcos 3/5/10.
LEVEL UP: burst/modal rápido, playLevelUp(), mascote festeja.
Botões: ripple no clique + playClick. Transições suaves entre exercícios.
HUD: botão de MUTE (🔊/🔇) chamando setMuted; barra de XP que enche animada.
Respeitar prefers-reduced-motion (degradar animações). Manter responsivo e o
build passando (npm run build). Áudio só após 1º clique (resumeOnFirstGesture).

## Pós-convergência
O Lino rebuilda, redeploya no GitHub Pages e avisa no Telegram (@linohermes1_bot).
