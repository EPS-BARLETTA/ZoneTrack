const modeLabels = {
    leftright: '3 zones gauche/droite',
    frontback: '3 zones avant/arrière',
    '4corners': '9 zones : coins + fautes'
};

const BASE_RACKET_ZONES = {
    threeZone: ['centre', 'exterieur'],
    nineZone: ['centre', 'coins', 'autres', 'fautes']
};

// Préparation multi-sports : les structures ci-dessous faciliteront l'ajout futur
// de sports (buts, paniers, embuts, etc.) sans toucher au moteur actuel.
const SPORT_ARCHITECTURE = {
    badminton: {
        label: 'Badminton',
        phases: ['impacts', 'services', 'précision'],
        zones: BASE_RACKET_ZONES
    },
    tennis_de_table: {
        label: 'Tennis de table',
        phases: ['impacts', 'services', 'précision'],
        zones: BASE_RACKET_ZONES
    },
    pickleball: {
        label: 'Pickleball',
        phases: ['impacts', 'services', 'zone non-volée'],
        zones: BASE_RACKET_ZONES
    }
};

const ACTOR_TYPES = {
    players: { label: 'Joueurs', nomLabels: ['Joueur 1', 'Joueur 2'] },
    teams: { label: 'Équipes', nomLabels: ['Équipe A', 'Équipe B'] }
};

const OBSERVER_DEFAULT = 'Observateur';

const POINT_LABELS = {
    center: 'Centre',
    extreme: 'Extérieur',
    corner: 'Coins',
    other: 'Autres',
    fault: 'Fautes'
};

const POINT_TYPE_ORDER = ['center', 'extreme', 'corner', 'other', 'fault'];
const ACTOR_WARNING_TEXT = 'Veuillez renseigner les noms des acteurs avant de commencer l’analyse.';

const SHARED_TERRAIN_MODES = [
    { id: 'leftright', label: '3 zones gauche/droite' },
    { id: 'frontback', label: '3 zones avant/arrière' },
    { id: '4corners', label: '9 zones : coins + fautes' }
];

const SPORT_MODE_OPTIONS = {
    badminton: SHARED_TERRAIN_MODES,
    tennis_de_table: SHARED_TERRAIN_MODES,
    pickleball: SHARED_TERRAIN_MODES
};

const state = {
    mode: 'leftright',
    centerSize: 33,
    points: { center: 1, extreme: 3, corner: 5, other: 3, fault: 2 },
    names: { p1: ACTOR_TYPES.players.nomLabels[0], p2: ACTOR_TYPES.players.nomLabels[1], obs: OBSERVER_DEFAULT },
    classe: '',
    actorType: 'players',
    sport: 'badminton',
    scores: { p1: 0, p2: 0 },
    stats: {
        p1: { center: 0, extreme: 0, corner: 0, other: 0, fault: 0 },
        p2: { center: 0, extreme: 0, corner: 0, other: 0, fault: 0 }
    },
    history: [],
    redoStack: [],
    heatmapMode: 'none',
    heatmapPoints: []
};

let chart1;
let chart2;
const HEATMAP_GRID = 12;
const HEATMAP_SPORTS = new Set(['badminton', 'tennis_de_table', 'pickleball']);
const HEATMAP_POINT_VALUE = 1;
const HEATMAP_RADIUS = 22;
const HEATMAP_BLUR = 13;
const HEATMAP_PALETTES = {
    global: [
        { threshold: 0.8, hex: '#FF3B30' },
        { threshold: 0.6, hex: '#FF8A00' },
        { threshold: 0.4, hex: '#FFD400' },
        { threshold: 0.2, hex: '#00D084' },
        { threshold: 0, hex: '#00B4FF' }
    ],
    p1: [
        { threshold: 0.7, hex: '#00C853' },
        { threshold: 0.45, hex: '#00E676' },
        { threshold: 0.2, hex: '#00D4FF' },
        { threshold: 0, hex: '#3FA9FF' }
    ],
    p2: [
        { threshold: 0.7, hex: '#FF3D00' },
        { threshold: 0.45, hex: '#FF7043' },
        { threshold: 0.2, hex: '#FF8A65' },
        { threshold: 0, hex: '#FF6EC7' }
    ]
};

