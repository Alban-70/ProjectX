<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Filler,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const props = defineProps({
    goal: { type: Object, required: true },
    categoryName: { type: String, default: 'Sans catégorie' },
    logs: { type: Array, default: () => [] },
    totalProgress: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    isMinimumReached: Boolean,
    isTargetReached: Boolean,
    isBonusReached: Boolean,
    expandedHistory: Boolean,
    progressFormGoalId: [Number, String],
    deleting: Boolean,
})

const emit = defineEmits([
    'open-progress',
    'close-progress',
    'save-progress',
    'edit',
    'delete',
    'toggle-history',
])

const chartCanvas = ref(null)
let chartInstance = null

const progressValue = ref('')
const progressNote = ref('')

function renderChart() {
    if (!chartCanvas.value) return
    if (chartInstance) chartInstance.destroy()

    const sortedLogs = [...props.logs].reverse()
    let cumulative = 0
    const labels = ['Départ']
    const values = [0]

    sortedLogs.forEach(log => {
        cumulative += Number(log.value || 0)
        labels.push(
            new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'short',
            }).format(new Date(log.logged_at))
        )
        values.push(cumulative)
    })

    const ctx = chartCanvas.value.getContext('2d')
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    data: values,
                    borderColor: '#4d7358',
                    backgroundColor: 'rgba(77, 115, 88, 0.08)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#4d7358',
                    fill: true,
                    tension: 0.35,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#8d9b90' } },
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 }, color: '#8d9b90' } },
            },
        },
    })
}

function getGoalCumulativeValue(logId) {
    const chronologicalLogs = [...props.logs].reverse()
    let total = 0
    for (const log of chronologicalLogs) {
        total += Number(log.value || 0)
        if (log.id === logId) return total
    }
    return total
}

function formatValue(value) {
    if (value === null || value === undefined || value === '') return '—'
    return props.goal.unit ? `${value} ${props.goal.unit}` : `${value}`
}

function formatDate(val) {
    if (!val) return ''
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(val))
}

function handleProgressSubmit() {
    if (!progressValue.value) return
    emit('save-progress', {
        goalId: props.goal.id,
        value: Number(progressValue.value),
        note: progressNote.value.trim(),
    })
    progressValue.value = ''
    progressNote.value = ''
}

watch(
    () => props.logs,
    async () => {
        await nextTick()
        renderChart()
    },
    { deep: true }
)

onMounted(() => renderChart())
onBeforeUnmount(() => {
    if (chartInstance) chartInstance.destroy()
})
</script>

