import { api } from "./services/api.js";
import { auth } from "./services/auth.js";

let monthlyChart = null;
let categoryChart = null;
let filtersBound = false;
let reportActionsBound = false;

const DASHBOARD_FILTER_KEY = "gestaoform.dashboard.filters";
const DEFAULT_FILTERS = {
  turmaId: "",
  periodMonths: "6"
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

function formatCurrency(value = 0) {
  return currencyFormatter.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Sem data";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return dateFormatter.format(date);
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readDashboardFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem(DASHBOARD_FILTER_KEY) || "{}");
    return {
      turmaId: saved.turmaId || DEFAULT_FILTERS.turmaId,
      periodMonths: saved.periodMonths || DEFAULT_FILTERS.periodMonths
    };
  } catch (error) {
    return { ...DEFAULT_FILTERS };
  }
}

function writeDashboardFilters(filters) {
  localStorage.setItem(DASHBOARD_FILTER_KEY, JSON.stringify(filters));
}

function getDashboardFilters() {
  const filters = readDashboardFilters();
  return {
    turmaId: filters.turmaId ? Number(filters.turmaId) : undefined,
    periodMonths: Number(filters.periodMonths || DEFAULT_FILTERS.periodMonths)
  };
}

function syncFilterInputs() {
  const filters = readDashboardFilters();
  const turmaSelect = document.getElementById("dashboardTurmaFilter");
  const periodSelect = document.getElementById("dashboardPeriodFilter");
  if (turmaSelect) turmaSelect.value = filters.turmaId;
  if (periodSelect) periodSelect.value = filters.periodMonths;
}

function populateTurmaFilter(turmas = []) {
    const select = document.getElementById("dashboardTurmaFilter");
    if (!select) return;

    const currentValue = readDashboardFilters().turmaId;
  select.innerHTML = `
    <option value="">Todas as turmas</option>
    ${turmas.map(turma => `<option value="${turma.id}">${escapeHtml(turma.nome || "Turma")}</option>`).join("")}
  `;
  select.value = turmas.some(turma => String(turma.id) === currentValue) ? currentValue : "";
}

function normalizeDashboardFiltersForTurmas(turmas = []) {
  const filters = readDashboardFilters();
  if (filters.turmaId && !turmas.some(turma => String(turma.id) === filters.turmaId)) {
    filters.turmaId = "";
    writeDashboardFilters(filters);
  }
}

function bindDashboardFilters() {
  if (filtersBound) return;

  document.getElementById("dashboardTurmaFilter")?.addEventListener("change", event => {
    const filters = readDashboardFilters();
    filters.turmaId = event.target.value || "";
    writeDashboardFilters(filters);
    loadDashboard().catch(console.error);
  });

  document.getElementById("dashboardPeriodFilter")?.addEventListener("change", event => {
    const filters = readDashboardFilters();
    filters.periodMonths = event.target.value || DEFAULT_FILTERS.periodMonths;
    writeDashboardFilters(filters);
    loadDashboard().catch(console.error);
  });

  filtersBound = true;
}

function showState({ loading = false, error = "" } = {}) {
  document.getElementById("loadingState")?.classList.toggle("hidden", !loading);
  document.getElementById("errorState")?.classList.toggle("hidden", !error);
  if (error) setText("errorMessage", error);
}

function renderList(containerId, items, formatter, emptyMessage) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items?.length) {
    container.innerHTML = `<div class="summary-row"><span>${escapeHtml(emptyMessage)}</span></div>`;
    return;
  }

  container.innerHTML = items.map(formatter).join("");
}

function destroyCharts() {
  monthlyChart?.destroy?.();
  categoryChart?.destroy?.();
  monthlyChart = null;
  categoryChart = null;
}

