<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../../api.js'

const props = defineProps({
    habitId: {
        type: [String, Number],
        required: true,
    },
})

const emit = defineEmits(['edit'])

const habit = ref(null)
const logs = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const month = ref(new Date())

function dateString(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function parseDate(value) {
    return new Date(`${value}T12:00:00`)
}

const today = computed(() => dateString(new Date()))

const completedDates = computed(() =>
    new Set(
        logs.value
            .filter(log => Number(log.value) > 0)
            .map(log => String(log.date).slice(0, 10))
    )
)

const frequency = computed(() => habit.value?.frequency || 'daily')

const target = computed(() =>
    Math.max(1, Number(habit.value?.times_per_period || 1))
)

const frequencyLabel = computed(() => ({
    daily: 'jour',
    weekly: 'semaine',
    monthly: 'mois',
}[frequency.value] || 'jour'))

const monthTitle = computed(() =>
    month.value.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
    })
)

function periodKey(dateStringValue) {
    const date = parseDate(dateStringValue)
    const year = date.getFullYear()
    const monthNumber = String(date.getMonth() + 1).padStart(2, '0')

    if (frequency.value === 'monthly') {
        return `${year}-${monthNumber}`
    }

    if (frequency.value === 'weekly') {
        const monday = new Date(date)
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
        return dateString(monday)
    }

    return dateStringValue
}

const periodCounts = computed(() => {
    const counts = new Map()

    for (const date of completedDates.value) {
        const key = periodKey(date)
        counts.set(key, (counts.get(key) || 0) + 1)
    }

    return counts
})

function isPeriodComplete(key) {
    return (periodCounts.value.get(key) || 0) >= target.value
}

function periodKeysBetween(startValue, endValue) {
    const result = []
    const cursor = parseDate(startValue)
    const end = parseDate(endValue)

    if (frequency.value === 'weekly') {
        cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
    } else if (frequency.value === 'monthly') {
        cursor.setDate(1)
    }

    while (cursor <= end) {
        const key = periodKey(dateString(cursor))

        if (!result.includes(key)) result.push(key)

        if (frequency.value === 'monthly') {
            cursor.setMonth(cursor.getMonth() + 1, 1)
        } else if (frequency.value === 'weekly') {
            cursor.setDate(cursor.getDate() + 7)
        } else {
            cursor.setDate(cursor.getDate() + 1)
        }
    }

    return result
}

const streak = computed(() => {
    if (!habit.value) return 0

    const start = habit.value.start_date || (
        logs.value.length
            ? [...logs.value].sort((a, b) => a.date.localeCompare(b.date))[0].date
            : today.value
    )

    const keys = periodKeysBetween(start, today.value)
    let count = 0

    for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i]

        if (i === keys.length - 1 && !isPeriodComplete(key)) {
            continue
        }

        if (!isPeriodComplete(key)) break
        count++
    }

    return count
})

const totalCompletions = computed(() =>
    [...completedDates.value].length
)

const currentPeriodCount = computed(() =>
    periodCounts.value.get(periodKey(today.value)) || 0
)

const currentPeriodProgress = computed(() =>
    Math.min(100, Math.round(currentPeriodCount.value / target.value * 100))
)

const monthDays = computed(() => {
    const year = month.value.getFullYear()
    const monthIndex = month.value.getMonth()
    const first = new Date(year, monthIndex, 1)
    const offset = (first.getDay() + 6) % 7
    const count = new Date(year, monthIndex + 1, 0).getDate()

    return [
        ...Array(offset).fill(null),
        ...Array.from({ length: count }, (_, index) => {
            const date = dateString(new Date(year, monthIndex, index + 1))
            return {
                day: index + 1,
                date,
                completed: completedDates.value.has(date),
                isToday: date === today.value,
            }
        }),
    ]
})

const monthStats = computed(() => {
    const year = month.value.getFullYear()
    const monthIndex = month.value.getMonth()
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const completed = monthDays.value.filter(
        day => day?.completed
    ).length

    const current = new Date()
    const isCurrentMonth =
        year === current.getFullYear() &&
        monthIndex === current.getMonth()

    const isFutureMonth =
        new Date(year, monthIndex, 1) >
        new Date(current.getFullYear(), current.getMonth(), 1)

    const elapsed = isCurrentMonth
        ? current.getDate()
        : isFutureMonth ? 0 : daysInMonth

    return {
        completed,
        elapsed,
        rate: elapsed
            ? Math.round(completed / elapsed * 100)
            : 0,
    }
})

const doneToday = computed(() =>
    completedDates.value.has(today.value)
)

