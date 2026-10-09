import Phaser from 'phaser';
import { authErrorMessage } from '../api/messages';
import { COLORS, SCENES } from '../config';
import { api } from '../services';
import { routeHome } from './route';

interface LoginData {
  message?: string;
}

/** O formulario e HTML de verdade (index.html): acessivel e funciona com gerenciadores de senha. */
export class LoginScene extends Phaser.Scene {
  constructor() {
    super(SCENES.login);
  }

  create(data: LoginData): void {
    this.cameras.main.setBackgroundColor(COLORS.page);
    const form = document.getElementById('login') as HTMLFormElement;
    const username = document.getElementById('username') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const error = document.getElementById('login-error') as HTMLParagraphElement;
    const buttons = form.querySelectorAll('button');
    const registerButton = document.getElementById('btn-register') as HTMLButtonElement;

    error.textContent = data.message ?? '';
    password.value = '';
    form.hidden = false;
    username.focus();

    const submit = async (mode: 'login' | 'register') => {
      if (!form.checkValidity()) {
        error.textContent = 'Treinador: 3 a 20 letras, numeros ou _. Senha: 6 caracteres ou mais.';
        return;
      }
      buttons.forEach((b) => (b.disabled = true));
      error.textContent = '';
      try {
        if (mode === 'login') await api.login(username.value, password.value);
        else await api.register(username.value, password.value);
        form.hidden = true;
        await routeHome(this);
      } catch (e) {
        form.hidden = false;
        error.textContent = authErrorMessage(e, mode);
      } finally {
        buttons.forEach((b) => (b.disabled = false));
      }
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      void submit('login');
    };
    registerButton.onclick = () => void submit('register');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      form.hidden = true;
      form.onsubmit = null;
      registerButton.onclick = null;
    });
  }
}
