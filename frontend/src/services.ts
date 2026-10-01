import { ApiClient, localTokenStore } from './api/client';
import type { Species } from './api/types';

export const api = new ApiClient(localTokenStore());

let species: Species[] = [];

/** Catalogo de especies carregado no Boot (dados estaticos do servidor). */
export const catalog = {
  set(list: Species[]) {
    species = list;
  },
  all(): Species[] {
    return species;
  },
};
