import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { showToast } from './components/toast.js';

const loginForm = document.getElementById('loginForm');
const loginInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginSenha');
const loginButton = document.getElementById('btnLogin');
const passwordToggle = document.getElementById('togglePasswordBtn');
const capsWarning = document.getElementById('capsLockWarning');
const loginHelper = document.getElementById('studentLoginHelper');

const defaultButtonMarkup = loginButton?.innerHTML || '';

function redirectByProfile(perfil) {
    window.location.href = perfil === 'ROLE_COMISSAO' ? './index.html' : './aluno.html';
}

function setLoading(isLoading) {
    if (!loginButton) return;

    loginButton.disabled = isLoading;
    loginButton.innerHTML = isLoading
        ? '<i class="ph ph-spinner-gap animate-spin"></i> Autenticando...'
        : defaultButtonMarkup;
}

function updateLoginHelper() {
    if (!loginHelper || !loginInput) return;

    const rawValue = loginInput.value.trim();
    if (!rawValue) {
        loginHelper.textContent = 'Use email, RA, apelido da turma ou o identificador criado no sistema.';
        return;
    }

    loginHelper.textContent = rawValue.includes('@')
        ? 'Detectamos um login por email. Se preferir, voce tambem pode entrar com identificador.'
        : 'Detectamos um identificador curto. Isso funciona bem para acesso rapido no celular.';
}

function setCapsWarning(event) {
    if (!capsWarning) return;
    capsWarning.hidden = !event.getModifierState('CapsLock');
}

async function redirectIfSessionIsValid() {
    const token = auth.getToken();
    if (!token) return;

    try {
        const me = await api.me();
        auth.saveSession({
            token,
            perfil: me.perfil,
            nome: me.nome,
            login: me.login || me.email
        });
        redirectByProfile(me.perfil);
    } catch (error) {
        auth.clearSession();
    }
}

passwordToggle?.addEventListener('click', () => {
    const showingPassword = passwordInput.type === 'text';
    passwordInput.type = showingPassword ? 'password' : 'text';
    passwordToggle.setAttribute('aria-pressed', String(!showingPassword));
    passwordToggle.innerHTML = showingPassword
        ? '<i class="ph ph-eye"></i>'
        : '<i class="ph ph-eye-slash"></i>';
});

loginInput?.addEventListener('input', updateLoginHelper);
passwordInput?.addEventListener('keydown', setCapsWarning);
passwordInput?.addEventListener('keyup', setCapsWarning);
passwordInput?.addEventListener('blur', () => {
    if (capsWarning) capsWarning.hidden = true;
});

loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const login = loginInput?.value?.trim() || '';
    const senha = passwordInput?.value || '';

    if (!login || !senha) {
        showToast('Preencha login e senha para continuar.', 'error');
        return;
    }

    setLoading(true);

    try {
        const dados = await api.login(login, senha);
        auth.saveSession({
            ...dados,
            login: dados.login || login
        });
        showToast('Login efetuado com sucesso!');
        window.setTimeout(() => {
            redirectByProfile(dados.perfil);
        }, 450);
    } catch (error) {
        showToast('Login invalido. Confira seu identificador e senha.', 'error');
        setLoading(false);
    }
});

updateLoginHelper();
redirectIfSessionIsValid().catch(console.error);