function renderCharts(monthlyFinancial = [], expenseCategories = []) {
  const monthlyCanvas = document.getElementById("monthlyChart");
  const categoryCanvas = document.getElementById("categoryChart");
  if (!monthlyCanvas || !categoryCanvas || typeof Chart === "undefined") return;

  destroyCharts();

  monthlyChart = new Chart(monthlyCanvas, {
    type: "bar",
    data: {
      labels: monthlyFinancial.map(item => item.monthLabel),
      datasets: [
        {
          label: "Receitas",
          data: monthlyFinancial.map(item => item.receitas),
          backgroundColor: "rgba(52, 211, 153, 0.72)",
          borderRadius: 10,
          maxBarThickness: 26
        },
        {
          label: "Despesas",
          data: monthlyFinancial.map(item => item.despesas),
          backgroundColor: "rgba(248, 113, 113, 0.72)",
          borderRadius: 10,
          maxBarThickness: 26
        },
        {
          label: "Saldo",
          data: monthlyFinancial.map(item => item.saldo),
          type: "line",
          tension: 0.38,
          borderColor: "#4fd1c5",
          pointBackgroundColor: "#4fd1c5",
          pointRadius: 4
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#e2e8f0",
            usePointStyle: true,
            boxWidth: 10
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#9fb1c7" },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: "#9fb1c7",
            callback: value => formatCurrency(value)
          },
          grid: { color: "rgba(159, 177, 199, 0.12)" }
        }
      }
    }
  });

  categoryChart = new Chart(categoryCanvas, {
    type: "doughnut",
    data: {
      labels: expenseCategories.map(item => item.categoria),
      datasets: [{
        data: expenseCategories.map(item => item.valor),
        backgroundColor: [
          "rgba(79, 209, 197, 0.8)",
          "rgba(246, 197, 95, 0.8)",
          "rgba(248, 113, 113, 0.8)",
          "rgba(96, 165, 250, 0.8)",
          "rgba(196, 181, 253, 0.8)"
        ],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e2e8f0",
            usePointStyle: true,
            boxWidth: 10,
            padding: 18
          }
        }
      }
    }
  });
}

function showTab(tabId) {
  document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  document.getElementById(`tab-${tabId}`)?.classList.add("active");
  document.querySelector(`.nav-item[data-tab-target="${tabId}"]`)?.classList.add("active");
}

function bindNavigation() {
  document.querySelectorAll("[data-tab-target]").forEach(item => {
    item.addEventListener("click", () => showTab(item.dataset.tabTarget));
  });

  document.getElementById("scrollAlertsBtn")?.addEventListener("click", () => {
    document.getElementById("alertsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function redirectToLogin() {
  window.location.href = "./login.html";
}

async function validateSession() {
  const token = auth.getToken();
  if (!token) {
    redirectToLogin();
    return null;
  }

  try {
    const me = await api.me();
    if (me.perfil !== "ROLE_COMISSAO") {
      window.location.href = "./aluno.html";
      return null;
    }

    setText("userName", me.nome || "Usuario");
    setText("userRole", me.perfil === "ROLE_COMISSAO" ? "Comissao" : "Formando(a)");
    const avatar = document.getElementById("userAvatar");
    if (avatar) avatar.textContent = (me.nome || "U").charAt(0).toUpperCase();
    auth.saveSession({ token, perfil: me.perfil, nome: me.nome, login: me.login || me.email || "usuario" });
    return me;
  } catch (error) {
    auth.clearSession();
    redirectToLogin();
    return null;
  }
}

function renderFilterSummary(filters = {}, forecast = {}) {
  setText("dashboardScopeLabel", filters.scopeLabel || "Visao consolidada de todas as turmas");
  setText(
    "dashboardFilterHint",
    `${filters.turmaNome || "Todas as turmas"} | Janela de ${filters.periodMonths || DEFAULT_FILTERS.periodMonths} meses | Tendencia ${forecast.trend || "neutral"}`
  );
}

function renderOverview(data) {
  const overview = data.overview || {};
  const operational = data.operational || {};
  const nextEvent = data.nextEvent || {};
  const forecast = data.forecast || {};

  setText("healthScore", overview.healthScore ?? 0);
  setText("lastUpdate", `Atualizado ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);

  setText("statSaldo", formatCurrency(overview.saldoTotal));
  setText("statReceitas", formatCurrency(overview.totalReceitas));
  setText("statDespesas", formatCurrency(overview.totalDespesas));
  setText("statTurmasAtivas", overview.totalTurmas ?? 0);

  setText("nextEventName", nextEvent.nome || "Nenhum evento agendado");
  setText("nextEventDate", nextEvent.data ? formatDate(nextEvent.data) : "Sem data definida");
  setText("nextEventLocation", nextEvent.local || "Local a definir");
  setText("nextEventStatus", (nextEvent.status || "planejamento").toUpperCase());
  setText("nextEventCountdown", nextEvent.diasRestantes >= 0 ? nextEvent.diasRestantes : "--");

  setText("opsEngajamento", `${Number(operational.percentualAdimplencia || 0).toFixed(1)}%`);
  setText("opsEventosMes", operational.eventosNoMes ?? 0);
  setText("opsVotacoes", operational.votacoesAbertas ?? 0);
  setText("opsTicketMedio", formatCurrency(operational.ticketMedioPorAluno));

  setText("summaryEvents", `${overview.totalEventos ?? 0} eventos`);
  setText("summaryTurmas", `${overview.totalTurmas ?? 0} turmas`);
  setText("financeSaldo", formatCurrency(overview.saldoTotal));
  setText("financeReceitas", formatCurrency(overview.totalReceitas));
  setText("financeDespesas", formatCurrency(overview.totalDespesas));
  setText("financeVotacoes", overview.totalVotacoes ?? 0);
  setText("financeProjectedBalance", formatCurrency(forecast.projectedNextBalance));
  setText("financeAverageNet", formatCurrency(forecast.averageNet));
  setText("forecastRecommendation", forecast.recommendation || "Sem previsao calculada ainda.");

  renderFilterSummary(data.filters, forecast);
}

function renderAlerts(alerts = []) {
  renderList(
    "alertsList",
    alerts,
    item => `
      <article class="alert-item alert-${escapeHtml(item.level || "low")}">
        <p class="alert-title">${escapeHtml(item.title || "Sem alerta")}</p>
        <p class="alert-copy">${escapeHtml(item.description || "")}</p>
      </article>
    `,
    "Nenhum alerta relevante no momento."
  );
}

function renderEvents(events = []) {
  renderList(
    "agendaPreviewList",
    events,
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.nome || "Evento sem nome")}</p>
          <p class="item-subtitle">${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.local || "Local a definir")}</p>
        </div>
        <span class="status-badge">${escapeHtml(item.status || "agendado")}</span>
      </article>
    `,
    "Nenhum evento cadastrado."
  );

  renderList(
    "agendaTimeline",
    events,
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.nome || "Evento sem nome")}</p>
          <p class="item-subtitle">${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.local || "Local a definir")} | ${escapeHtml(item.diasRestantes >= 0 ? `${item.diasRestantes} dias restantes` : "Data indefinida")}</p>
        </div>
        <span class="status-badge">${escapeHtml(item.status || "agendado")}</span>
      </article>
    `,
    "Nenhum evento disponivel na agenda."
  );
}

function renderTransactions(transactions = []) {
  renderList(
    "recentTransactions",
    transactions,
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.descricao || "Lancamento")}</p>
          <p class="item-subtitle">${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.referencia || "Sem referencia")} | ${escapeHtml(item.turmaNome || "Sem turma")}</p>
        </div>
        <div class="item-side">
          <strong class="${(item.tipo || "").toLowerCase() === "receita" ? "money-positive" : "money-negative"}">
            ${(item.tipo || "").toLowerCase() === "receita" ? "+" : "-"} ${escapeHtml(formatCurrency(item.valor))}
          </strong>
        </div>
      </article>
    `,
    "Nenhum lancamento recente."
  );
}

