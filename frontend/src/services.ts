import { ApiClient, localTokenStore } from './api/client';
import type { Species } from './api/types';

export const api = new ApiClient(localTokenStore());

/** Os 6 clonemons originais (ids 1 a 6) sao os iniciais; os outros so aparecem na natureza. */
const STARTER_IDS = 6;

let species: Species[] = [];

/** Catalogo de especies carregado no Boot (dados estaticos do servidor). */
export const catalog = {
  set(list: Species[]) {
    species = list;
  },
  all(): Species[] {
    return species;
  },
  /** Opcoes de inicial, que cabem na grade 3x2 da escolha e na tela de titulo. */
  starters(): Species[] {
    return species.filter((s) => s.id <= STARTER_IDS);
  },
};
