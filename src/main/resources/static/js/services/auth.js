const STORAGE_PREFIX = 'gestaoform';
const SESSION_KEYS = {
    token: `${STORAGE_PREFIX}.token`,
    perfil: `${STORAGE_PREFIX}.perfil`,
    nome: `${STORAGE_PREFIX}.nome`,
    login: `${STORAGE_PREFIX}.login`,
    issuedAt: `${STORAGE_PREFIX}.issuedAt`
};
const LOGOUT_EVENT_KEY = `${STORAGE_PREFIX}.logoutAt`;

const LEGACY_KEYS = ['token', 'perfil', 'nomeUsuario'];
const REMOVED_PREFERENCE_KEYS = [
    `${STORAGE_PREFIX}.remember`,
    `${STORAGE_PREFIX}.lastLogin`,
    `${STORAGE_PREFIX}.lastPerfil`,
    `${STORAGE_PREFIX}.lastNome`
];

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

function writeValue(storage, key, value) {
    if (!storage || value == null || value === '') return;
    storage.setItem(key, value);
}

function readTimestamp(storage, key) {
    const value = storage?.getItem(key);
    const timestamp = Number(value);
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function readValue(key) {
    const session = safeStorage('sessionStorage');
    const local = safeStorage('localStorage');
    return session?.getItem(key) || local?.getItem(key) || null;
}

function isSessionInvalidated() {
    const token = readValue(SESSION_KEYS.token);
    if (!token) return false;

    const session = safeStorage('sessionStorage');
    const local = safeStorage('localStorage');
    const logoutAt = readTimestamp(local, LOGOUT_EVENT_KEY);
    if (!logoutAt) return false;

    const issuedAt = readTimestamp(session, SESSION_KEYS.issuedAt) || readTimestamp(local, SESSION_KEYS.issuedAt);
    return !issuedAt || logoutAt >= issuedAt;
}

function clearSessionKeys() {
    removeKeys(safeStorage('sessionStorage'), Object.values(SESSION_KEYS));
    removeKeys(safeStorage('localStorage'), Object.values(SESSION_KEYS));
    removeKeys(safeStorage('sessionStorage'), LEGACY_KEYS);
    removeKeys(safeStorage('localStorage'), LEGACY_KEYS);
    removeKeys(safeStorage('localStorage'), REMOVED_PREFERENCE_KEYS);
}

function broadcastLogout() {
    const local = safeStorage('localStorage');
    if (!local) return;
    local.setItem(LOGOUT_EVENT_KEY, String(Date.now()));
}

export const auth = {
    logoutEventKey: LOGOUT_EVENT_KEY,

    getToken() {
        if (isSessionInvalidated()) {
            clearSessionKeys();
            return null;
        }
        return readValue(SESSION_KEYS.token);
    },

    saveSession({ token, perfil, nome, login }) {
        clearSessionKeys();

        const target = safeStorage('sessionStorage');
        writeValue(target, SESSION_KEYS.token, token);
        writeValue(target, SESSION_KEYS.perfil, perfil);
        writeValue(target, SESSION_KEYS.nome, nome);
        writeValue(target, SESSION_KEYS.login, login);
        writeValue(target, SESSION_KEYS.issuedAt, String(Date.now()));
    },

    getSession() {
        if (isSessionInvalidated()) {
            clearSessionKeys();
        }
        return {
            token: readValue(SESSION_KEYS.token),
            perfil: readValue(SESSION_KEYS.perfil),
            nome: readValue(SESSION_KEYS.nome),
            login: readValue(SESSION_KEYS.login)
        };
    },

    clearSession({ broadcast = false } = {}) {
        clearSessionKeys();
        if (broadcast) broadcastLogout();
    },

    logout() {
        this.clearSession({ broadcast: true });
    },

    onLogout(callback) {
        window.addEventListener('storage', (event) => {
            if (event.key !== LOGOUT_EVENT_KEY || !event.newValue) return;
            clearSessionKeys();
            callback?.();
        });
    }
};
