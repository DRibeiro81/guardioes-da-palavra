# Guardiões da Palavra — Game Design (v0)

Documento de design do protótipo. Tudo aqui é implementável com React + localStorage,
sem backend. Onde cito chaves de storage, tipos ou campos, é pra o Lucas consumir direto.

Glossário rápido:
- **Guardião** = o jogador.
- **Trilha** = Verbos ou Interpretação.
- **Exercício** = uma questão (contrato `Exercicio` do SPEC).
- **Ofensiva (streak)** = acertos seguidos dentro da sessão.
- **Fragmento** = item na fila de repetição espaçada (um exercício errado que vai voltar).

---

## 1. Loop de sessão de 5 minutos (passo a passo)

Uma sessão é uma "missão de reparo". Meta: ~8 a 10 exercícios em ~5 min (média 30s cada,
com folga pra ler texto na trilha de interpretação). A sessão é **curta de propósito** —
quando bate a meta de tempo OU de exercícios, o jogo encerra a missão e mostra resultado.

Passo a passo do que acontece em runtime:

1. **Entrada (tela de seleção de trilha).** O Guardião escolhe Verbos ou Interpretação.
   Autonomia primeiro: nada começa sem ele escolher. Se houver fragmentos vencidos
   (revisões devidas), a trilha mostra um selo "⚠ N reparos pendentes".

2. **Abertura da missão (300ms, sem clique).** Card curto de narrativa:
   "Setor [Trilha] está corrompido. Restaure 8 trechos." Define o objetivo da sessão.

3. **Montagem da fila da sessão (lógica, invisível).** O motor monta 8–10 exercícios:
   - Primeiro insere **fragmentos vencidos** dessa trilha (revisão espaçada — ver §3),
     no máximo 3 logo no início pra não afogar.
   - Completa o resto com exercícios **novos** da trilha, escolhidos pela dificuldade
     adaptativa atual (ver §4).
   - Nunca repete o mesmo `id` duas vezes na mesma sessão.

4. **Ciclo do exercício (repete 8–10x):**
   a. Mostra o exercício (tipo `multipla` / `arrastar` / `caca-pista` / `completar`).
   b. Guardião responde. Resposta é **trancada** ao confirmar (sem trocar depois).
   c. **Feedback imediato** (estado de vitória ou de erro):
      - Acerto → animação de "trecho restaurado", sino curto, soma XP, +1 ofensiva,
        mostra `explicacao` como reforço ("por que está certo").
      - Erro → SEM punição visual agressiva. Texto continua "corrompido", mostra a
        resposta certa + `explicacao`, zera a ofensiva, agenda fragmento (ver §3).
   d. Botão **Continuar** (ou avança sozinho em 1.2s no acerto; no erro espera o clique
      pra dar tempo de ler a explicação).

5. **Checagem de fim de missão** (após cada exercício): encerra quando atingir
   `META_EXERCICIOS` (8) **ou** `META_TEMPO` (5 min) — o que vier primeiro. Se o tempo
   estourar no meio de um exercício, deixa terminar o atual e encerra.

6. **Tela de resultado.** Resumo: XP ganho, ofensiva máxima da sessão, acertos/total,
   barra de progresso de nível, e quantos fragmentos ficaram agendados pra revisão.
   CTAs: "Nova missão" (volta pro passo 1) e "Trocar de trilha".

7. **Persistência.** Tudo que mudou (XP, nível, fila de repetição, dificuldade por trilha,
   estatísticas) é salvo no localStorage ao fim de cada exercício (não só no fim — se o
   aluno fechar a aba no meio, não perde progresso).

Constantes do loop (deixar num `config.ts`):
```ts
export const META_EXERCICIOS = 8;
export const META_TEMPO_MS = 5 * 60 * 1000;
export const MAX_REVISOES_NO_INICIO = 3;
export const AVANCO_AUTO_ACERTO_MS = 1200;
```

---

## 2. Economia de XP e curva de níveis

### XP por exercício
O campo `xp` já vem no exercício (definido pelo Felipe). O motor aplica **modificadores**
em cima desse valor base:

| Evento | Modificador | Racional |
|---|---|---|
| Acerto de primeira | `xp` cheio | recompensa padrão |
| Acerto com ofensiva ≥ 3 | `xp × 1.5` (arredonda pra baixo) | recompensa consistência |
| Acerto com ofensiva ≥ 6 | `xp × 2.0` | "no fogo", reforça flow |
| Erro | `0 XP` | não pune tirando XP — só não ganha |
| Acerto num **fragmento de revisão** | `xp × 1.25` | premia fechar dívida de aprendizado |

Bônus de fim de missão:
- **Missão completa** (chegou aos 8): `+20 XP`.
- **Missão perfeita** (8/8 sem erro): `+50 XP` extra.