const els = {
    modeSelect: document.getElementById('modeSelect'),
    centerSizeSlider: document.getElementById('centerSizeSlider'),
    centerSizeLabel: document.getElementById('centerSizeLabel'),
    centerSizeGroup: document.getElementById('center-size-group'),
    pointsContainer: document.getElementById('pointsContainer'),
    actorTypeSelect: document.getElementById('actorTypeSelect'),
    classInput: document.getElementById('classInput'),
    sportSelect: document.getElementById('sportSelect'),
    p1Name: document.getElementById('p1Name'),
    p2Name: document.getElementById('p2Name'),
    obsName: document.getElementById('obsName'),
    heatmapToggle: document.getElementById('toggle-heatmap'),
    actorValidationMsg: document.getElementById('actorValidationMsg'),
    startAppBtn: document.getElementById('startAppBtn'),
    openHelpBtn: document.getElementById('openHelpBtn'),
    backToLandingBtn: document.getElementById('backToLandingBtn'),
    backHomeBtn: document.getElementById('backHomeBtn'),
    landingScreen: document.getElementById('landingScreen'),
    helpScreen: document.getElementById('helpScreen'),
    appShell: document.getElementById('appShell'),
    previewContainer: document.getElementById('preview-container'),
    gameContainer: document.getElementById('game-container'),
    dashName1: document.getElementById('dashName1'),
    dashName2: document.getElementById('dashName2'),
    dashScore1: document.getElementById('dashScore1'),
    dashScore2: document.getElementById('dashScore2'),
    dashRatio1: document.getElementById('dashRatio1'),
    dashRatio2: document.getElementById('dashRatio2'),
    undoBtn: document.getElementById('undoBtn'),
    redoBtn: document.getElementById('redoBtn'),
    resetBtn: document.getElementById('resetBtn'),
    confirmResetBtn: document.getElementById('confirmResetBtn'),
    showQRBtn: document.getElementById('showQRBtn'),
    qrCodeOutput: document.getElementById('qrCodeOutput'),
    qrJsonPreview: document.getElementById('qrJsonPreview'),
    tabs: document.querySelectorAll('button[data-bs-toggle="tab"]'),
    chartTitle1: document.getElementById('chartTitle1'),
    chartTitle2: document.getElementById('chartTitle2'),
    statRatioVal1: document.getElementById('statRatioVal1'),
    statRatioVal2: document.getElementById('statRatioVal2')
};

const modals = {
    reset: new bootstrap.Modal(document.getElementById('resetModal')),
    qr: new bootstrap.Modal(document.getElementById('qrModal'))
};

function init() {
    initializeSportContext();
    updateModeSelectOptions(true);
    applyActorTypeContext(state.actorType, true);
    if (els.obsName) {
        els.obsName.dataset.defaultValue = OBSERVER_DEFAULT;
    }
    registerDefaultInputClearing();
    state.classe = els.classInput.value.trim();
    setupEventListeners();
    updateHeatmapToggleState();
    updatePointsConfigUI();
    renderCourts();
    updateDashboard();
    initCharts();
    updateActorValidationUI();
    attachScreenEvents();
}

document.addEventListener('DOMContentLoaded', init);