<template>
    <article class="px-dashboard-goal-card">
        <!-- CROIX DE SUPPRESSION (EN HAUT À DROITE) -->
        <button type="button" class="px-goal-delete-btn" title="Supprimer l'objectif" :disabled="deleting"
            @click="emit('delete', goal)">
            ×
        </button>

        <!-- EN-TÊTE DE LA CARTE -->
        <div class="px-dashboard-goal-header">
            <div>
                <span class="px-dashboard-goal-category">{{ categoryName }}</span>
                <div class="px-title-row">
                    <h3 class="px-dashboard-goal-title">{{ goal.title }}</h3>
                    <!-- BOUTON ÉDITER DISCRET (ICÔNE CRAYON / MODIFIER) -->
                    <button type="button" class="px-goal-edit-btn" title="Modifier" @click="emit('edit', goal)">
                        ✎
                    </button>
                </div>
                <p v-if="goal.description" class="px-dashboard-goal-description">
                    {{ goal.description }}
                </p>
            </div>
        </div>

        <!-- INDICATEURS MIN / TARGET / BONUS -->
        <div class="px-dashboard-goal-values">
            <div class="px-dashboard-goal-value">
                <span>Minimum</span>
                <strong>{{ formatValue(goal.minimum_value) }}</strong>
            </div>
            <div class="px-dashboard-goal-value is-target">
                <span>Target</span>
                <strong>{{ formatValue(goal.target_value) }}</strong>
            </div>
            <div class="px-dashboard-goal-value is-bonus">
                <span>Bonus</span>
                <strong>{{ formatValue(goal.bonus_value) }}</strong>
            </div>
        </div>

        <!-- BADGES NIVEAU REACHED -->
        <div v-if="isMinimumReached || isTargetReached || isBonusReached" class="px-dashboard-goal-level-status">
            <div v-if="isBonusReached" class="px-dashboard-goal-level-reached">
                <span>✓</span> Bonus atteint
            </div>
            <div v-else-if="isTargetReached" class="px-dashboard-goal-level-reached">
                <span>✓</span> Target atteint
            </div>
            <div v-else-if="isMinimumReached" class="px-dashboard-goal-level-reached">
                <span>✓</span> Minimum atteint
            </div>
        </div>

        <!-- SECTION PROGRESSION & BOUTON D'AJOUT -->
        <div class="px-progress-section">
            <div class="px-progress-top">
                <div>
                    <strong class="px-progress-percent">{{ progressPercent }}%</strong>
                    <span class="px-progress-sub">du Target ({{ formatValue(totalProgress) }})</span>
                </div>
                <!-- BOUTON D'ACTION AJOUTER PROGRESSION -->
                <button type="button" class="px-btn-add-progress" @click="emit('open-progress', goal)">
                    + Progression
                </button>
            </div>

            <!-- BARRE DE PROGRESSION ÉPURÉE (REMPLACE LE RECTANGLE FLOU) -->
            <div class="px-dashboard-goal-progress-track">
                <div class="px-dashboard-goal-progress-fill" :style="{ width: `${progressPercent}%` }"></div>
            </div>
        </div>

        <!-- CHART.JS -->
        <div v-if="logs.length" class="px-dashboard-goal-chart">
            <div class="px-dashboard-goal-chart-header">
                <span>Évolution</span>
                <small>Progression cumulée</small>
            </div>
            <div class="px-dashboard-goal-chart-container">
                <canvas ref="chartCanvas"></canvas>
            </div>
        </div>

        <!-- FORMULAIRE RAPIDE DE PROGRESSION -->
        <div v-if="progressFormGoalId === goal.id" class="px-dashboard-progress-form">
            <div class="px-dashboard-progress-form-header">
                <h4>Saisir une progression</h4>
                <button type="button" class="px-dashboard-goal-form-close" @click="emit('close-progress')">
                    ×
                </button>
            </div>

            <div class="px-dashboard-progress-fields">
                <div class="px-dashboard-form-field">
                    <label>Valeur à ajouter</label>
                    <div class="px-dashboard-progress-input">
                        <input v-model="progressValue" type="number" step="any" placeholder="Ex. 2" />
                        <span v-if="goal.unit">{{ goal.unit }}</span>
                    </div>
                </div>
                <div class="px-dashboard-form-field">
                    <label>Note rapide</label>
                    <input v-model="progressNote" type="text" placeholder="Ex. Séance du jour" />
                </div>
            </div>

            <div class="px-dashboard-progress-actions">
                <button type="button" class="px-dashboard-button-secondary" @click="emit('close-progress')">
                    Annuler
                </button>
                <button type="button" class="px-dashboard-button" @click="handleProgressSubmit">
                    Valider
                </button>
            </div>
        </div>

        <!-- HISTORIQUE ACCORDÉON -->
        <div v-if="logs.length" class="px-dashboard-goal-history">
            <button type="button" class="px-dashboard-goal-history-toggle" @click="emit('toggle-history', goal.id)">
                <span>
                    Historique <small>({{ logs.length }} entrée{{ logs.length > 1 ? 's' : '' }})</small>
                </span>
                <span class="px-dashboard-history-chevron">
                    {{ expandedHistory ? '−' : '+' }}
                </span>
            </button>

            <div v-if="expandedHistory" class="px-dashboard-goal-history-list">
                <div v-for="log in logs" :key="log.id" class="px-dashboard-goal-history-item">
                    <div class="px-dashboard-goal-history-main">
                        <strong>+{{ log.value }} <span v-if="goal.unit">{{ goal.unit }}, </span> </strong> 
                        <span v-if="log.note" class="px-dashboard-goal-history-note"> {{ log.note }}</span>
                        <time>{{ formatDate(log.logged_at) }}</time>
                    </div>
                    <div class="px-dashboard-goal-history-total">
                        <span>Cumul : </span>
                        <strong>{{ getGoalCumulativeValue(log.id) }} <span v-if="goal.unit">{{ goal.unit
                                }}</span></strong>
                    </div>
                </div>
            </div>
        </div>
    </article>
</template>

<style scoped>
.px-dashboard-goal-card {
    position: relative;
    padding: 24px;
    /* Fond de la carte en gris clair doux */
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 22px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
}

/* CROIX DE SUPPRESSION (EN HAUT À DROITE) */
.px-goal-delete-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #64748b;
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.px-goal-delete-btn:hover {
    background: #fef2f2;
    color: #ef4444;
    border-color: #fca5a5;
}

/* HEADER & TITRE */
.px-dashboard-goal-header {
    margin-bottom: 16px;
    padding-right: 28px;
}

.px-dashboard-goal-category {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.05em;
}

.px-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
}

.px-dashboard-goal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
}