async function loadHistory() {
    if (!props.habitId) return

    loading.value = true
    error.value = ''

    try {
        const result = await api.getHabitHistory(props.habitId)
        habit.value = result.habit || result
        logs.value = result.logs || []
    } catch (e) {
        error.value = e.message || "Impossible de charger l'historique."
    } finally {
        loading.value = false
    }
}

async function toggleToday() {
    if (!props.habitId || saving.value) return

    saving.value = true
    error.value = ''

    try {
        const newValue = doneToday.value ? 0 : 1
        const result = await api.logHabit(
            props.habitId,
            newValue,
            '',
            today.value
        )

        const returnedLog = result?.log ?? result

        if (returnedLog && returnedLog.date) {
            const index = logs.value.findIndex(
                log => String(log.date).slice(0, 10) === today.value
            )

            if (index >= 0) {
                logs.value.splice(index, 1, returnedLog)
            } else {
                logs.value.push(returnedLog)
            }
        } else {
            const index = logs.value.findIndex(
                log => String(log.date).slice(0, 10) === today.value
            )
            if (index >= 0) {
                logs.value[index] = { ...logs.value[index], value: newValue }
            } else if (newValue > 0) {
                logs.value.push({
                    habit_id: props.habitId,
                    date: today.value,
                    value: newValue,
                    note: ''
                })
            }
        }
    } catch (e) {
        error.value = e.message || "Impossible de modifier la validation."
    } finally {
        saving.value = false
    }
}

function changeMonth(amount) {
    month.value = new Date(
        month.value.getFullYear(),
        month.value.getMonth() + amount,
        1
    )
}

function formatDateFr(dateStr) {
    if (!dateStr) return ''
    const cleanDate = String(dateStr).slice(0, 10)
    const [y, m, d] = cleanDate.split('-')
    return `${d}/${m}/${y}`
}

watch(() => props.habitId, loadHistory)
onMounted(loadHistory)
</script>

<template>
    <section class="habit-history">
        <div v-if="loading" class="px-state-msg">
            <p>Chargement de l'historique…</p>
        </div>
        <div v-else-if="error" class="px-error-alert" role="alert">
            {{ error }}
        </div>

        <template v-else>
            <!-- EN-TÊTE HABITUDE -->
            <div class="px-habit-header">
                <div>
                    <span class="px-card-label">Suivi d'habitude</span>
                    <div class="px-title-row">
                        <h2>{{ habit?.name }}</h2>
                        <button type="button" class="px-goal-edit-btn" title="Modifier l'habitude"
                            @click="emit('edit', habit)">
                            ✎
                        </button>
                    </div>
                </div>
                <button type="button" class="px-action-btn" :class="{ 'is-done': doneToday }" :disabled="saving"
                    @click="toggleToday">
                    {{
                        saving
                            ? 'Enregistrement…'
                            : doneToday
                                ? '✓ Validée aujourd\'hui'
                                : '+ Marquer comme accomplie'
                    }}
                </button>
            </div>

            <!-- CARTES DE STATISTIQUES ZEN -->
            <div class="stats">
                <article>
                    <span class="stat-label">Série active</span>
                    <strong>🔥 {{ streak }}</strong>
                    <span class="stat-sub">Période(s) ({{ frequencyLabel }})</span>
                </article>

                <article>
                    <span class="stat-label">Total validé</span>
                    <strong>{{ totalCompletions }}</strong>
                    <span class="stat-sub">Jours accomplis</span>
                </article>

                <article>
                    <span class="stat-label">Objectif {{ frequencyLabel }}</span>
                    <strong>{{ currentPeriodCount }} <small>/ {{ target }}</small></strong>
                    <div class="px-mini-progress-track">
                        <div class="px-mini-progress-fill" :style="{ width: `${currentPeriodProgress}%` }"></div>
                    </div>
                </article>

                <article>
                    <span class="stat-label">Taux du mois</span>
                    <strong>{{ monthStats.rate }}%</strong>
                    <span class="stat-sub">{{ monthStats.completed }} sur {{ monthStats.elapsed }} jours</span>
                </article>
            </div>

            <!-- CALENDRIER -->
            <div class="calendar">
                <header>
                    <button type="button" class="calendar-nav-btn" @click="changeMonth(-1)">←</button>
                    <h3>{{ monthTitle }}</h3>
                    <button type="button" class="calendar-nav-btn" @click="changeMonth(1)">→</button>
                </header>

                <div class="calendar-grid">
                    <span v-for="day in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']" :key="day" class="weekday">
                        {{ day }}
                    </span>

                    <span v-for="(day, index) in monthDays" :key="day?.date || `empty-${index}`" class="calendar-day"
                        :class="{
                            completed: day?.completed,
                            empty: !day,
                            today: day?.isToday
                        }" :title="day ? `${day.date}${day.completed ? ' — accomplie' : ''}` : ''">
                        {{ day?.day || '' }}
                    </span>
                </div>
            </div>

            <!-- HISTORIQUE DES VALIDATIONS -->
            <div class="px-history-logs">
                <h3>Historique récent</h3>
                <p v-if="!logs.length" class="px-empty-text">Aucune validation enregistrée pour le moment.</p>

                <div v-else class="px-logs-list">
                    <div v-for="log in [...logs].reverse()" :key="log.id || log.date" class="px-log-item">
                        <div class="px-log-left">
                            <span class="px-log-status-dot" :class="{ 'is-completed': Number(log.value) > 0 }"></span>
                            <strong>{{ formatDateFr(log.date) }}</strong>
                        </div>
                        <div class="px-log-right">
                            <span class="px-log-badge" :class="{ 'is-completed': Number(log.value) > 0 }">
                                {{ Number(log.value) > 0 ? "Accomplie" : "Non accomplie" }}
                            </span>
                            <span v-if="log.note" class="px-log-note">{{ log.note }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </section>
</template>

<style scoped>
.habit-history {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.px-habit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.px-card-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d9b90;
    display: block;
    margin-bottom: 2px;
}

.px-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.px-habit-header h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    color: #242e27;
}

