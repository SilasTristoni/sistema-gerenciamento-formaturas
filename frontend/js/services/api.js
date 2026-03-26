import { auth } from './auth.js';

const API_URL = "http://localhost:8080/api";
const CADASTRO_URL = `${API_URL}/cadastro`;
const AUTH_URL = `${API_URL}/auth`;
const VOTACAO_URL = `${API_URL}/votacoes`;

function authHeaders(isJson = true) {
    const token = auth.getToken();
    const headers = {};

    if (isJson) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return headers;
}

async function parseResponse(response) {
    if (response.status === 401) throw new Error("Sessão expirada");
    if (response.status === 403) throw new Error("Acesso negado");

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erro na requisição");
    }

    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json") ? response.json() : response.text();
}

export const api = {
    async login(login, senha) {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: authHeaders(true),
            body: JSON.stringify({ login, senha })
        });
        return parseResponse(response);
    },

    async me() {
        const response = await fetch(`${AUTH_URL}/me`, {
            method: "GET",
            headers: authHeaders(false)
        });
        return parseResponse(response);
    },

    async buscar(endpoint) {
        const response = await fetch(`${CADASTRO_URL}/${endpoint}`, {
            method: "GET",
            headers: authHeaders(false)
        });
        return parseResponse(response);
    },

    async salvar(endpoint, payload, method = "POST") {
        const response = await fetch(`${CADASTRO_URL}${endpoint}`, {
            method,
            headers: authHeaders(true),
            body: JSON.stringify(payload)
        });
        return parseResponse(response);
    },

    async deletar(endpoint) {
        const response = await fetch(`${CADASTRO_URL}${endpoint}`, {
            method: "DELETE",
            headers: authHeaders(false)
        });
        return parseResponse(response);
    },

    async votar(votacaoId, opcaoId) {
        const response = await fetch(`${VOTACAO_URL}/votar`, {
            method: "POST",
            headers: authHeaders(true),
            body: JSON.stringify({ votacaoId, opcaoId })
        });
        return parseResponse(response);
    },

    async importarAlunosCSV(file, turmaId) {
        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("turmaId", turmaId);

        const response = await fetch(`${CADASTRO_URL}/alunos/importar`, {
            method: "POST",
            headers: authHeaders(false),
            body: formData
        });
        return parseResponse(response);
    }
};
