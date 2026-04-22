import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { showToast } from './components/toast.js';

const loginForm = document.getElementById('loginForm');
const loginInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginSenha');
const loginButton = document.getElementById('btnLogin');
const rememberInput = document.getElementById('rememberAccess');
const passwordToggle = document.getElementById('togglePasswordBtn');
const capsWarning = document.getElementById('capsLockWarning');
const quickAccessCard = document.getElementById('quickAccessCard');
const quickAccessLabel = document.getElementById('quickAccessLabel');
const quickAccessMeta = document.getElementById('quickAccessMeta');
const quickAccessButton = document.getElementById('quickAccessButton');
const loginHelper = document.getElementById('studentLoginHelper');
const sessionHint = document.getElementById('sessionHint');

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

function hydrateRememberedAccess() {
    const lastLogin = auth.getLastLogin();
    const lastPerfil = auth.getLastProfile();
    const lastName = auth.getLastName();
    const rememberAccess = auth.shouldRememberSession();

    if (rememberInput) {
        rememberInput.checked = rememberAccess;
    }

    if (sessionHint) {
        sessionHint.textContent = rememberAccess
            ? 'Seu ultimo acesso ficou salvo neste dispositivo.'
            : 'Se marcar "Lembrar neste aparelho", o acesso permanece salvo neste navegador.';
    }

    if (!lastLogin || !quickAccessCard) return;

    quickAccessCard.hidden = false;
    if (quickAccessLabel) {
        quickAccessLabel.textContent = lastName || lastLogin;
    }
    if (quickAccessMeta) {
        quickAccessMeta.textContent = lastPerfil === 'ROLE_ALUNO'
            ? 'Ultimo acesso como formando'
            : 'Ultimo acesso como comissao';
    }
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
            login: me.login || me.email || auth.getLastLogin(),
            persistent: auth.shouldRememberSession()
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

quickAccessButton?.addEventListener('click', () => {
    const lastLogin = auth.getLastLogin();
    if (!lastLogin || !loginInput) return;

    loginInput.value = lastLogin;
    updateLoginHelper();
    passwordInput?.focus();
});

rememberInput?.addEventListener('change', () => {
    if (!sessionHint) return;
    sessionHint.textContent = rememberInput.checked
        ? 'O token sera salvo neste navegador para acesso mais rapido.'
        : 'A sessao sera encerrada ao fechar a aba ou ao fazer logout.';
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
        const persistent = Boolean(rememberInput?.checked);
        auth.saveSession({
            ...dados,
            login: dados.login || login,
            persistent
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
hydrateRememberedAccess();
redirectIfSessionIsValid().catch(console.error);