> Regra de ouro: erro **nunca** subtrai XP. Pesquisa de motivação (princípio do SPEC):
> errar agenda revisão, não castiga.

### Curva de níveis
Curva levemente crescente (não linear pura, pra dar sensação de progresso rápido cedo e
desafio depois). XP **acumulado** necessário pra atingir o nível N:

```
xpParaNivel(N) = 50 * N * (N + 1) / 2     // soma triangular escalada por 50
```

Tabela prática (XP total acumulado):

| Nível | XP acumulado p/ alcançar | Custo do nível |
|---|---|---|
| 1 | 0 | — |
| 2 | 100 | 100 |
| 3 | 250 | 150 |
| 4 | 450 | 200 |
| 5 | 700 | 250 |
| 6 | 1000 | 300 |
| 7 | 1350 | 350 |
| 8 | 1750 | 400 |

Cálculo de nível atual a partir do XP total (implementável direto):
```ts
export function nivelDoXp(xpTotal: number): number {
  let n = 1;
  while (50 * (n + 1) * (n + 2) / 2 <= xpTotal) n++;
  return n;
}
```

### Patentes (rótulo do nível — narrativa)
Dá identidade ao número. Mapeamento por faixa:

| Nível | Patente |
|---|---|
| 1–2 | Aprendiz da Palavra |
| 3–4 | Guardião Júnior |
| 5–6 | Guardião |
| 7–8 | Guardião Sênior |
| 9+ | Mestre da Palavra |

Subir de nível dispara um card de celebração ("Você virou **Guardião Júnior**!") na tela
de resultado — nunca interrompe o meio da sessão.

---

## 3. Repetição espaçada (regra concreta)

Cada exercício **errado** vira um **fragmento** numa fila persistente. Cada fragmento tem
um "nível de revisão" que define **daqui a quantas sessões** ele volta.

### Estrutura no localStorage
```ts
type Fragmento = {
  exercicioId: string;
  trilha: "verbos" | "interpretacao";
  nivelRevisao: number;     // 0,1,2,3,4 — índice nos intervalos abaixo
  voltaNaSessao: number;    // contador global de sessões em que deve reaparecer
};
// chave: "gp.fila_revisao" -> Fragmento[]
// chave: "gp.contador_sessoes" -> number (incrementa a cada missão iniciada)
```

### Intervalos (em SESSÕES, não em dias — protótipo sem login diário)
```ts
export const INTERVALOS_REVISAO = [1, 2, 4, 8, 16];
// nivelRevisao 0 -> volta na próxima sessão (1)
// nivelRevisao 1 -> volta daqui a 2 sessões
// nivelRevisao 2 -> daqui a 4
// nivelRevisao 3 -> daqui a 8
// nivelRevisao 4 -> daqui a 16 (praticamente "aprendido")
```

### Regras de transição (a parte que importa)

**Ao ERRAR um exercício novo:**
- Cria fragmento com `nivelRevisao = 0`.
- `voltaNaSessao = contadorSessoesAtual + INTERVALOS_REVISAO[0]` (= próxima sessão).

**Ao acertar um fragmento que voltou (revisão bem-sucedida):**
- Sobe um nível: `nivelRevisao = min(nivelRevisao + 1, 4)`.
- Reagenda: `voltaNaSessao = contadorSessoesAtual + INTERVALOS_REVISAO[novoNivel]`.
- Se já estava no nível 4 e acertou → **remove da fila** (considerado dominado).

**Ao errar de novo um fragmento que voltou (recaída):**
- **Desce** um nível: `nivelRevisao = max(nivelRevisao - 1, 0)`.
- Reagenda com o intervalo do nível rebaixado. Volta a aparecer mais cedo.

**Quando um fragmento entra na sessão:** só entram fragmentos com
`voltaNaSessao <= contadorSessoesAtual` e da trilha escolhida. Máximo 3 por sessão
(o resto fica pra próxima — não trava o aluno num muro de revisões).

Exemplo de vida de um fragmento (aluno errou "EF08LP08 voz passiva" na sessão 3):
```
sessão 3: errou        -> nível 0, volta na sessão 4
sessão 4: acertou       -> nível 1, volta na sessão 6
sessão 6: acertou       -> nível 2, volta na sessão 10
sessão 10: ERROU         -> nível 1 (rebaixou), volta na sessão 12
sessão 12: acertou       -> nível 2, volta na sessão 16
... até acertar no nível 4 -> sai da fila (dominado)
```

---

## 4. Ofensiva (streak) e dificuldade adaptativa

