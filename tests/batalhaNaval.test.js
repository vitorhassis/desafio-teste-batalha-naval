const { Tabuleiro, Jogo, FROTA, TAMANHO } = require('../src/batalhaNaval');
const { aleatorioComSemente } = require('./helpers');

// Posicoes usadas nos testes: todos na horizontal, a partir da coluna 0, nas linhas 0, 2, 4 e 6.
const LAYOUT = [
  ['porta-avioes', 0, 0],
  ['encouracado', 2, 0],
  ['submarino', 4, 0],
  ['destroier', 6, 0],
];

function posicionarFrota(tabuleiro) {
  LAYOUT.forEach(([tipo, l, c]) => tabuleiro.posicionar(tipo, l, c, 'horizontal'));
}

function todasAsPosicoes() {
  const lista = [];
  for (let l = 0; l < TAMANHO; l++) {
    for (let c = 0; c < TAMANHO; c++) lista.push([l, c]);
  }
  return lista;
}

function posicoesOcupadas(tabuleiro) {
  return todasAsPosicoes().filter(([l, c]) => tabuleiro.celula(l, c).navio !== null);
}

// Posicoes ocupadas pelos navios de LAYOUT (14 celulas).
function celulasDoLayout() {
  const lista = [];
  LAYOUT.forEach(([tipo, l, c]) => {
    for (let i = 0; i < FROTA[tipo]; i++) lista.push([l, c + i]);
  });
  return lista;
}

describe('Frota e tabuleiro 10 x 10', () => {
  test('o tabuleiro tem 10 x 10 posicoes', () => {
    expect(TAMANHO).toBe(10);
    expect(todasAsPosicoes()).toHaveLength(100);
  });

  test('a frota tem 1 porta-avioes (5), 1 encouracado (4), 1 submarino (3) e 1 destroier (2)', () => {
    expect(FROTA).toEqual({ 'porta-avioes': 5, encouracado: 4, submarino: 3, destroier: 2 });
  });

  test('a frota ocupa 14 casas no total', () => {
    const total = Object.values(FROTA).reduce((soma, tamanho) => soma + tamanho, 0);
    expect(total).toBe(14);
  });

  test('um tabuleiro novo so tem agua, nenhum tiro e frota incompleta', () => {
    const tabuleiro = new Tabuleiro();
    expect(posicoesOcupadas(tabuleiro)).toHaveLength(0);
    expect(todasAsPosicoes().every(([l, c]) => !tabuleiro.celula(l, c).atingida)).toBe(true);
    expect(tabuleiro.frotaCompleta()).toBe(false);
    expect(tabuleiro.navios()).toEqual([]);
  });
});

