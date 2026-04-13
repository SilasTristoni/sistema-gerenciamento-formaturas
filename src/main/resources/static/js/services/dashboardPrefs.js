const STORAGE_KEY = 'gestaoform.dashboard.prefs';

const DEFAULT_PREFS = {
    showTopStats: true,
    compactMode: false,
    widgets: [
        { id: 'saldo', label: 'Saldo em Caixa', visible: true },
        { id: 'fluxo', label: 'Fluxo Mensal', visible: true },
        { id: 'pendencias', label: 'Pendências', visible: true },
        { id: 'proximoEvento', label: 'Próximo Evento', visible: true },
        { id: 'atalhos', label: 'Atalhos Rápidos', visible: true },
        { id: 'resumo', label: 'Resumo Operacional', visible: true }
    ]
};

function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_PREFS));
}

function mergePrefs(saved) {
    const prefs = cloneDefaults();
    if (!saved || typeof saved !== 'object') return prefs;

    prefs.showTopStats = saved.showTopStats ?? prefs.showTopStats;
    prefs.compactMode = saved.compactMode ?? prefs.compactMode;

    if (Array.isArray(saved.widgets)) {
        const merged = [];
        const defaultMap = new Map(prefs.widgets.map(widget => [widget.id, widget]));

        saved.widgets.forEach(widget => {
            if (defaultMap.has(widget.id)) {
                const base = defaultMap.get(widget.id);
                merged.push({
                    ...base,
                    visible: widget.visible ?? base.visible
                });
                defaultMap.delete(widget.id);
            }
        });

        defaultMap.forEach(widget => merged.push(widget));
        prefs.widgets = merged;
    }

    return prefs;
}

function readPrefs() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return mergePrefs(raw ? JSON.parse(raw) : null);
    } catch (error) {
        return cloneDefaults();
    }
}

function writePrefs(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function applyTopStats(prefs) {
    const topStats = document.getElementById('dashboardTopStats');
    if (!topStats) return;
    topStats.classList.toggle('hidden', !prefs.showTopStats);
}

function applyCompactMode(prefs) {
    document.body.classList.toggle('dashboard-compact', !!prefs.compactMode);
}

function applyWidgetOrderAndVisibility(prefs) {
    const grid = document.getElementById('dashboardWidgetGrid');
    if (!grid) return;

    const widgetMap = new Map(
        Array.from(grid.querySelectorAll('[data-widget-id]')).map(el => [el.dataset.widgetId, el])
    );

    prefs.widgets.forEach(widget => {
        const element = widgetMap.get(widget.id);
        if (!element) return;
        element.classList.toggle('hidden', !widget.visible);
        grid.appendChild(element);
    });
}

function renderConfigList(prefs) {
    const list = document.getElementById('dashboardConfigList');
    if (!list) return;

    list.innerHTML = prefs.widgets.map((widget, index) => `
        <div class="dashboard-config-item">
            <div class="min-w-0">
                <p class="dashboard-config-title">${widget.label}</p>
                <p class="dashboard-config-subtitle">Widget ${index + 1}</p>
            </div>
            <div class="dashboard-config-actions">
                <label class="dashboard-switch">
                    <input type="checkbox" ${widget.visible ? 'checked' : ''} onchange="toggleDashboardWidget('${widget.id}', this.checked)">
                    <span>Mostrar</span>
                </label>
                <div class="flex items-center gap-2">
                    <button type="button" class="dashboard-icon-btn" onclick="moveDashboardWidget('${widget.id}', -1)" ${index === 0 ? 'disabled' : ''}>
                        <i class="ph ph-arrow-up"></i>
                    </button>
                    <button type="button" class="dashboard-icon-btn" onclick="moveDashboardWidget('${widget.id}', 1)" ${index === prefs.widgets.length - 1 ? 'disabled' : ''}>
                        <i class="ph ph-arrow-down"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function syncControls(prefs) {
    const topStatsToggle = document.getElementById('toggleTopStats');
    const compactToggle = document.getElementById('toggleCompactMode');
    if (topStatsToggle) topStatsToggle.checked = prefs.showTopStats;
    if (compactToggle) compactToggle.checked = prefs.compactMode;
}

function applyAll(prefs) {
    applyTopStats(prefs);
    applyCompactMode(prefs);
    applyWidgetOrderAndVisibility(prefs);
    syncControls(prefs);
    renderConfigList(prefs);
}

let currentPrefs = readPrefs();

function persistAndApply() {
    writePrefs(currentPrefs);
    applyAll(currentPrefs);
}

export const dashboardPrefs = {
    init() {
        currentPrefs = readPrefs();
        applyAll(currentPrefs);
    },

    open() {
        const modal = document.getElementById('dashboardSettingsModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        applyAll(currentPrefs);
    },

    close() {
        const modal = document.getElementById('dashboardSettingsModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    },

    toggleTopStats(checked) {
        currentPrefs.showTopStats = checked;
        persistAndApply();
    },

    toggleCompactMode(checked) {
        currentPrefs.compactMode = checked;
        persistAndApply();
    },

    toggleWidget(id, visible) {
        currentPrefs.widgets = currentPrefs.widgets.map(widget =>
            widget.id === id ? { ...widget, visible } : widget
        );
        persistAndApply();
    },

    moveWidget(id, direction) {
        const index = currentPrefs.widgets.findIndex(widget => widget.id === id);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= currentPrefs.widgets.length) return;
        const reordered = [...currentPrefs.widgets];
        const [item] = reordered.splice(index, 1);
        reordered.splice(nextIndex, 0, item);
        currentPrefs.widgets = reordered;
        persistAndApply();
    },

    reset() {
        currentPrefs = cloneDefaults();
        persistAndApply();
    }
};

window.openDashboardSettings = () => dashboardPrefs.open();
window.closeDashboardSettings = () => dashboardPrefs.close();
window.toggleDashboardTopStats = (checked) => dashboardPrefs.toggleTopStats(checked);
window.toggleDashboardCompactMode = (checked) => dashboardPrefs.toggleCompactMode(checked);
window.toggleDashboardWidget = (id, checked) => dashboardPrefs.toggleWidget(id, checked);
window.moveDashboardWidget = (id, direction) => dashboardPrefs.moveWidget(id, direction);
window.resetDashboardPreferences = () => dashboardPrefs.reset();