function setupEventListeners() {
    els.modeSelect.addEventListener('change', (e) => {
        state.mode = e.target.value;
        updateCenterSizeVisibility();
        updatePointsConfigUI();
        renderCourts();
        resetGameData();
    });

    els.centerSizeSlider.addEventListener('input', (e) => {
        state.centerSize = parseInt(e.target.value, 10);
        els.centerSizeLabel.textContent = `${state.centerSize}%`;
        renderCourts();
    });

    ['p1', 'p2', 'obs'].forEach((key) => {
        els[`${key}Name`].addEventListener('input', (event) => {
            state.names[key] = event.target.value;
            updateDashboard();
            if (key !== 'obs') updateActorValidationUI();
        });
    });

    els.actorTypeSelect.addEventListener('change', (event) => {
        const previousType = state.actorType;
        state.actorType = event.target.value;
        applyActorTypeContext(state.actorType, false, previousType);
        updateActorValidationUI();
    });

    els.classInput.addEventListener('input', (event) => {
        state.classe = event.target.value.trim();
    });

    if (els.sportSelect) {
        els.sportSelect.addEventListener('change', (event) => {
            state.sport = event.target.value;
            initializeSportContext();
            updateModeSelectOptions();
            updatePointsConfigUI();
            resetGameData();
            renderCourts();
            updateHeatmapToggleState();
        });
    }

    if (els.heatmapToggle) {
        els.heatmapToggle.checked = state.heatmapMode !== 'none';
        els.heatmapToggle.addEventListener('change', (event) => {
            state.heatmapMode = event.target.checked ? 'global' : 'none';
            renderHeatmap();
        });
    }

    els.undoBtn.addEventListener('click', undo);
    els.redoBtn.addEventListener('click', redo);
    els.resetBtn.addEventListener('click', () => modals.reset.show());
    els.confirmResetBtn.addEventListener('click', () => {
        resetGameData();
        modals.reset.hide();
    });
    els.showQRBtn.addEventListener('click', generateQR);

    els.gameContainer.addEventListener('mousedown', handleImpact);
    els.gameContainer.addEventListener('touchstart', (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        handleImpact({
            clientX: touch.clientX,
            clientY: touch.clientY,
            target
        });
    }, { passive: false });

    els.tabs.forEach((tab) => {
        tab.addEventListener('show.bs.tab', (event) => {
            if (event.target.id === 'game-tab' && !ensureActorsValid(true)) {
                event.preventDefault();
            }
        });
        tab.addEventListener('shown.bs.tab', (event) => {
            if (event.target.id === 'stats-tab') {
                updateCharts();
            }
        });
    });
}

function initializeSportContext() {
    const defaultKey = 'badminton';
    if (!SPORT_ARCHITECTURE[state.sport]) {
        state.sport = defaultKey;
    }
    if (els.sportSelect) {
        els.sportSelect.value = state.sport;
    }
    return SPORT_ARCHITECTURE[state.sport] || SPORT_ARCHITECTURE[defaultKey];
}

function heatmapSupported() {
    return HEATMAP_SPORTS.has(state.sport);
}

function getSportModeOptions() {
    return SPORT_MODE_OPTIONS[state.sport] || SPORT_MODE_OPTIONS.badminton;
}

function getDefaultModeForSport(options) {
    const available = options && options.length ? options : getSportModeOptions();
    return available.length ? available[0].id : 'leftright';
}

function updateModeSelectOptions(preserveMode = false) {
    if (!els.modeSelect) return;
    const options = getSportModeOptions();
    if (!options.length) return;
    const hasCurrent = options.some((option) => option.id === state.mode);
    if (!preserveMode || !hasCurrent) {
        state.mode = hasCurrent ? state.mode : getDefaultModeForSport(options);
    }
    els.modeSelect.innerHTML = options.map((option) => `<option value="${option.id}">${option.label}</option>`).join('');
    els.modeSelect.value = state.mode;
    updateCenterSizeVisibility();
}

function updateCenterSizeVisibility() {
    if (!els.centerSizeGroup) return;
    els.centerSizeGroup.classList.remove('hidden');
}

function getActiveZoneTypes() {
    return state.mode === '4corners'
        ? ['center', 'corner', 'other', 'fault']
        : ['center', 'extreme'];
}

function modeHasExtendedCategories() {
    if (state.mode === '4corners') return true;
    return getActiveZoneTypes().some((type) => type === 'other' || type === 'fault');
}

function updateHeatmapToggleState() {
    if (!els.heatmapToggle) return;
    const supported = heatmapSupported();
    els.heatmapToggle.disabled = !supported;
    if (!supported) {
        state.heatmapMode = 'none';
        els.heatmapToggle.checked = false;
        state.heatmapPoints = [];
        renderHeatmap();
    } else {
        els.heatmapToggle.checked = state.heatmapMode !== 'none';
    }
}