### Ofensiva (streak da sessão)
- `+1` a cada acerto consecutivo. Zera em qualquer erro.
- É **da sessão** (não persiste de uma missão pra outra como "vida ou morte"; persistimos
  só a **maior ofensiva histórica** pra exibir como recorde).
- HUD mostra "🔥 N" e dá micro-feedback ao cruzar marcos (3, 6, 10): "Em chamas!".
- Efeito mecânico: multiplicador de XP (ver §2) e gatilho da dificuldade (abaixo).

### Dificuldade adaptativa (por trilha, persistida)
Mantemos um **nível de dificuldade atual por trilha** (`1 | 2 | 3`, casando com o campo
`dificuldade` do exercício). Começa em 1.

```ts
// chave: "gp.dificuldade" -> { verbos: 1, interpretacao: 1 }
export const SOBE_APOS_ACERTOS = 3;   // 3 acertos seguidos no nível atual
export const DESCE_APOS_ERROS = 2;    // 2 erros nas últimas 3 respostas
```

**Sobe** (fica mais difícil) quando:
- O aluno acerta **3 seguidos** em exercícios do nível de dificuldade atual →
  `dificuldade = min(dificuldade + 1, 3)`. Reseta o contador de acertos do nível.

**Desce** (alivia) quando:
- O aluno erra **2 das últimas 3** respostas → `dificuldade = max(dificuldade - 1, 1)`.
  Princípio "competência": nunca deixa o aluno preso num muro.

**Como isso alimenta a fila da sessão (§1, passo 3):** ao escolher exercícios **novos**,
o motor prefere os de `dificuldade == nivelAtualDaTrilha`. Se não houver suficientes,
pega do nível adjacente mais próximo (preferindo o mais fácil). Fragmentos de revisão
**ignoram** a dificuldade adaptativa (eles voltam no nível em que estão).

Mini-tabela de decisão (avaliada após cada resposta):
| Situação | Ação |
|---|---|
| 3 acertos seguidos no nível atual | dificuldade +1 (até 3) |
| 2 erros nas últimas 3 | dificuldade −1 (até 1) |
| caso contrário | mantém |

---

## 5. Copy da narrativa

Tom: leve, encorajador, "companheiro de jornada". Nunca infantiliza, nunca humilha.
Frases curtas. Sem termos em inglês na UI.

### Quem é o Guardião (mostrar no onboarding, 1x)
> "Você é um **Guardião da Palavra**. As palavras seguram o mundo no lugar — e elas estão
> sendo corrompidas. Verbos trocados, sentidos embaralhados, frases que perderam o eixo.
> Sua missão: restaurar cada trecho lendo com atenção e devolvendo a palavra certa ao
> lugar certo. Cada reparo te deixa mais forte."

### O que são os textos corrompidos (contexto das trilhas)
- **Trilha Verbos:** "Aqui a **conjugação** se desfez. Tempos e modos se misturaram, a
  concordância quebrou. Recoloque cada verbo no seu tempo."
- **Trilha Interpretação:** "Aqui o **sentido** está embaçado. A ideia central sumiu nas
  entrelinhas. Leia, infira e reencontre o que o texto realmente diz."

### Falas de abertura de missão (rotaciona)
- "Setor corrompido detectado. Bora restaurar."
- "8 trechos quebrados. Você dá conta."
- "Respira. Lê com calma. A palavra certa aparece."

### Falas de ACERTO (motivam, celebram — rotaciona)
- "Restaurado. ✨ A frase voltou a fazer sentido."
- "Isso! Trecho consertado."
- "Mandou bem. O sentido voltou ao lugar."
- "Preciso. Era exatamente essa palavra."
- (com ofensiva ≥ 3) "Sequência limpa! 🔥 Continua assim."
- (acerto em revisão) "Você lembrou! Esse aqui já tinha te escapado antes. 👏"

### Falas de ERRO (acolhem, ensinam, NUNCA humilham — rotaciona)
- "Quase. A palavra certa era esta — olha o porquê:"
- "Esse trecho é traiçoeiro. Sem stress, anota o motivo:"
- "Não foi dessa vez — mas agora você viu como funciona. Volta pra você revisar."
- "Tudo bem errar aqui: é assim que a gente aprende. Veja a correção:"

> Princípio firme: na fala de erro **nunca** usar "errado", "falhou", "você não sabe".
> Sempre emendar com a explicação e lembrar que o exercício **volta** (não é o fim).

### Fim de missão (rotaciona por desempenho)
- Perfeita (8/8): "Missão impecável. Nenhum trecho resistiu a você. 🛡️"
- Boa (≥6): "Setor bem mais restaurado do que estava. Bom trabalho, Guardião."
- Difícil (<6): "Setor parcialmente restaurado. Os trechos difíceis voltam — e você
  volta mais forte."