function renderExpenses(expenses = []) {
  renderList(
    "expenseList",
    expenses,
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.categoria || "Sem categoria")}</p>
          <p class="item-subtitle">Categoria de despesa monitorada pelo painel</p>
        </div>
        <div class="item-side">
          <strong class="money-negative">${escapeHtml(formatCurrency(item.valor))}</strong>
        </div>
      </article>
    `,
    "Nenhuma categoria de despesa encontrada."
  );
}

function renderTurmas(turmas = []) {
  renderList(
    "turmasRanking",
    turmas,
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.nome || "Turma sem nome")}</p>
          <p class="item-subtitle">${escapeHtml(item.curso || "Curso nao informado")} | ${escapeHtml(String(item.quantidadeAlunos || 0))} alunos</p>
        </div>
        <div class="item-side">
          <strong>${escapeHtml(formatCurrency(item.totalArrecadado))}</strong>
          <p class="item-subtitle">${escapeHtml(item.status || "emdia")}</p>
        </div>
      </article>
    `,
    "Nenhuma turma disponivel."
  );
}

function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(1).replace(".", ",")}%`;
}

function formatRunway(value = 0) {
  const numericValue = Number(value || 0);
  if (numericValue <= 0) return "Sem base";
  return `${numericValue.toFixed(1).replace(".", ",")} meses`;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function renderReportModule(report) {
  const summary = report?.summary || {};

  setText("reportCurrentBalance", formatCurrency(summary.saldoAtualEscopo));
  setText("reportAverageNet", formatCurrency(summary.resultadoMedioMensal));
  setText("reportContributionShare", formatPercent(summary.participacaoContribuicoesReceita));
  setText("reportRunwayMonths", formatRunway(summary.coberturaCaixaMeses));

  renderList(
    "reportInsightsList",
    report?.insights || [],
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.title || "Leitura")}</p>
          <p class="item-subtitle">${escapeHtml(item.description || "")}</p>
        </div>
        <span class="insight-pill insight-pill--${escapeHtml(item.tone || "info")}">${escapeHtml(item.tone || "info")}</span>
      </article>
    `,
    "Nenhum insight disponivel para o recorte atual."
  );

  renderList(
    "reportMonthlyList",
    report?.monthlyIndicators || [],
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.monthLabel || "--")}</p>
          <p class="item-subtitle">
            Receitas ${escapeHtml(formatCurrency(item.receitas))} | Despesas ${escapeHtml(formatCurrency(item.despesas))} | Contribuicoes ${escapeHtml(formatCurrency(item.contribuicoes))}
          </p>
        </div>
        <div class="item-side">
          <strong class="${Number(item.saldo || 0) >= 0 ? "money-positive" : "money-negative"}">${escapeHtml(formatCurrency(item.saldo))}</strong>
        </div>
      </article>
    `,
    "Sem indicadores mensais no periodo selecionado."
  );

  renderList(
    "reportTopTurmasList",
    report?.topTurmas || [],
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.nome || "Turma")}</p>
          <p class="item-subtitle">${escapeHtml(item.curso || "Curso nao informado")} | ${escapeHtml(String(item.quantidadeAlunos || 0))} alunos | status ${escapeHtml(item.status || "emdia")}</p>
        </div>
        <div class="item-side">
          <strong>${escapeHtml(formatCurrency(item.totalArrecadado))}</strong>
          <p class="item-subtitle">${escapeHtml(formatPercent(item.percentualMeta))} da meta</p>
        </div>
      </article>
    `,
    "Nenhuma turma disponivel para este recorte."
  );

  renderList(
    "reportTransactionsList",
    report?.recentTransactions || [],
    item => `
      <article class="list-item">
        <div class="item-main">
          <p class="item-title">${escapeHtml(item.descricao || "Lancamento")}</p>
          <p class="item-subtitle">
            ${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.turmaNome || "Sem turma")} | ${escapeHtml(item.contribuicao ? "contribuicao" : (item.tipo || "movimento"))}
          </p>
        </div>
        <div class="item-side">
          <strong class="${(item.tipo || "").toLowerCase() === "receita" ? "money-positive" : "money-negative"}">${escapeHtml(formatCurrency(item.valor))}</strong>
          <p class="item-subtitle">${escapeHtml(item.referencia || item.apoiadorNome || "Sem referencia")}</p>
        </div>
      </article>
    `,
    "Nenhum lancamento encontrado no periodo."
  );
}

