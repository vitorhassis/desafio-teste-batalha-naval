'use strict';

const TAMANHO = 10;

/** Frota de cada jogador: um navio de cada tipo, com o numero de casas que ocupa. */
const FROTA = Object.freeze({
  'porta-avioes': 5,
  encouracado: 4,
  submarino: 3,
  destroier: 2,
});

const ORIENTACOES = ['horizontal', 'vertical'];

function validarCoordenada(linha, coluna) {
  const valida = Number.isInteger(linha) && Number.isInteger(coluna)
    && linha >= 0 && linha < TAMANHO && coluna >= 0 && coluna < TAMANHO;
  if (!valida) throw new RangeError('Coordenada invalida');
}

/**
 * Tabuleiro 10 x 10 de um jogador.
 *
 * Os navios ocupam casas consecutivas na horizontal ou na vertical, a partir da casa
 * informada (para a direita ou para baixo). Navios podem ficar encostados, mas nao sobrepostos.
 */
class Tabuleiro {
  constructor() {
    this._grade = Array.from({ length: TAMANHO }, () => (
      Array.from({ length: TAMANHO }, () => ({ navio: null, atingida: false }))
    ));
    this._navios = new Map(); // tipo -> { tipo, tamanho, celulas, atingidas }
  }

  posicionar(tipo, linha, coluna, orientacao) {
    if (!Object.prototype.hasOwnProperty.call(FROTA, tipo)) throw new RangeError('Navio desconhecido');
    if (!ORIENTACOES.includes(orientacao)) throw new RangeError('Orientacao invalida');
    validarCoordenada(linha, coluna);
    if (this._navios.has(tipo)) throw new Error('Navio ja posicionado');

    const celulas = this._celulasDoNavio(tipo, linha, coluna, orientacao);
    if (!celulas.every(([l, c]) => this._dentro(l, c))) throw new RangeError('Navio fora do tabuleiro');
    if (celulas.some(([l, c]) => this._grade[l][c].navio !== null)) throw new Error('Posicao ocupada');

    celulas.forEach(([l, c]) => {
      this._grade[l][c].navio = tipo;
    });
    this._navios.set(tipo, { tipo, tamanho: FROTA[tipo], celulas, atingidas: 0 });
  }

  /** Posiciona, em locais sorteados, os navios que ainda nao foram posicionados. */
  posicionarAleatoriamente(aleatorio = Math.random) {
    Object.keys(FROTA)
      .filter((tipo) => !this._navios.has(tipo))
      .forEach((tipo) => {
        let linha;
        let coluna;
        let orientacao;
        do {
          orientacao = aleatorio() < 0.5 ? 'horizontal' : 'vertical';
          linha = Math.floor(aleatorio() * TAMANHO);
          coluna = Math.floor(aleatorio() * TAMANHO);
        } while (!this._cabe(tipo, linha, coluna, orientacao));
        this.posicionar(tipo, linha, coluna, orientacao);
      });
  }

  /** Verdadeiro se os 4 navios ja foram posicionados. */
  frotaCompleta() {
    return this._navios.size === Object.keys(FROTA).length;
  }

  /**
   * Da um tiro. Resultados: { resultado: 'agua' }, { resultado: 'acertou' } ou
   * { resultado: 'afundou', navio }. Atirar duas vezes na mesma casa e erro.
   */
  atirar(linha, coluna) {
    validarCoordenada(linha, coluna);
    const celula = this._grade[linha][coluna];
    if (celula.atingida) throw new Error('Posicao ja atingida');
    celula.atingida = true;

    if (celula.navio === null) return { resultado: 'agua' };
    const navio = this._navios.get(celula.navio);
    navio.atingidas++;
    if (navio.atingidas === navio.tamanho) return { resultado: 'afundou', navio: navio.tipo };
    return { resultado: 'acertou' };
  }

  /** Copia do estado da casa: { navio: tipo | null, atingida }. */
  celula(linha, coluna) {
    validarCoordenada(linha, coluna);
    return { ...this._grade[linha][coluna] };
  }

  /** Situacao de cada navio posicionado. */
  navios() {
    return [...this._navios.values()].map((n) => ({
      tipo: n.tipo,
      tamanho: n.tamanho,
      atingidos: n.atingidas,
      afundado: n.atingidas === n.tamanho,
    }));
  }

  naviosRestantes() {
    return this.navios().filter((n) => !n.afundado).length;
  }

  /** Verdadeiro quando a frota esta completa e todos os navios foram afundados. */
  todosAfundados() {
    return this.frotaCompleta() && this.naviosRestantes() === 0;
  }

  // ---------------------------------------------------------------- privados

  _dentro(linha, coluna) {
    return linha >= 0 && linha < TAMANHO && coluna >= 0 && coluna < TAMANHO;
  }

  _celulasDoNavio(tipo, linha, coluna, orientacao) {
    const celulas = [];
    for (let i = 0; i < FROTA[tipo]; i++) {
      celulas.push(orientacao === 'horizontal' ? [linha, coluna + i] : [linha + i, coluna]);
    }
    return celulas;
  }

  _cabe(tipo, linha, coluna, orientacao) {
    return this._celulasDoNavio(tipo, linha, coluna, orientacao)
      .every(([l, c]) => this._dentro(l, c) && this._grade[l][c].navio === null);
  }
}

/**
 * Partida de Batalha Naval para 2 jogadores (1 e 2).
 *
 * Fases: 'posicionamento' -> 'jogando' -> 'fim'. O jogador 1 comeca. A vez passa para o
 * adversario depois de cada tiro valido (agua, acerto ou afundamento).
 */
class Jogo {
  constructor() {
    this._tabuleiros = { 1: new Tabuleiro(), 2: new Tabuleiro() };
    this.estado = 'posicionamento';
    this.vez = null;
    this.vencedor = null;
  }

  /** Tabuleiro (com a frota) do jogador. */
  tabuleiro(jogador) {
    this._validarJogador(jogador);
    return this._tabuleiros[jogador];
  }

  posicionar(jogador, tipo, linha, coluna, orientacao) {
    this._validarJogador(jogador);
    if (this.estado !== 'posicionamento') throw new Error('Posicionamento encerrado');
    this._tabuleiros[jogador].posicionar(tipo, linha, coluna, orientacao);
    if (this._tabuleiros[1].frotaCompleta() && this._tabuleiros[2].frotaCompleta()) {
      this.estado = 'jogando';
      this.vez = 1;
    }
  }

  /** O jogador atira no tabuleiro do adversario. */
  atirar(jogador, linha, coluna) {
    this._validarJogador(jogador);
    if (this.estado === 'posicionamento') throw new Error('Jogo nao iniciado');
    if (this.estado === 'fim') throw new Error('Jogo encerrado');
    if (this.vez !== jogador) throw new Error('Nao e a vez do jogador');

    const adversario = jogador === 1 ? 2 : 1;
    const resultado = this._tabuleiros[adversario].atirar(linha, coluna);
    if (this._tabuleiros[adversario].todosAfundados()) {
      this.estado = 'fim';
      this.vencedor = jogador;
      this.vez = null;
    } else {
      this.vez = adversario;
    }
    return resultado;
  }

  _validarJogador(jogador) {
    if (jogador !== 1 && jogador !== 2) throw new RangeError('Jogador invalido: use 1 ou 2');
  }
}

module.exports = { Tabuleiro, Jogo, FROTA, TAMANHO };
