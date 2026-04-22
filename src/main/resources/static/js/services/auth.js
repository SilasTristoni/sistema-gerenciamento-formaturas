const STORAGE_PREFIX = 'gestaoform';
const SESSION_KEYS = {
    token: `${STORAGE_PREFIX}.token`,
    perfil: `${STORAGE_PREFIX}.perfil`,
    nome: `${STORAGE_PREFIX}.nome`,
    login: `${STORAGE_PREFIX}.login`
};
const PREFERENCE_KEYS = {
    remember: `${STORAGE_PREFIX}.remember`,
    lastLogin: `${STORAGE_PREFIX}.lastLogin`,
    lastPerfil: `${STORAGE_PREFIX}.lastPerfil`,
    lastNome: `${STORAGE_PREFIX}.lastNome`
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

function writeValue(storage, key, value) {
    if (!storage || value == null || value === '') return;
    storage.setItem(key, value);
}

function readValue(key) {
    const session = safeStorage('sessionStorage');
    const local = safeStorage('localStorage');
    return session?.getItem(key) || local?.getItem(key) || null;
}

function readLocalValue(key) {
    return safeStorage('localStorage')?.getItem(key) || null;
}

function clearSessionKeys() {
    removeKeys(safeStorage('sessionStorage'), Object.values(SESSION_KEYS));
    removeKeys(safeStorage('localStorage'), Object.values(SESSION_KEYS));
    removeKeys(safeStorage('sessionStorage'), LEGACY_KEYS);
    removeKeys(safeStorage('localStorage'), LEGACY_KEYS);
}

function savePreferences({ login, perfil, nome, persistent }) {
    const local = safeStorage('localStorage');
    if (!local) return;

    local.setItem(PREFERENCE_KEYS.remember, persistent ? 'true' : 'false');
    if (login) local.setItem(PREFERENCE_KEYS.lastLogin, login);
    if (perfil) local.setItem(PREFERENCE_KEYS.lastPerfil, perfil);
    if (nome) local.setItem(PREFERENCE_KEYS.lastNome, nome);
}

export const auth = {
    getToken() {
        return readValue(SESSION_KEYS.token);
    },

    saveSession({ token, perfil, nome, login, persistent = false }) {
        clearSessionKeys();

        const target = persistent ? safeStorage('localStorage') : safeStorage('sessionStorage');
        writeValue(target, SESSION_KEYS.token, token);
        writeValue(target, SESSION_KEYS.perfil, perfil);
        writeValue(target, SESSION_KEYS.nome, nome);
        writeValue(target, SESSION_KEYS.login, login);
        savePreferences({ login, perfil, nome, persistent });
    },

    getSession() {
        return {
            token: readValue(SESSION_KEYS.token),
            perfil: readValue(SESSION_KEYS.perfil),
            nome: readValue(SESSION_KEYS.nome),
            login: readValue(SESSION_KEYS.login)
        };
    },

    shouldRememberSession() {
        return readLocalValue(PREFERENCE_KEYS.remember) === 'true';
    },

    getLastLogin() {
        return readLocalValue(PREFERENCE_KEYS.lastLogin);
    },

    getLastProfile() {
        return readLocalValue(PREFERENCE_KEYS.lastPerfil);
    },

    getLastName() {
        return readLocalValue(PREFERENCE_KEYS.lastNome);
    },

    clearSession() {
        clearSessionKeys();
    }
};