function applyActorTypeContext(type, force = false, previousType = 'players') {
    const config = ACTOR_TYPES[type] || ACTOR_TYPES.players;
    const prevConfig = ACTOR_TYPES[previousType] || ACTOR_TYPES.players;
    const pairs = [
        { key: 'p1', input: els.p1Name, label: config.nomLabels[0], prevLabel: prevConfig.nomLabels[0] },
        { key: 'p2', input: els.p2Name, label: config.nomLabels[1], prevLabel: prevConfig.nomLabels[1] }
    ];
    pairs.forEach(({ key, input, label, prevLabel }) => {
        input.placeholder = label;
        input.dataset.defaultValue = label;
        const current = input.value.trim();
        if (force || current.length === 0 || current === prevLabel) {
            input.value = label;
            state.names[key] = label;
        }
    });
    els.actorTypeSelect.value = type;
    updateDashboard();
}

function registerDefaultInputClearing() {
    attachDefaultInputClearing(els.p1Name, 'p1');
    attachDefaultInputClearing(els.p2Name, 'p2');
    attachDefaultInputClearing(els.obsName, 'obs');
}

function attachDefaultInputClearing(input, stateKey) {
    if (!input) return;
    input.addEventListener('focus', () => {
        const defaultValue = (input.dataset.defaultValue || '').trim();
        if (defaultValue && input.value.trim() === defaultValue) {
            input.value = '';
            if (stateKey) {
                state.names[stateKey] = '';
                updateDashboard();
            }
        }
    });
}

function getActorDefaults() {
    const config = ACTOR_TYPES[state.actorType] || ACTOR_TYPES.players;
    return config.nomLabels;
}

function isActorFieldValid(playerKey) {
    const value = (state.names[playerKey] || '').trim();
    if (!value) return false;
    const defaults = getActorDefaults();
    const index = playerKey === 'p1' ? 0 : 1;
    const defaultValue = (defaults[index] || '').trim();
    return value.toLowerCase() !== defaultValue.toLowerCase();
}

function areActorsValid() {
    return isActorFieldValid('p1') && isActorFieldValid('p2');
}

function updateActorValidationUI() {
    const validP1 = isActorFieldValid('p1');
    const validP2 = isActorFieldValid('p2');
    toggleInvalidState(els.p1Name, validP1);
    toggleInvalidState(els.p2Name, validP2);
    if (els.actorValidationMsg) {
        if (validP1 && validP2) {
            els.actorValidationMsg.classList.add('d-none');
        } else {
            els.actorValidationMsg.classList.remove('d-none');
            els.actorValidationMsg.textContent = ACTOR_WARNING_TEXT;
        }
    }
}

function toggleInvalidState(input, isValid) {
    if (!input) return;
    input.classList.toggle('input-invalid', !isValid);
}

function ensureActorsValid(showAlert = false) {
    const valid = areActorsValid();
    updateActorValidationUI();
    if (!valid && showAlert) {
        alert(ACTOR_WARNING_TEXT);
    }
    return valid;
}

function attachScreenEvents() {
    if (els.startAppBtn) {
        els.startAppBtn.addEventListener('click', showAppScreen);
    }
    if (els.openHelpBtn) {
        els.openHelpBtn.addEventListener('click', showHelpScreen);
    }
    if (els.backToLandingBtn) {
        els.backToLandingBtn.addEventListener('click', showLandingScreen);
    }
    if (els.backHomeBtn) {
        els.backHomeBtn.addEventListener('click', showLandingScreen);
    }
}

function showLandingScreen() {
    toggleScreens('landing');
}

function showHelpScreen() {
    toggleScreens('help');
}

function showAppScreen() {
    updateHeatmapToggleState();
    toggleScreens('app');
}

function toggleScreens(target) {
    const { landingScreen, helpScreen, appShell } = els;
    if (!landingScreen || !helpScreen || !appShell) return;
    landingScreen.classList.remove('active');
    helpScreen.classList.remove('active');
    appShell.classList.add('hidden');

    if (target === 'landing') {
        landingScreen.classList.add('active');
    } else if (target === 'help') {
        helpScreen.classList.add('active');
    } else if (target === 'app') {
        appShell.classList.remove('hidden');
    }
}