describe('Posicionamento dos navios', () => {
  test('um navio na horizontal ocupa casas consecutivas na mesma linha', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar('porta-avioes', 3, 2, 'horizontal');
    expect(posicoesOcupadas(tabuleiro)).toEqual([[3, 2], [3, 3], [3, 4], [3, 5], [3, 6]]);
    expect(tabuleiro.celula(3, 2).navio).toBe('porta-avioes');
  });

  test('um navio na vertical ocupa casas consecutivas na mesma coluna', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar('encouracado', 1, 7, 'vertical');
    expect(posicoesOcupadas(tabuleiro)).toEqual([[1, 7], [2, 7], [3, 7], [4, 7]]);
  });

  test.each([
    ['porta-avioes', 5],
    ['encouracado', 4],
    ['submarino', 3],
    ['destroier', 2],
  ])('o %s ocupa %i casas', (tipo, tamanho) => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar(tipo, 0, 0, 'horizontal');
    expect(posicoesOcupadas(tabuleiro)).toHaveLength(tamanho);
  });

  test('o navio pode encostar exatamente na borda direita e na borda inferior', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar('porta-avioes', 0, 5, 'horizontal'); // colunas 5 a 9
    tabuleiro.posicionar('destroier', 8, 0, 'vertical'); // linhas 8 e 9
    expect(tabuleiro.celula(0, 9).navio).toBe('porta-avioes');
    expect(tabuleiro.celula(9, 0).navio).toBe('destroier');
  });

  test.each([
    ['porta-avioes', 0, 6, 'horizontal'],
    ['destroier', 9, 0, 'vertical'],
    ['submarino', 0, 8, 'horizontal'],
    ['encouracado', 7, 0, 'vertical'],
    ['destroier', 0, 10, 'horizontal'],
    ['destroier', 10, 0, 'horizontal'],
    ['destroier', -1, 0, 'horizontal'],
    ['destroier', 0, -1, 'vertical'],
  ])('rejeita navio fora do tabuleiro: %s em (%i, %i) %s', (tipo, l, c, orientacao) => {
    const tabuleiro = new Tabuleiro();
    expect(() => tabuleiro.posicionar(tipo, l, c, orientacao)).toThrow(RangeError);
    expect(posicoesOcupadas(tabuleiro)).toHaveLength(0);
  });

  test('rejeita coordenada nao inteira', () => {
    expect(() => new Tabuleiro().posicionar('destroier', 1.5, 0, 'horizontal')).toThrow(RangeError);
  });

  test('rejeita tipo de navio desconhecido e orientacao invalida', () => {
    const tabuleiro = new Tabuleiro();
    expect(() => tabuleiro.posicionar('canoa', 0, 0, 'horizontal')).toThrow(RangeError);
    expect(() => tabuleiro.posicionar('destroier', 0, 0, 'diagonal')).toThrow(RangeError);
  });

  test('dois navios nao podem ocupar a mesma casa e a tentativa nao deixa nada posicionado', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar('porta-avioes', 0, 0, 'horizontal');
    expect(() => tabuleiro.posicionar('encouracado', 0, 3, 'vertical')).toThrow('Posicao ocupada');
    // o encouracado nao ficou parcialmente posicionado e pode ser colocado em outro lugar
    expect(posicoesOcupadas(tabuleiro)).toHaveLength(5);
    expect(() => tabuleiro.posicionar('encouracado', 1, 0, 'horizontal')).not.toThrow();
  });

  test('navios podem ficar encostados (lado a lado) sem se sobrepor', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar('porta-avioes', 0, 0, 'horizontal');
    expect(() => tabuleiro.posicionar('encouracado', 1, 0, 'horizontal')).not.toThrow();
  });

  test('cada tipo de navio so pode ser posicionado uma vez', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar('destroier', 0, 0, 'horizontal');
    expect(() => tabuleiro.posicionar('destroier', 5, 5, 'horizontal')).toThrow('Navio ja posicionado');
  });

  test('a frota fica completa quando os 4 navios estao posicionados', () => {
    const tabuleiro = new Tabuleiro();
    LAYOUT.slice(0, 3).forEach(([tipo, l, c]) => tabuleiro.posicionar(tipo, l, c, 'horizontal'));
    expect(tabuleiro.frotaCompleta()).toBe(false);
    tabuleiro.posicionar('destroier', 6, 0, 'horizontal');
    expect(tabuleiro.frotaCompleta()).toBe(true);
    expect(posicoesOcupadas(tabuleiro)).toHaveLength(14);
  });
});