.px-goal-edit-btn {
    background: transparent;
    border: 0;
    color: #8d9b90;
    font-size: 15px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 6px;
    transition: color 0.2s ease;
}

.px-goal-edit-btn:hover {
    color: #4d7358;
    background: #f4f8f3;
}

.px-action-btn {
    background: #4d7358;
    color: #ffffff;
    border: 0;
    padding: 10px 20px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(77, 115, 88, 0.2);
    transition: all 0.2s ease;
}

.px-action-btn:hover:not(:disabled) {
    background: #2d4734;
}

.px-action-btn.is-done {
    background: #e8eee7;
    color: #2d4734;
    border: 1px solid #d4ded3;
    box-shadow: none;
}

.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 14px;
}

.stats article {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: #f4f8f3;
    border: 1px solid #e8eee7;
    border-radius: 18px;
}

.stat-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d9b90;
}

.stats strong {
    font-size: 20px;
    font-weight: 900;
    color: #2d4734;
}

.stats strong small {
    font-size: 13px;
    color: #8d9b90;
}

.stat-sub {
    font-size: 11px;
    color: #5c6a60;
    font-weight: 600;
}

.px-mini-progress-track {
    width: 100%;
    height: 6px;
    background: #dde6dd;
    border-radius: 999px;
    overflow: hidden;
    margin-top: 6px;
}

.px-mini-progress-fill {
    height: 100%;
    background: #4d7358;
    border-radius: 999px;
}

.calendar {
    background: #ffffff;
    border: 1px solid #e8eee7;
    border-radius: 20px;
    padding: 20px;
}

.calendar header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 16px;
}

.calendar header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: #242e27;
    text-transform: capitalize;
}

.calendar-nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid #d4ded3;
    background: #f4f8f3;
    color: #2d4734;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.35rem;
}

.weekday,
.calendar-day {
    display: grid;
    min-height: 2.5rem;
    place-items: center;
}

.weekday {
    font-size: 0.8rem;
    font-weight: 600;
    color: #8d9b90;
}

.calendar-day {
    border-radius: 8px;
    background: #f1f1f1;
    font-size: 13px;
    color: #242e27;
}

.calendar-day.completed {
    background: #b8edc8;
    color: #14532d;
    font-weight: 700;
}

.calendar-day.empty {
    background: transparent;
}

.calendar-day.today {
    outline: 2px solid #647b5b;
    outline-offset: -2px;
}

.px-history-logs h3 {
    font-size: 16px;
    font-weight: 800;
    color: #242e27;
    margin: 0 0 12px;
}

.px-empty-text {
    font-size: 13px;
    color: #8d9b90;
}

.px-logs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.px-log-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: #f4f8f3;
    border: 1px solid #e8eee7;
    border-radius: 12px;
    font-size: 13px;
}

.px-log-left {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #242e27;
}

.px-log-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d4ded3;
}

.px-log-status-dot.is-completed {
    background: #4d7358;
}

.px-log-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.px-log-badge {
    font-size: 11px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 999px;
    background: #e8eee7;
    color: #5c6a60;
}

.px-log-badge.is-completed {
    background: #dbe8dd;
    color: #2d4734;
}

.px-log-note {
    font-size: 12px;
    color: #5c6a60;
    font-style: italic;
}

.px-state-msg {
    padding: 20px;
    text-align: center;
    color: #8d9b90;
}

.px-error-alert {
    padding: 12px 16px;
    background: #f7efe3;
    color: #a35252;
    border: 1px solid #e5be8a;
    border-radius: 14px;
    font-size: 13px;
}
</style>