function summarizeZonesForPlayer(playerKey) {
    const stats = state.stats[playerKey] || {};
    if (modeHasExtendedCategories()) {
        return {
            centre: toNumber(stats.center),
            coins: toNumber(stats.corner),
            autres: toNumber(stats.other),
            fautes: toNumber(stats.fault)
        };
    }
    const exterieur = toNumber(stats.extreme) + toNumber(stats.corner) + toNumber(stats.other) + toNumber(stats.fault);
    return {
        centre: toNumber(stats.center),
        exterieur
    };
}

function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function updatePointsConfigUI() {
    const activeTypes = getActiveZoneTypes();
    const html = POINT_TYPE_ORDER
        .filter((type) => activeTypes.includes(type))
        .map((type) => `
            <div class="col-6">
                <label class="form-label">${POINT_LABELS[type] || type}</label>
                <input type="number" class="form-control stat-input" data-stat="${type}" value="${state.points[type] ?? 0}">
            </div>
        `).join('');
    els.pointsContainer.innerHTML = html || '<div class="col-12 text-muted small">Aucune zone active pour ce mode.</div>';
    document.querySelectorAll('.stat-input').forEach((input) => {
        input.addEventListener('change', (event) => {
            state.points[event.target.dataset.stat] = parseInt(event.target.value, 10);
            renderCourts();
        });
    });
}

function generateCourtHTML() {
    return renderBadmintonCourtHTML();
}

function renderBadmintonCourtHTML() {
    const mode = state.mode;
    const isNine = mode === '4corners';
    const centerSize = state.centerSize;
    const sideSize = (100 - centerSize) / 2;
    const playerLayout = isNine ? 'layout-grid' : (mode === 'leftright' ? 'layout-col' : 'layout-row');

    const size3Zones = (index) => {
        if (mode === 'leftright') {
            return index === 1 ? `width:100%;height:${centerSize}%` : `width:100%;height:${sideSize}%`;
        }
        return index === 1 ? `width:${centerSize}%;height:100%` : `width:${sideSize}%;height:100%`;
    };

    const size9Zones = (index) => `width:${(index % 3 === 1) ? centerSize : sideSize}%;height:${(Math.floor(index / 3) === 1) ? centerSize : sideSize}%`;

    const renderZones = (playerCode) => {
        let zones = '';
        if (!isNine) {
            zones += `<div class="zone zone-extreme" data-points="${state.points.extreme}" data-player="${playerCode}" data-type="extreme" style="${size3Zones(0)}">${state.points.extreme}</div>`;
            zones += `<div class="zone zone-center" data-points="${state.points.center}" data-player="${playerCode}" data-type="center" style="${size3Zones(1)}">${state.points.center}</div>`;
            zones += `<div class="zone zone-extreme" data-points="${state.points.extreme}" data-player="${playerCode}" data-type="extreme" style="${size3Zones(2)}">${state.points.extreme}</div>`;
        } else {
            const types = ['corner', 'other', 'corner', 'other', 'center', 'other', 'corner', 'other', 'corner'];
            for (let i = 0; i < 9; i += 1) {
                zones += `<div class="zone zone-${types[i]}" data-points="${state.points[types[i]]}" data-player="${playerCode}" data-type="${types[i]}" style="${size9Zones(i)}">${state.points[types[i]]}</div>`;
            }
        }
        return zones;
    };

    let faultHtml = '';
    if (isNine) {
        const faultPoint = state.points.fault;
        faultHtml = `
            <div class="fault-area fault-top fault-p1-top" data-points="${faultPoint}" data-player="p2" data-type="fault">F</div>
            <div class="fault-area fault-top fault-p2-top" data-points="${faultPoint}" data-player="p1" data-type="fault">F</div>
            <div class="fault-area fault-bottom fault-p1-bot" data-points="${faultPoint}" data-player="p2" data-type="fault">F</div>
            <div class="fault-area fault-bottom fault-p2-bot" data-points="${faultPoint}" data-player="p1" data-type="fault">F</div>
            <div class="fault-area fault-left" data-points="${faultPoint}" data-player="p2" data-type="fault">F</div>
            <div class="fault-area fault-right" data-points="${faultPoint}" data-player="p1" data-type="fault">F</div>`;
    }

    return `
        <div class="court-wrapper ${isNine ? 'mode-9zones' : 'mode-3zones'}">
            <div class="court">
                <div class="player-area ${playerLayout}" id="area-p1">${renderZones('p1')}</div>
                <div class="net"></div>
                <div class="player-area ${playerLayout}" id="area-p2">${renderZones('p2')}</div>
            </div>
            ${faultHtml}
        </div>`;
}