describe('Posicionamento aleatorio', () => {
  test('posiciona a frota inteira (14 casas) dentro do tabuleiro', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionarAleatoriamente(aleatorioComSemente(1));
    expect(tabuleiro.frotaCompleta()).toBe(true);
    expect(posicoesOcupadas(tabuleiro)).toHaveLength(14);
  });

  test('mantem os navios que ja estavam posicionados e completa os demais', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar('porta-avioes', 9, 0, 'horizontal');
    tabuleiro.posicionarAleatoriamente(aleatorioComSemente(3));
    expect(tabuleiro.frotaCompleta()).toBe(true);
    expect(tabuleiro.celula(9, 0).navio).toBe('porta-avioes');
    expect(tabuleiro.celula(9, 4).navio).toBe('porta-avioes');
    expect(posicoesOcupadas(tabuleiro)).toHaveLength(14);
  });

  test('funciona com o gerador aleatorio padrao (Math.random)', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionarAleatoriamente();
    expect(posicoesOcupadas(tabuleiro)).toHaveLength(14);
  });

  // Texto com o tipo de navio de cada casa ocupada: serve para comparar disposicoes.
  function disposicao(tabuleiro) {
    return posicoesOcupadas(tabuleiro)
      .map(([l, c]) => `${l},${c}=${tabuleiro.celula(l, c).navio}`)
      .join(';');
  }

  function disposicaoDaSemente(semente) {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionarAleatoriamente(aleatorioComSemente(semente));
    return disposicao(tabuleiro);
  }

  test('com 200 sementes a frota sempre fica completa, sem sobreposicao e com navios em linha reta', () => {
    for (let semente = 1; semente <= 200; semente++) {
      const tabuleiro = new Tabuleiro();
      tabuleiro.posicionarAleatoriamente(aleatorioComSemente(semente));

      expect(tabuleiro.frotaCompleta()).toBe(true);
      expect(posicoesOcupadas(tabuleiro)).toHaveLength(14);
      Object.entries(FROTA).forEach(([tipo, tamanho]) => {
        const casas = posicoesOcupadas(tabuleiro).filter(([l, c]) => tabuleiro.celula(l, c).navio === tipo);
        expect(casas).toHaveLength(tamanho);
        const linhas = new Set(casas.map(([l]) => l));
        const colunas = new Set(casas.map(([, c]) => c));
        // todas as casas na mesma linha ou na mesma coluna, e consecutivas
        expect(linhas.size === 1 || colunas.size === 1).toBe(true);
        const variavel = linhas.size === 1 ? casas.map(([, c]) => c) : casas.map(([l]) => l);
        expect(Math.max(...variavel) - Math.min(...variavel)).toBe(tamanho - 1);
      });
    }
  });

  test('a mesma semente gera a mesma disposicao e sementes diferentes geram disposicoes diferentes', () => {
    expect(disposicaoDaSemente(42)).toBe(disposicaoDaSemente(42));
    expect(disposicaoDaSemente(1)).not.toBe(disposicaoDaSemente(2));

    const distintas = new Set();
    for (let semente = 1; semente <= 200; semente++) distintas.add(disposicaoDaSemente(semente));
    expect(distintas.size).toBe(200);
  });
});

describe('Tiros', () => {
  test('um tiro em uma casa sem navio e agua', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    expect(tabuleiro.atirar(9, 9)).toEqual({ resultado: 'agua' });
    expect(tabuleiro.celula(9, 9).atingida).toBe(true);
  });

  test('um tiro em um navio que ainda tem partes intactas e um acerto', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    expect(tabuleiro.atirar(0, 0)).toEqual({ resultado: 'acertou' });
    expect(tabuleiro.celula(0, 0).atingida).toBe(true);
  });

  test('o tiro na ultima parte intacta afunda o navio', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    expect(tabuleiro.atirar(6, 0)).toEqual({ resultado: 'acertou' });
    expect(tabuleiro.atirar(6, 1)).toEqual({ resultado: 'afundou', navio: 'destroier' });
  });

  test('o porta-avioes so afunda depois de 5 acertos', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    for (let c = 0; c < 4; c++) expect(tabuleiro.atirar(0, c).resultado).toBe('acertou');
    expect(tabuleiro.atirar(0, 4)).toEqual({ resultado: 'afundou', navio: 'porta-avioes' });
  });

  test('atirar duas vezes na mesma casa e erro (agua ou acerto)', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    tabuleiro.atirar(9, 9);
    tabuleiro.atirar(0, 0);
    expect(() => tabuleiro.atirar(9, 9)).toThrow('Posicao ja atingida');
    expect(() => tabuleiro.atirar(0, 0)).toThrow('Posicao ja atingida');
  });

  test.each([[-1, 0], [10, 0], [0, -1], [0, 10], [0.5, 0]])(
    'rejeita tiro fora do tabuleiro em (%p, %p)',
    (l, c) => {
      expect(() => new Tabuleiro().atirar(l, c)).toThrow(RangeError);
    },
  );

  test('celula() rejeita coordenada invalida e devolve uma copia', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    expect(() => tabuleiro.celula(10, 0)).toThrow(RangeError);
    const copia = tabuleiro.celula(0, 0);
    copia.navio = null;
    expect(tabuleiro.celula(0, 0).navio).toBe('porta-avioes');
  });
});

