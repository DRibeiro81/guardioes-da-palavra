# Guardiões da Palavra — Adendo v1: novas matérias (8º ano, base BNCC/MEC)

Adicionar 3 matérias além de Português (Verbos + Interpretação já existem):
Matemática, História e Inglês. Tudo 8º ano, alinhado à BNCC/MEC.

## Regra anti-conflito
Cada matéria nova fica em SEU PRÓPRIO arquivo (não mexer no exercicios.json):
- content/matematica.json
- content/historia.json
- content/ingles.json

Cada um é um ARRAY de Exercicio seguindo o MESMO contrato do SPEC.md original,
porém com o campo `trilha` novo (ver abaixo). Mínimo 12 exercícios por matéria,
dificuldade 1-3 variada, tipos variados (multipla/completar/arrastar/caca-pista),
campo `explicacao` que ENSINA (não só corrige). PT-BR, linguagem de 13-14 anos.
(Inglês: enunciados/explicação podem mesclar PT-BR pra orientar, conteúdo em EN.)

## Valores de `trilha` por matéria
- Matemática -> "matematica"
- História   -> "historia"
- Inglês     -> "ingles"

## Conteúdo BNCC 8º ano (referência MEC) por matéria
MATEMÁTICA (EF08MA*): números (dízimas, potências/notação científica, juros
simples/porcentagem), álgebra (equações/sistemas 1º grau, valor numérico),
geometria (ângulos, triângulos, congruência), grandezas (área/volume),
probabilidade e estatística (média, gráficos).
HISTÓRIA (EF08HI*): Iluminismo, Revolução Francesa, Independência dos EUA,
Revolução Industrial, Brasil — vinda da família real, Independência (1822),
Primeiro e Segundo Reinado, escravidão e resistência, abolição.
INGLÊS (EF08LI*): reading comprehension (textos curtos), simple past x present
perfect, comparatives/superlatives, modal verbs, vocabulário temático,
interpretação de pequenos diálogos/anúncios.

## Frontend (squad de integração)
- Estender o type Trilha em src/types.ts para incluir matematica|historia|ingles.
- Importar os 3 novos JSON em App.tsx e concatenar com o banco atual.
- Atualizar src/components/TrackSelect.tsx: mostrar os cards novos (ícone, cor,
  nome da matéria), mantendo Verbos e Interpretação. Visual de jogo, responsivo.
- Engine (montarFila/filtro por trilha) deve funcionar genérico — validar.
- Garantir npm run build passando com TODAS as matérias.
NÃO faça deploy — o Lino (orquestrador) cuida do deploy e do aviso.
