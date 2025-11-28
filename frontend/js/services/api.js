const API_BASE = 'http://localhost:8080/api/cadastro';

export const api = {
    async buscar(endpoint) {
        try {
            const response = await fetch(`${API_BASE}/${endpoint}`);
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error(`Erro ao buscar ${endpoint}:`, error);
            throw error;
        }
    },

    async salvar(endpoint, payload) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const texto = await response.text();
                throw new Error(texto);
            }
            return true;
        } catch (error) {
            console.error(`Erro ao salvar em ${endpoint}:`, error);
            throw error;
        }
    }
};