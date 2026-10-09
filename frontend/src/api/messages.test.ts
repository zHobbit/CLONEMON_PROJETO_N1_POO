import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { authErrorMessage } from './messages';

describe('authErrorMessage', () => {
  it('explains each auth failure in Portuguese', () => {
    expect(authErrorMessage(new ApiError(401, 'x'), 'login')).toBe('Treinador ou senha invalidos.');
    expect(authErrorMessage(new ApiError(409, 'x'), 'register')).toBe('Esse nome de treinador ja existe.');
    expect(authErrorMessage(new ApiError(400, 'x'), 'register')).toContain('3 a 20');
  });

  it('treats network failures as the server being down', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'), 'login')).toContain('Servidor indisponivel');
  });
});