function bindReportActions() {
  if (reportActionsBound) return;

  const bindAction = (id, resourcePath, successMessage) => {
    document.getElementById(id)?.addEventListener("click", async () => {
      try {
        const { blob, filename } = await api.exportarRelatorioFinanceiro(resourcePath, getDashboardFilters());
        downloadBlob(blob, filename);
      } catch (error) {
        window.alert(error.message || successMessage);
      }
    });
  };

  bindAction("exportReportPdfBtn", "resumo.pdf", "Nao foi possivel gerar o PDF.");
  bindAction("exportReportSummaryCsvBtn", "resumo.csv", "Nao foi possivel gerar o CSV resumo.");
  bindAction("exportReportTransactionsCsvBtn", "lancamentos.csv", "Nao foi possivel gerar o CSV detalhado.");
  reportActionsBound = true;
}

async function loadDashboard() {
  showState({ loading: true, error: "" });

  const session = await validateSession();
  if (!session) return;

  try {
    syncFilterInputs();
    const turmas = await api.buscar("turmas");
    normalizeDashboardFiltersForTurmas(turmas);
    populateTurmaFilter(turmas);
    syncFilterInputs();
    const filters = getDashboardFilters();
    const [dashboard, report] = await Promise.all([
      api.dashboardResumo(filters),
      api.relatorioFinanceiro(filters)
    ]);

    renderOverview(dashboard);
    renderAlerts(dashboard.alerts);
    renderEvents(dashboard.upcomingEvents);
    renderTransactions(dashboard.recentTransactions);
    renderExpenses(dashboard.expenseCategories);
    renderTurmas(dashboard.topTurmas);
    renderReportModule(report);
    renderCharts(dashboard.monthlyFinancial, dashboard.expenseCategories);
    showState({ loading: false, error: "" });
  } catch (error) {
    showState({ loading: false, error: error.message || "Nao foi possivel carregar os dados." });
  }
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.clearSession();
  redirectToLogin();
});

document.getElementById("refreshBtn")?.addEventListener("click", () => {
  loadDashboard().catch(console.error);
});

syncFilterInputs();
bindNavigation();
bindDashboardFilters();
bindReportActions();
loadDashboard().catch(console.error);