describe('Situacao da frota', () => {
  test('navios() informa tamanho, acertos e se afundou', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    tabuleiro.atirar(2, 0);
    tabuleiro.atirar(6, 0);
    tabuleiro.atirar(6, 1);
    const frota = tabuleiro.navios();
    expect(frota).toContainEqual({ tipo: 'encouracado', tamanho: 4, atingidos: 1, afundado: false });
    expect(frota).toContainEqual({ tipo: 'destroier', tamanho: 2, atingidos: 2, afundado: true });
    expect(frota).toContainEqual({ tipo: 'porta-avioes', tamanho: 5, atingidos: 0, afundado: false });
  });

  test('naviosRestantes() conta os navios ainda nao afundados', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    expect(tabuleiro.naviosRestantes()).toBe(4);
    tabuleiro.atirar(6, 0);
    tabuleiro.atirar(6, 1);
    expect(tabuleiro.naviosRestantes()).toBe(3);
  });

  test('todosAfundados() e verdadeiro somente quando as 14 casas foram atingidas', () => {
    const tabuleiro = new Tabuleiro();
    posicionarFrota(tabuleiro);
    const alvos = celulasDoLayout();
    expect(alvos).toHaveLength(14);
    alvos.slice(0, 13).forEach(([l, c]) => tabuleiro.atirar(l, c));
    expect(tabuleiro.todosAfundados()).toBe(false);
    tabuleiro.atirar(...alvos[13]);
    expect(tabuleiro.todosAfundados()).toBe(true);
  });

  test('todosAfundados() e falso se a frota ainda nao esta completa', () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar('destroier', 0, 0, 'horizontal');
    tabuleiro.atirar(0, 0);
    tabuleiro.atirar(0, 1);
    expect(tabuleiro.naviosRestantes()).toBe(0);
    expect(tabuleiro.todosAfundados()).toBe(false);
  });
});