function renderCourts() {
    const html = generateCourtHTML();
    els.previewContainer.innerHTML = html;
    const oldImpacts = els.gameContainer.querySelectorAll('.impact');
    els.gameContainer.innerHTML = html;
    const wrapper = els.gameContainer.querySelector('.court-wrapper');
    ensureHeatmapLayer(wrapper);
    oldImpacts.forEach((impact) => wrapper.appendChild(impact));
    renderHeatmap();
}

function handleImpact(event) {
    const target = event.target ? event.target.closest('.zone, .fault-area') : null;
    if (!target) return;
    const wrapper = els.gameContainer.querySelector('.court-wrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const impact = document.createElement('div');
    impact.className = 'impact';
    impact.style.left = `${event.clientX - rect.left}px`;
    impact.style.top = `${event.clientY - rect.top}px`;
    wrapper.appendChild(impact);

    const points = parseInt(target.getAttribute('data-points'), 10);
    const targetSide = target.getAttribute('data-player');
    const scoringPlayer = targetSide === 'p1' ? 'p2' : 'p1';
    const zoneType = target.getAttribute('data-type');
    applyScore(scoringPlayer, points, zoneType, 1);
    const heatmapPoint = addHeatmapPoint(event, wrapper, scoringPlayer);
    state.history.push({ impact, scoringPlayer, points, zoneType, heatmapPoint });
    state.redoStack = [];
    updateButtons();
}

function applyScore(player, points, zoneType, multiplier) {
    state.scores[player] += (points * multiplier);
    state.stats[player][zoneType] += multiplier;
    updateDashboard();
}

function undo() {
    if (state.history.length === 0) return;
    const action = state.history.pop();
    action.impact.remove();
    applyScore(action.scoringPlayer, action.points, action.zoneType, -1);
    removeHeatmapPoint(action.heatmapPoint);
    state.redoStack.push(action);
    updateButtons();
}

function redo() {
    if (state.redoStack.length === 0) return;
    const action = state.redoStack.pop();
    const wrapper = els.gameContainer.querySelector('.court-wrapper');
    if (!wrapper) return;
    wrapper.appendChild(action.impact);
    applyScore(action.scoringPlayer, action.points, action.zoneType, 1);
    reinstateHeatmapPoint(action.heatmapPoint);
    state.history.push(action);
    updateButtons();
}

function resetGameData() {
    state.scores = { p1: 0, p2: 0 };
    state.stats = {
        p1: { center: 0, extreme: 0, corner: 0, other: 0, fault: 0 },
        p2: { center: 0, extreme: 0, corner: 0, other: 0, fault: 0 }
    };
    state.history = [];
    state.redoStack = [];
    els.gameContainer.querySelectorAll('.impact').forEach((impact) => impact.remove());
    state.heatmapPoints = [];
    renderHeatmap();
    updateDashboard();
    updateButtons();
}

function calcRatio(player) {
    const stats = state.stats[player];
    const activeTypes = getActiveZoneTypes();
    const total = activeTypes.reduce((acc, type) => acc + toNumber(stats[type]), 0);
    if (total === 0) return 0;
    return (((total - toNumber(stats.center)) / total) * 100).toFixed(0);
}

function updateDashboard() {
    els.dashName1.textContent = state.names.p1;
    els.dashName2.textContent = state.names.p2;
    els.dashScore1.textContent = state.scores.p1;
    els.dashScore2.textContent = state.scores.p2;
    els.dashRatio1.textContent = `Ratio : ${calcRatio('p1')}%`;
    els.dashRatio2.textContent = `Ratio : ${calcRatio('p2')}%`;
}

function updateButtons() {
    els.undoBtn.disabled = state.history.length === 0;
    els.redoBtn.disabled = state.redoStack.length === 0;
}

function initCharts() {
    const config = {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }
    };
    chart1 = new Chart(document.getElementById('chartP1').getContext('2d'), JSON.parse(JSON.stringify(config)));
    chart2 = new Chart(document.getElementById('chartP2').getContext('2d'), JSON.parse(JSON.stringify(config)));
}

