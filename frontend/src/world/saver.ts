import type { WorldPosition } from '../api/types';

/**
 * Salva a posicao no servidor sem exagero: a cada `every` passos ou quando pedido (batalha, cura, saida).
 * Nao repete uma posicao ja salva; falhas sao ignoradas (o proximo salvamento tenta de novo).
 */
export class PositionSaver {
  private steps = 0;
  private saved: string | null = null;

  constructor(
    private readonly save: (position: WorldPosition) => Promise<void>,
    private readonly every = 10,
  ) {}

  /** Conta um passo; salva quando completa o intervalo. */
  step(position: WorldPosition): Promise<void> {
    this.steps++;
    return this.steps >= this.every ? this.flush(position) : Promise.resolve();
  }

  flush(position: WorldPosition): Promise<void> {
    this.steps = 0;
    const key = `${position.x},${position.y},${position.facing}`;
    if (key === this.saved) return Promise.resolve();
    this.saved = key;
    return this.save({ ...position }).catch(() => {
      if (this.saved === key) this.saved = null;
    });
  }
}
