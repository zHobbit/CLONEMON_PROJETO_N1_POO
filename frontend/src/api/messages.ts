import { ApiError } from './client';

/** Mensagem amigavel para erros de login/cadastro. */
export function authErrorMessage(error: unknown, mode: 'login' | 'register'): string {
  if (!(error instanceof ApiError)) return 'Servidor indisponivel. Tente de novo.';
  switch (error.status) {
    case 400:
      return 'Treinador: 3 a 20 letras, numeros ou _. Senha: 6 caracteres ou mais.';
    case 401:
      return 'Treinador ou senha invalidos.';
    case 409:
      return mode === 'register' ? 'Esse nome de treinador ja existe.' : 'Conflito. Tente de novo.';
    default:
      return 'Algo deu errado. Tente de novo.';
  }
}