/* BOUTON ÉDITER (CRAYON DISCRET) */
.px-goal-edit-btn {
    background: transparent;
    border: 0;
    color: #64748b;
    font-size: 14px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.px-goal-edit-btn:hover {
    color: #2563eb;
    background: #ffffff;
}

.px-dashboard-goal-description {
    margin: 4px 0 0;
    color: #475569;
    font-size: 12px;
}

/* INDICATEURS VALEURS (FONDS BLANCS POUR BIEN RESSORTIR SUR LE GRIS CLAIR) */
.px-dashboard-goal-values {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 14px;
}

.px-dashboard-goal-value {
    padding: 8px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    text-align: center;
}

.px-dashboard-goal-value span {
    display: block;
    font-size: 10px;
    color: #64748b;
    font-weight: 800;
}

.px-dashboard-goal-value strong {
    font-size: 13px;
    color: #0f172a;
    font-weight: 800;
}

.px-dashboard-goal-value.is-target {
    background: #eff6ff;
    border-color: #bfdbfe;
}

.px-dashboard-goal-value.is-target strong {
    color: #1d4ed8;
}

.px-dashboard-goal-value.is-bonus {
    background: #fffbee;
    border-color: #fde68a;
}

.px-dashboard-goal-value.is-bonus strong {
    color: #b45309;
}

/* BADGE STATUS */
.px-dashboard-goal-level-status {
    margin-bottom: 12px;
}

.px-dashboard-goal-level-reached {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: #f0fdf4;
    color: #166534;
    font-size: 11px;
    font-weight: 800;
    border-radius: 999px;
    border: 1px solid #bbf7d0;
}

.px-dashboard-goal-level-reached span {
    width: 14px;
    height: 14px;
    background: #16a34a;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
}

/* SECTION PROGRESSION ET BOUTON SOMBRE */
.px-progress-section {
    margin-top: 14px;
}

.px-progress-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.px-progress-percent {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin-right: 6px;
}

.px-progress-sub {
    font-size: 12px;
    color: #64748b;
    font-weight: 700;
}

.px-btn-add-progress {
    background: #1e293b;
    color: #ffffff;
    border: 0;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(30, 41, 59, 0.15);
    transition: transform 0.2s ease, background-color 0.2s ease;
}

.px-btn-add-progress:hover {
    transform: translateY(-1px);
    background: #0f172a;
}

/* BARRE DE PROGRESSION */
.px-dashboard-goal-progress-track {
    width: 100%;
    height: 8px;
    background: #cbd5e1;
    border-radius: 999px;
    overflow: hidden;
}

.px-dashboard-goal-progress-fill {
    height: 100%;
    background: #1e293b;
    border-radius: 999px;
    transition: width 0.4s ease;
}

/* CHART.JS (ÉVOLUTION) */
.px-dashboard-goal-chart {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #cbd5e1;
}

.px-dashboard-goal-chart-header {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 800;
    color: #64748b;
    margin-bottom: 6px;
}

.px-dashboard-goal-chart-container {
    height: 120px;
    position: relative;
    width: 100%;
}

/* FORMULAIRE RAPIDE */
.px-dashboard-progress-form {
    margin-top: 14px;
    padding: 14px;
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #cbd5e1;
}

.px-dashboard-progress-form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.px-dashboard-progress-form-header h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
}

.px-dashboard-goal-form-close {
    border: 0;
    background: transparent;
    font-size: 16px;
    cursor: pointer;
    color: #64748b;
}

.px-dashboard-progress-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.px-dashboard-form-field label {
    font-size: 10px;
    font-weight: 800;
    display: block;
    margin-bottom: 3px;
    color: #475569;
}

.px-dashboard-form-field input {
    width: 100%;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    box-sizing: border-box;
    font-size: 12px;
}

.px-dashboard-progress-input {
    display: flex;
    align-items: center;
    gap: 4px;
}

.px-dashboard-progress-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 10px;
}

.px-dashboard-button {
    background: #1e293b;
    color: white;
    border: 0;
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 11px;
    cursor: pointer;
}

.px-dashboard-button-secondary {
    background: #e2e8f0;
    color: #0f172a;
    border: 0;
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 11px;
    cursor: pointer;
}

/* HISTORIQUE */
.px-dashboard-goal-history {
    margin-top: 14px;
    border-top: 1px solid #cbd5e1;
}

.px-dashboard-goal-history-toggle {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0 0;
    border: 0;
    background: transparent;
    font-weight: 800;
    font-size: 12px;
    color: #64748b;
    cursor: pointer;
}

.px-dashboard-history-chevron {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.px-dashboard-goal-history-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-top: 1px solid #cbd5e1;
    font-size: 11px;
}

.px-dashboard-goal-history-main time {
    display: block;
    font-size: 9px;
    color: #94a3b8;
}

.px-dashboard-goal-history-total {
    text-align: right;
}
</style>