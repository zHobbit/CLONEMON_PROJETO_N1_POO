import type {
  Battle,
  Monster,
  Roster,
  Species,
  TokenResponse,
  TurnAction,
  TurnResponse,
  WorldPosition,
  WorldState,
} from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`HTTP ${status}: ${detail}`);
  }
}

export interface TokenStore {
  get(): string | null;
  set(token: string | null): void;
}

/** Guarda o token no localStorage; funciona sem ele (aba privada, armazenamento bloqueado). */
export function localTokenStore(key = 'clonemon.token'): TokenStore {
  let memory: string | null = null;
  return {
    get() {
      try {
        return localStorage.getItem(key) ?? memory;
      } catch {
        return memory;
      }
    },
    set(token) {
      memory = token;
      try {
        if (token) localStorage.setItem(key, token);
        else localStorage.removeItem(key);
      } catch {
        /* fica so em memoria */
      }
    },
  };
}

export function memoryTokenStore(initial: string | null = null): TokenStore {
  let token = initial;
  return { get: () => token, set: (t) => (token = t) };
}

/** Le o claim "username" do JWT (sem validar; quem valida e o servidor). */
export function usernameFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload)) as { username?: unknown };
    return typeof claims.username === 'string' ? claims.username : null;
  } catch {
    return null;
  }
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export class ApiClient {
  /** Chamado quando o servidor rejeita o token salvo (expirado ou invalido). */
  onUnauthorized: () => void = () => {};

  constructor(
    private readonly tokens: TokenStore,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
    private readonly base = '/api',
  ) {}

  isLoggedIn(): boolean {
    return this.tokens.get() !== null;
  }

  username(): string | null {
    return usernameFromToken(this.tokens.get());
  }

  async register(username: string, password: string): Promise<void> {
    const res = await this.request<TokenResponse>('POST', '/auth/register', { username, password });
    this.tokens.set(res.token);
  }

  async login(username: string, password: string): Promise<void> {
    const res = await this.request<TokenResponse>('POST', '/auth/login', { username, password });
    this.tokens.set(res.token);
  }

  logout(): void {
    this.tokens.set(null);
  }

  species(): Promise<Species[]> {
    return this.request('GET', '/species');
  }

  roster(): Promise<Roster> {
    return this.request('GET', '/team');
  }

  chooseStarter(speciesId: number): Promise<Monster> {
    return this.request('POST', '/team/starter', { speciesId });
  }

  updateTeam(monsterIds: number[]): Promise<Roster> {
    return this.request('PUT', '/team', { monsterIds });
  }

  heal(): Promise<Roster> {
    return this.request('POST', '/team/heal');
  }

  /** Sem npcId: batalha selvagem. Com npcId: desafio do treinador (409 se ja vencido ou time sem condicoes). */
  startBattle(npcId?: string): Promise<Battle> {
    return this.request('POST', '/battles', npcId === undefined ? undefined : { npcId });
  }

  world(): Promise<WorldState> {
    return this.request('GET', '/world');
  }

  /** keepalive: o pedido sobrevive a aba sendo fechada ou recarregada. */
  savePosition(position: WorldPosition): Promise<void> {
    return this.request('PUT', '/world/position', position, { keepalive: true });
  }

  /** A batalha em andamento, ou null se nao houver. */
  async activeBattle(): Promise<Battle | null> {
    try {
      return await this.request<Battle>('GET', '/battles/active');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  submitTurn(battleId: number, action: TurnAction): Promise<TurnResponse> {
    return this.request('POST', `/battles/${battleId}/turns`, action);
  }

  private async request<T>(method: string, path: string, body?: unknown, extra: RequestInit = {}): Promise<T> {
    const token = this.tokens.get();
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await this.fetchFn(this.base + path, {
      ...extra,
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (res.status === 401 && token) {
      this.tokens.set(null);
      this.onUnauthorized();
    }
    if (!res.ok) throw new ApiError(res.status, await problemDetail(res));
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}

async function problemDetail(res: Response): Promise<string> {
  try {
    const problem = (await res.json()) as { detail?: string; title?: string };
    return problem.detail ?? problem.title ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