function updateCharts() {
    const updateChart = (chart, player, ratioEl) => {
        const stats = state.stats[player];
        if (modeHasExtendedCategories()) {
            chart.data.labels = ['Centre', 'Coins', 'Autres', 'Fautes'];
            chart.data.datasets[0].data = [stats.center, stats.corner, stats.other, stats.fault];
            chart.data.datasets[0].backgroundColor = ['#0078D7', '#D83B01', '#881798', '#E81123'];
        } else {
            chart.data.labels = ['Centre', 'Extérieur'];
            const exterior = toNumber(stats.extreme) + toNumber(stats.corner) + toNumber(stats.other) + toNumber(stats.fault);
            chart.data.datasets[0].data = [stats.center, exterior];
            chart.data.datasets[0].backgroundColor = ['#0078D7', '#E81123'];
        }
        chart.update();
        document.getElementById(ratioEl).textContent = `Ratio Extérieur : ${calcRatio(player)}%`;
    };
    els.chartTitle1.textContent = state.names.p1;
    els.chartTitle2.textContent = state.names.p2;
    updateChart(chart1, 'p1', 'statRatioVal1');
    updateChart(chart2, 'p2', 'statRatioVal2');
}

function ensureHeatmapLayer(wrapper) {
    if (!wrapper) return null;
    if (!heatmapSupported()) {
        wrapper.classList.remove('heatmap-active');
        const existing = wrapper.querySelector('.heatmap-layer');
        if (existing) existing.remove();
        return null;
    }
    let canvas = wrapper.querySelector('.heatmap-layer');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'heatmap-layer';
        wrapper.appendChild(canvas);
    }
    return canvas;
}

function addHeatmapPoint(event, wrapper, player) {
    if (!wrapper || !heatmapSupported()) return null;
    const rect = wrapper.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    const x = Math.min(0.999, Math.max(0, relX));
    const y = Math.min(0.999, Math.max(0, relY));
    const point = { x, y, player, value: HEATMAP_POINT_VALUE };
    state.heatmapPoints.push(point);
    renderHeatmap();
    return point;
}

function removeHeatmapPoint(point) {
    if (!point || !state.heatmapPoints.length) return;
    state.heatmapPoints = state.heatmapPoints.filter((p) => p !== point);
    renderHeatmap();
}

function reinstateHeatmapPoint(point) {
    if (!point || !heatmapSupported()) return;
    state.heatmapPoints.push(point);
    renderHeatmap();
}

function renderHeatmap() {
    const wrapper = els.gameContainer.querySelector('.court-wrapper');
    if (!wrapper) return;
    const canvas = ensureHeatmapLayer(wrapper);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = wrapper.clientWidth || wrapper.offsetWidth;
    const height = wrapper.clientHeight || wrapper.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    const datasets = getHeatmapDatasets();
    if (!datasets.length || state.heatmapMode === 'none') {
        wrapper.classList.remove('heatmap-active');
        return;
    }
    wrapper.classList.add('heatmap-active');
    datasets.forEach((dataset) => renderHeatmapDataset(ctx, width, height, dataset));
}

function getHeatmapDatasets() {
    if (!heatmapSupported()) return [];
    if (state.heatmapMode === 'none') return [];
    if (!state.heatmapPoints.length) return [];
    const filterByPlayer = (player) => state.heatmapPoints.filter((pt) => pt.player === player);
    switch (state.heatmapMode) {
        case 'global':
            return [{ points: state.heatmapPoints, palette: 'global' }];
        case 'p1':
            {
                const p1Points = filterByPlayer('p1');
                return p1Points.length ? [{ points: p1Points, palette: 'p1' }] : [];
            }
        case 'p2':
            {
                const p2Points = filterByPlayer('p2');
                return p2Points.length ? [{ points: p2Points, palette: 'p2' }] : [];
            }
        case 'dual':
            {
                const p1Points = filterByPlayer('p1');
                const p2Points = filterByPlayer('p2');
                const datasets = [];
                if (p1Points.length) datasets.push({ points: p1Points, palette: 'p1' });
                if (p2Points.length) datasets.push({ points: p2Points, palette: 'p2' });
                return datasets;
            }
        default:
            return [];
    }
}