- Subiu de nível: "Você evoluiu pra **{patente}**. As palavras agradecem."

---

## 6. Wireframes textuais das telas

### Tela A — Seleção de trilha (home)
```
┌──────────────────────────────────────────────┐
│  🛡️  GUARDIÕES DA PALAVRA                       │
│                                                │
│  Guardião Júnior · Nível 3      🔥 recorde: 7  │
│  XP 250/450  [██████░░░░░░░░░░]                 │
│                                                │
│  Escolha um setor pra restaurar:               │
│                                                │
│  ┌────────────────────┐  ┌───────────────────┐ │
│  │  ⚙️ VERBOS          │  │  📖 INTERPRETAÇÃO  │ │
│  │  Conjugação, vozes  │  │  Sentido, inferênc.│ │
│  │  ⚠ 2 reparos pend.  │  │  ✓ em dia          │ │
│  │     [ RESTAURAR ]   │  │     [ RESTAURAR ]  │ │
│  └────────────────────┘  └───────────────────┘ │
└──────────────────────────────────────────────┘
```
Elementos: HUD de nível/patente/XP no topo (vem do localStorage), recorde de ofensiva,
dois cards de trilha. Selo "⚠ N reparos pendentes" = fragmentos vencidos daquela trilha.

### Tela B — Exercício (durante a missão)
```
┌──────────────────────────────────────────────┐
│  ⚙️ VERBOS   ·   3/8        🔥 4    +XP: 32     │ ← HUD: trilha, progresso, ofensiva, xp sessão
│  [████████░░░░░░░░░]  tempo da missão           │
│                                                │
│  (texto-base, se houver — trilha interpretação)│
│  "Quando o sino tocou, todos já haviam ..."    │
│                                                │
│  ENUNCIADO:                                    │
│  Complete com o verbo no tempo correto:        │
│                                                │
│  ( ) tinham saído                              │ ← tipo "multipla": alternativas[]
│  ( ) saíram                                    │   tipo "completar": campo de texto
│  ( ) sairiam                                   │   tipo "arrastar": fichas arrastáveis
│  ( ) saiam                                     │   tipo "caca-pista": clicar trecho no texto
│                                                │
│              [ CONFIRMAR ]                      │ ← trava a resposta
└──────────────────────────────────────────────┘
```
Estado pós-confirmar (mesma tela, painel de feedback sobe):
```
│  ┌──────────────────────────────────────────┐ │
│  │ ✨ Restaurado!  +32 XP   🔥 5             │ │ ← acerto
│  │ "tinham saído" — pretérito mais-que-perf. │ │   (explicacao do exercício)
│  │ composto: ação anterior a outra no passado│ │
│  │                          [ CONTINUAR ]    │ │
│  └──────────────────────────────────────────┘ │
```
ou, no erro:
```
│  ┌──────────────────────────────────────────┐ │
│  │ Quase. A certa era "tinham saído".        │ │ ← erro: acolhe, não humilha
│  │ Por quê: ação concluída antes de outra no │ │   mostra resposta certa + explicacao
│  │ passado pede mais-que-perfeito composto.  │ │
│  │ ↻ Esse trecho volta pra você revisar.     │ │   avisa que vira fragmento
│  │                          [ CONTINUAR ]    │ │
│  └──────────────────────────────────────────┘ │
```

### Tela C — Resultado da missão
```
┌──────────────────────────────────────────────┐
│  🛡️  MISSÃO CONCLUÍDA                           │
│                                                │
│  Setor VERBOS restaurado                       │
│                                                │
│   Acertos        7 / 8                         │
│   XP ganho       +218                          │
│   Maior ofensiva 🔥 6                           │
│   Reparos agendados   ↻ 1                       │
│                                                │
│  Nível 3 → 4   [████████████░░░]  90 p/ subir   │
│                                                │
│  "Setor bem mais restaurado do que estava.     │
│   Bom trabalho, Guardião."                     │
│                                                │
│   [ NOVA MISSÃO ]      [ TROCAR DE TRILHA ]    │
└──────────────────────────────────────────────┘
```
Se subiu de nível, aparece antes dos botões um card:
"🎉 Você evoluiu pra **Guardião Júnior**!"

---

## Resumo das chaves de localStorage (pro Lucas)
```ts
"gp.xpTotal"          // number
"gp.dificuldade"      // { verbos: 1|2|3, interpretacao: 1|2|3 }
"gp.fila_revisao"     // Fragmento[]
"gp.contador_sessoes" // number
"gp.recorde_ofensiva" // number
"gp.stats"            // { totalRespostas, totalAcertos, missoesCompletas }
```
Tudo gravado ao fim de cada exercício (não só no fim da missão).
```
```
