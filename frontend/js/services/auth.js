const STORAGE_PREFIX = 'gestaoform';
const SESSION_KEYS = {
    token: `${STORAGE_PREFIX}.token`,
    perfil: `${STORAGE_PREFIX}.perfil`,
    nome: `${STORAGE_PREFIX}.nome`
};

const LEGACY_KEYS = ['token', 'perfil', 'nomeUsuario'];

function removeLegacyKeys() {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
}

export const auth = {
    getToken() {
        return sessionStorage.getItem(SESSION_KEYS.token);
    },

    saveSession({ token, perfil, nome }) {
        removeLegacyKeys();

        if (token) sessionStorage.setItem(SESSION_KEYS.token, token);
        if (perfil) sessionStorage.setItem(SESSION_KEYS.perfil, perfil);
        if (nome) sessionStorage.setItem(SESSION_KEYS.nome, nome);
    },

    clearSession() {
        sessionStorage.removeItem(SESSION_KEYS.token);
        sessionStorage.removeItem(SESSION_KEYS.perfil);
        sessionStorage.removeItem(SESSION_KEYS.nome);
        removeLegacyKeys();
    }
};
