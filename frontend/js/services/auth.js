const STORAGE_PREFIX = 'gestaoform';
const SESSION_KEYS = {
    token: `${STORAGE_PREFIX}.token`,
    perfil: `${STORAGE_PREFIX}.perfil`,
    nome: `${STORAGE_PREFIX}.nome`,
    login: `${STORAGE_PREFIX}.login`
};

const LEGACY_KEYS = ['token', 'perfil', 'nomeUsuario'];

function safeStorage(type) {
    try {
        return window[type];
    } catch (error) {
        return null;
    }
}

function removeKeys(storage, keys) {
    if (!storage) return;
    keys.forEach((key) => storage.removeItem(key));
}

function writeSessionValue(key, value) {
    const session = safeStorage('sessionStorage');
    const local = safeStorage('localStorage');
    const target = session || local;
    if (!target || value == null || value === '') return;
    target.setItem(key, value);
}

function readSessionValue(key) {
    const session = safeStorage('sessionStorage');
    const local = safeStorage('localStorage');
    return session?.getItem(key) || local?.getItem(key) || null;
}

export const auth = {
    getToken() {
        return readSessionValue(SESSION_KEYS.token);
    },

    saveSession({ token, perfil, nome, login }) {
        this.clearSession();
        writeSessionValue(SESSION_KEYS.token, token);
        writeSessionValue(SESSION_KEYS.perfil, perfil);
        writeSessionValue(SESSION_KEYS.nome, nome);
        writeSessionValue(SESSION_KEYS.login, login);
    },

    getSession() {
        return {
            token: readSessionValue(SESSION_KEYS.token),
            perfil: readSessionValue(SESSION_KEYS.perfil),
            nome: readSessionValue(SESSION_KEYS.nome),
            login: readSessionValue(SESSION_KEYS.login)
        };
    },

    clearSession() {
        removeKeys(safeStorage('sessionStorage'), Object.values(SESSION_KEYS));
        removeKeys(safeStorage('localStorage'), Object.values(SESSION_KEYS));
        removeKeys(safeStorage('sessionStorage'), LEGACY_KEYS);
        removeKeys(safeStorage('localStorage'), LEGACY_KEYS);
    }
};
