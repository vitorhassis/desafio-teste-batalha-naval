# Desafio de testes: Batalha Naval

Implementação em JavaScript de uma partida de Batalha Naval 10 x 10 para dois jogadores, com uma suíte de testes automatizados em Jest (57 testes, 100% de cobertura).

## Colaboradores

- Vitor Hugo Assis da Silva — RA: 24140023-2
- Fernando Queiroz — RA: 24038237-2

## Regras

- O tabuleiro de cada jogador tem 10 x 10 posições.
- Cada jogador tem uma frota de 4 navios, que ocupam 14 casas no total:

  | Navio | Casas |
  | --- | --- |
  | porta-aviões | 5 |
  | encouraçado | 4 |
  | submarino | 3 |
  | destroier | 2 |

- Os navios ocupam casas consecutivas na horizontal ou na vertical, a partir da casa informada (para a direita ou para baixo). Eles precisam caber no tabuleiro, podem ficar encostados, mas não podem se sobrepor, e cada tipo só pode ser posicionado uma vez.
- Também é possível posicionar a frota de forma aleatória (`posicionarAleatoriamente`), completando os navios que ainda não foram posicionados.
- A partida passa pelas fases `posicionamento`, `jogando` e `fim`. Ela começa quando os dois jogadores têm a frota completa, e o jogador 1 joga primeiro.
- Cada tiro é dado no tabuleiro do adversário e a vez passa para ele depois de qualquer tiro válido. O resultado é `agua`, `acertou` ou `afundou` (com o navio afundado).
- Atirar duas vezes na mesma casa é erro e não faz a vez passar.
- Vence quem afundar todos os navios do adversário.

## Estrutura

```
.
├── .github/workflows/testes.yml   # CI: roda npm ci e npm test
├── src/batalhaNaval.js            # classes Tabuleiro e Jogo
├── tests/
│   ├── helpers.js                 # gerador pseudoaleatório determinístico por semente
│   └── batalhaNaval.test.js       # testes unitários e de partida
└── package.json
```

### Testes

- Frota e tabuleiro, posicionamento dos navios, tiros, situação da frota e partida para 2 jogadores.
- Posicionamento aleatório: usa o gerador por semente de `tests/helpers.js`. Com 200 sementes, verifica que a frota sempre fica completa, sem sobreposição e com navios em linha reta. Também verifica que a mesma semente gera sempre a mesma disposição e que sementes diferentes geram disposições diferentes.

## Instalação

Requer [Node.js](https://nodejs.org/) 18 ou superior.

```bash
npm ci
```

## Execução

```bash
npm test
```

O comando roda o Jest com relatório de cobertura. O projeto exige 100% de cobertura (instruções, ramos, funções e linhas); se ficar abaixo disso, o comando falha. O relatório HTML é gerado na pasta `coverage/`.

## Integração contínua

O workflow `.github/workflows/testes.yml` executa `npm ci` e `npm test` a cada push e pull request.

## Licença

MIT