describe('Partida para 2 jogadores', () => {
  function jogoPronto() {
    const jogo = new Jogo();
    [1, 2].forEach((jogador) => {
      LAYOUT.forEach(([tipo, l, c]) => jogo.posicionar(jogador, tipo, l, c, 'horizontal'));
    });
    return jogo;
  }

  // O jogador 1 acerta todas as casas do jogador 2; o jogador 2 so da tiros na agua (linhas 8 e 9).
  function jogarAteOFim(jogo, vencedor) {
    const perdedor = vencedor === 1 ? 2 : 1;
    const alvos = celulasDoLayout();
    const agua = todasAsPosicoes().filter(([l]) => l >= 8);
    let ultimo;
    alvos.forEach(([l, c], i) => {
      ultimo = jogo.atirar(vencedor, l, c);
      if (i < alvos.length - 1) jogo.atirar(perdedor, ...agua[i]);
    });
    return ultimo;
  }

  test('a partida comeca na fase de posicionamento, sem jogador da vez', () => {
    const jogo = new Jogo();
    expect(jogo.estado).toBe('posicionamento');
    expect(jogo.vez).toBeNull();
    expect(jogo.vencedor).toBeNull();
  });

  test('nao e possivel atirar antes de os dois jogadores posicionarem a frota', () => {
    const jogo = new Jogo();
    LAYOUT.forEach(([tipo, l, c]) => jogo.posicionar(1, tipo, l, c, 'horizontal'));
    expect(jogo.estado).toBe('posicionamento');
    expect(() => jogo.atirar(1, 0, 0)).toThrow('Jogo nao iniciado');
  });

  test('a partida comeca quando as duas frotas estao completas e o jogador 1 joga primeiro', () => {
    const jogo = jogoPronto();
    expect(jogo.estado).toBe('jogando');
    expect(jogo.vez).toBe(1);
  });

  test('cada jogador tem o seu proprio tabuleiro', () => {
    const jogo = new Jogo();
    jogo.posicionar(1, 'destroier', 0, 0, 'horizontal');
    expect(jogo.tabuleiro(1).celula(0, 0).navio).toBe('destroier');
    expect(jogo.tabuleiro(2).celula(0, 0).navio).toBeNull();
  });

  test('rejeita jogador diferente de 1 ou 2', () => {
    const jogo = new Jogo();
    expect(() => jogo.posicionar(3, 'destroier', 0, 0, 'horizontal')).toThrow(RangeError);
    expect(() => jogo.tabuleiro(0)).toThrow(RangeError);
    expect(() => jogoPronto().atirar('a', 0, 0)).toThrow(RangeError);
  });

  test('so o jogador da vez pode atirar', () => {
    const jogo = jogoPronto();
    expect(() => jogo.atirar(2, 9, 9)).toThrow('Nao e a vez do jogador');
  });

  test('o tiro acerta o tabuleiro do adversario e a vez passa para ele (agua ou acerto)', () => {
    const jogo = jogoPronto();
    expect(jogo.atirar(1, 9, 9)).toEqual({ resultado: 'agua' });
    expect(jogo.vez).toBe(2);
    expect(jogo.tabuleiro(2).celula(9, 9).atingida).toBe(true);
    expect(jogo.tabuleiro(1).celula(9, 9).atingida).toBe(false);
    expect(jogo.atirar(2, 0, 0)).toEqual({ resultado: 'acertou' });
    expect(jogo.vez).toBe(1);
  });

  test('um tiro repetido e rejeitado e nao faz a vez passar', () => {
    const jogo = jogoPronto();
    jogo.atirar(1, 9, 9);
    jogo.atirar(2, 9, 9);
    expect(() => jogo.atirar(1, 9, 9)).toThrow('Posicao ja atingida');
    expect(jogo.vez).toBe(1);
  });

  test('nao e possivel reposicionar navios depois que a partida comecou', () => {
    const jogo = jogoPronto();
    expect(() => jogo.posicionar(1, 'destroier', 9, 0, 'horizontal')).toThrow('Posicionamento encerrado');
  });

  test('o jogador 1 vence ao afundar toda a frota do jogador 2', () => {
    const jogo = jogoPronto();
    const ultimo = jogarAteOFim(jogo, 1);
    expect(ultimo.resultado).toBe('afundou');
    expect(jogo.estado).toBe('fim');
    expect(jogo.vencedor).toBe(1);
    expect(jogo.vez).toBeNull();
  });

  test('o jogador 2 tambem pode vencer', () => {
    const jogo = jogoPronto();
    jogo.atirar(1, 9, 9); // o jogador 1 erra e a vez passa para o jogador 2
    const alvos = celulasDoLayout();
    const agua = todasAsPosicoes().filter(([l]) => l >= 8);
    alvos.forEach(([l, c], i) => {
      jogo.atirar(2, l, c);
      if (i < alvos.length - 1) jogo.atirar(1, ...agua[i + 1]);
    });
    expect(jogo.estado).toBe('fim');
    expect(jogo.vencedor).toBe(2);
  });

  test('depois do fim da partida nao e possivel atirar', () => {
    const jogo = jogoPronto();
    jogarAteOFim(jogo, 1);
    expect(() => jogo.atirar(2, 9, 9)).toThrow('Jogo encerrado');
  });
});
