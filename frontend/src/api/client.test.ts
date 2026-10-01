import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, memoryTokenStore, usernameFromToken } from './client';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** JWT falso so com o payload (o cliente nao valida assinatura). */
function fakeJwt(claims: object): string {
  const b64 = btoa(JSON.stringify(claims)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${b64}.signature`;
}

function setup(token: string | null = null, response: Response = json(200, {})) {
  const store = memoryTokenStore(token);
  const fetchFn = vi.fn(async (_input: string, _init?: RequestInit) => response.clone());
  const client = new ApiClient(store, fetchFn);
  const onUnauthorized = vi.fn();
  client.onUnauthorized = onUnauthorized;
  return { store, fetchFn, client, onUnauthorized };
}

describe('ApiClient', () => {
  it('stores the token after login and sends it on later requests', async () => {
    const { client, fetchFn, store } = setup(null, json(200, { token: 'abc', username: 'ash', expiresAt: '' }));
    await client.login('ash', 'pikachu');

    expect(store.get()).toBe('abc');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ username: 'ash', password: 'pikachu' });

    fetchFn.mockResolvedValueOnce(json(200, { team: [], box: [] }));
    await client.roster();
    expect((fetchFn.mock.calls[1][1]?.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('omits Authorization and Content-Type when not needed', async () => {
    const { client, fetchFn } = setup(null, json(200, []));
    await client.species();
    expect(fetchFn.mock.calls[0][1]?.headers).toEqual({});
  });

  it('clears an expired token and notifies on 401', async () => {
    const { client, store, onUnauthorized } = setup('expired', json(401, { detail: 'expired' }));
    await expect(client.roster()).rejects.toBeInstanceOf(ApiError);
    expect(store.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not treat a failed login as an expired session', async () => {
    const { client, onUnauthorized } = setup(null, json(401, { detail: 'Invalid username or password' }));
    await expect(client.login('ash', 'wrong')).rejects.toMatchObject({ status: 401, detail: 'Invalid username or password' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('returns null when there is no active battle', async () => {
    const { client } = setup('t', json(404, { detail: 'No active battle' }));
    await expect(client.activeBattle()).resolves.toBeNull();
  });

  it('rethrows other errors from activeBattle', async () => {
    const { client } = setup('t', json(500, { title: 'Internal Server Error' }));
    await expect(client.activeBattle()).rejects.toMatchObject({ status: 500, detail: 'Internal Server Error' });
  });

  it('posts turn actions to the battle', async () => {
    const { client, fetchFn } = setup('t', json(200, { events: [], battle: {} }));
    await client.submitTurn(7, { action: 'MOVE', moveIndex: 1 });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('/api/battles/7/turns');
    expect(JSON.parse(init?.body as string)).toEqual({ action: 'MOVE', moveIndex: 1 });
  });

  it('logout forgets the token', () => {
    const { client } = setup('t');
    client.logout();
    expect(client.isLoggedIn()).toBe(false);
  });
});

describe('usernameFromToken', () => {
  it('reads the username claim', () => {
    expect(usernameFromToken(fakeJwt({ sub: '1', username: 'misty' }))).toBe('misty');
  });

  it('is null for missing or malformed tokens', () => {
    expect(usernameFromToken(null)).toBeNull();
    expect(usernameFromToken('not-a-jwt')).toBeNull();
    expect(usernameFromToken(fakeJwt({ sub: '1' }))).toBeNull();
  });
});