function renderHeatmapDataset(ctx, width, height, dataset) {
    const pts = dataset.points || [];
    if (!pts.length) return;
    const cols = HEATMAP_GRID;
    const rows = HEATMAP_GRID;
    const counts = new Map();
    let maxCount = 0;
    const cellIndex = (pt) => {
        const gx = Math.min(cols - 1, Math.max(0, Math.floor(pt.x * cols)));
        const gy = Math.min(rows - 1, Math.max(0, Math.floor(pt.y * rows)));
        return gy * cols + gx;
    };
    pts.forEach((pt) => {
        const key = cellIndex(pt);
        const nextVal = (counts.get(key) || 0) + (pt.value || HEATMAP_POINT_VALUE);
        counts.set(key, nextVal);
        if (nextVal > maxCount) maxCount = nextVal;
    });
    if (maxCount === 0) return;
    const denom = Math.max(HEATMAP_POINT_VALUE, maxCount);
    pts.forEach((pt) => {
        const key = cellIndex(pt);
        const cellVal = counts.get(key) || 0;
        const normalized = denom > HEATMAP_POINT_VALUE
            ? Math.max(0, (cellVal - HEATMAP_POINT_VALUE) / (denom - HEATMAP_POINT_VALUE))
            : 0;
        const px = pt.x * width;
        const py = pt.y * height;
        drawHeatCircle(ctx, px, py, dataset.palette, normalized);
    });
}

function drawHeatCircle(ctx, x, y, paletteKey, intensity) {
    const baseRadius = HEATMAP_RADIUS;
    const gradientRadius = baseRadius + HEATMAP_BLUR;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
    const color = getHeatColor(intensity, paletteKey);
    const innerStop = Math.max(0.3, baseRadius / gradientRadius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(innerStop, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, gradientRadius, 0, Math.PI * 2);
    ctx.fill();
}

function getHeatColor(value, paletteKey = 'global') {
    const palette = HEATMAP_PALETTES[paletteKey] || HEATMAP_PALETTES.global;
    let hex = palette[palette.length - 1].hex;
    for (let i = 0; i < palette.length; i += 1) {
        if (value >= palette[i].threshold) {
            hex = palette[i].hex;
            break;
        }
    }
    const clamped = Math.max(0, Math.min(1, value));
    const alpha = 0.05 + clamped * 0.4;
    return hexToRgba(hex, alpha);
}

function hexToRgba(hex, alpha = 0.5) {
    const normalized = hex.replace('#', '');
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

function buildScanProfPayload() {
    const labels = ACTOR_TYPES[state.actorType] || ACTOR_TYPES.players;
    const baseAtelier = modeLabels[state.mode] || state.mode;
    const sportKey = state.sport || 'badminton';
    const participants = [
        buildParticipantPayload(labels.nomLabels[0], 'p1', baseAtelier),
        buildParticipantPayload(labels.nomLabels[1], 'p2', baseAtelier)
    ];

    return {
        appName: 'ZoneTrack',
        mode: sportKey,
        date: new Date().toISOString().split('T')[0],
        participants
    };
}

function buildParticipantPayload(label, playerKey, atelierLabel) {
    const zones = summarizeZonesForPlayer(playerKey);
    return {
        nom: label,
        prenom: (state.names[playerKey] || '').trim(),
        classe: state.classe || '',
        atelier: atelierLabel,
        score: toNumber(state.scores[playerKey]),
        ...zones
    };
}

function generateQR() {
    if (!ensureActorsValid(true)) return;
    const payload = buildScanProfPayload();
    const pretty = JSON.stringify(payload, null, 2);
    console.log(pretty);
    const json = JSON.stringify(payload);
    if (json.length > 2800) {
        alert('QR trop volumineux');
        return;
    }
    const qr = qrcode(0, 'M');
    qr.addData(json);
    qr.make();
    els.qrCodeOutput.innerHTML = qr.createImgTag(5);
    els.qrJsonPreview.textContent = pretty;
    modals.qr.show();
}
