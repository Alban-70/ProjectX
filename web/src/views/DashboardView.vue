<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api.js'

const loading = ref(true)
const error = ref('')

const project = ref(null)
const categories = ref([])
const goals = ref([])
const habits = ref([])
const milestones = ref([])
const goalLogs = ref([])
const habitLogs = ref([])

const checkin = ref(null)
const checkins = ref([])

// ONGLET ACTIF ('today' | 'domains' | 'milestones' | 'history')
const activeTab = ref('today')

const checkinForm = ref({
    mood: null,
    energy: null,
    motivation: null,
    reflection: '',
})

const savingCheckin = ref(false)

onMounted(async () => {
    await loadDashboard()
})

function loadTodayCheckin(checkins) {
    const todayCheckin = checkins.find(
        item => item.date === todayString.value
    )

    checkin.value = todayCheckin || null

    if (todayCheckin) {
        checkinForm.value = {
            mood: todayCheckin.mood,
            energy: todayCheckin.energy,
            motivation: todayCheckin.motivation,
            reflection: todayCheckin.reflection || '',
        }
    } else {
        checkinForm.value = {
            mood: null,
            energy: null,
            motivation: null,
            reflection: '',
        }
    }
}

async function saveCheckin() {
    if (savingCheckin.value) return

    savingCheckin.value = true
    error.value = ''

    try {
        const data = await api.saveCheckin({
            date: todayString.value,
            mood: checkinForm.value.mood,
            energy: checkinForm.value.energy,
            motivation: checkinForm.value.motivation,
            reflection: checkinForm.value.reflection,
        })

        checkin.value = data.checkin

        const existingIndex = checkins.value.findIndex(
            item => item.date === todayString.value
        )

        if (existingIndex >= 0) {
            checkins.value[existingIndex] = data.checkin
        } else {
            checkins.value.push(data.checkin)
        }
    } catch (e) {
        console.error('Erreur sauvegarde check-in:', e)
        error.value = e instanceof Error ? e.message : 'Impossible d’enregistrer ton check-in.'
    } finally {
        savingCheckin.value = false
    }
}

async function loadDashboard() {
    loading.value = true
    error.value = ''

    try {
        const data = await api.dashboard()

        project.value = data.project
        categories.value = data.categories || []
        goals.value = data.goals || []
        habits.value = data.habits || []
        milestones.value = data.milestones || []
        goalLogs.value = data.goalLogs || []
        habitLogs.value = data.habitLogs || []

        loadTodayCheckin(data.checkins || [])
    } catch (e) {
        console.error('Erreur chargement dashboard:', e)
        error.value = e instanceof Error ? e.message : 'Impossible de charger le dashboard.'
    } finally {
        loading.value = false
    }
}

/* DATES DU PROJET */
const startDate = computed(() => {
    if (!project.value?.start_date) return null
    return parseDate(project.value.start_date)
})

const endDate = computed(() => {
    if (!project.value?.end_date) return null
    return parseDate(project.value.end_date)
})

const today = computed(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
})

/* DURÉE TOTALE */
const totalDays = computed(() => {
    if (!startDate.value || !endDate.value) return 0
    const difference = endDate.value.getTime() - startDate.value.getTime()
    return Math.max(1, Math.ceil(difference / (1000 * 60 * 60 * 24)))
})

/* JOUR ACTUEL */
const currentDay = computed(() => {
    if (!startDate.value || !endDate.value) return 0
    if (today.value < startDate.value) return 0
    if (today.value >= endDate.value) return totalDays.value

    const difference = today.value.getTime() - startDate.value.getTime()
    return Math.min(totalDays.value, Math.floor(difference / (1000 * 60 * 60 * 24)) + 1)
})

/* PROGRESSION TEMPORELLE */
const timeProgress = computed(() => {
    if (!totalDays.value || !startDate.value) return 0
    if (today.value < startDate.value) return 0
    if (today.value >= endDate.value) return 100

    return Math.min(100, Math.max(0, ((currentDay.value - 1) / totalDays.value) * 100))
})

const timeProgressLabel = computed(() => `${Math.round(timeProgress.value)}%`)

/* ÉTAT DU PROJET */
const projectState = computed(() => {
    if (!project.value) return 'none'
    if (!startDate.value || !endDate.value) return 'unknown'
    if (today.value < startDate.value) return 'upcoming'
    if (today.value >= endDate.value) return 'completed'
    return 'active'
})

const projectStateLabel = computed(() => {
    switch (projectState.value) {
        case 'upcoming': return 'Bientôt'
        case 'completed': return 'Terminé'
        case 'active': return 'En cours'
        default: return ''
    }
})

function getGoalLogs(goalId) {
    return goalLogs.value.filter(log => log.goal_id === goalId)
}

function getLatestGoalValue(goalId) {
    const logs = getGoalLogs(goalId)
    if (logs.length === 0) return 0

    const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )
    return Number(sortedLogs[0].value || 0)
}

function getGoalProgress(goal) {
    const target = Number(goal.target_value ?? 0)
    const bonus = Number(goal.bonus_value ?? 0)
    const current = getLatestGoalValue(goal.id)

    const maximum = bonus > target ? bonus : target
    if (maximum <= 0) return 0

    return Math.min(100, Math.max(0, (current / maximum) * 100))
}

function getHabitLogs(habitId) {
    return habitLogs.value.filter(log => log.habit_id === habitId)
}

function getHabitProgress(habit) {
    const logs = getHabitLogs(habit.id)
    if (logs.length === 0) return 0

    const totalValue = logs.reduce((sum, log) => sum + Number(log.value || 0), 0)
    const targetCount = Number(habit.target_count || 0)

    if (targetCount <= 0) return 0
    return Math.min(100, (totalValue / targetCount) * 100)
}

const goalProgressions = computed(() => {
    return goals.value.map(goal => ({
        ...goal,
        progress: getGoalProgress(goal),
    }))
})

const habitProgressions = computed(() => {
    return habits.value.map(habit => ({
        ...habit,
        progress: getHabitProgress(habit),
    }))
})

const globalProgress = computed(() => {
    const items = [...goalProgressions.value, ...habitProgressions.value]
    if (items.length === 0) return 0

    const total = items.reduce((sum, item) => sum + item.progress, 0)
    return Math.round(total / items.length)
})

const categoryProgressions = computed(() => {
    return categories.value.map(category => {
        const categoryGoals = goalProgressions.value.filter(
            goal => goal.category_id === category.id
        )
        const categoryHabits = habitProgressions.value.filter(
            habit => habit.category_id === category.id
        )
        const items = [...categoryGoals, ...categoryHabits]

        const progress = items.length === 0
            ? 0
            : Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length)

        return {
            ...category,
            progress,
            goalCount: categoryGoals.length,
            habitCount: categoryHabits.length,
            itemCount: items.length,
        }
    })
})

function parseDate(value) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
}

const todayString = computed(() => {
    const date = new Date()
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-')
})

const todayGoals = computed(() => {
    return goals.value.filter(goal => {
        if (!goal.deadline) return true
        return goal.deadline >= todayString.value
    })
})

const todayHabits = computed(() => {
    return habits.value.filter(habit => {
        const start = habit.start_date
        const end = habit.end_date

        if (start && todayString.value < start) return false
        if (end && todayString.value > end) return false
        return true
    })
})

function getTodayHabitLog(habitId) {
    return habitLogs.value.find(
        log => log.habit_id === habitId && log.date === todayString.value
    )
}

function isHabitDoneToday(habitId) {
    const log = getTodayHabitLog(habitId)
    return !!log && Number(log.value || 0) > 0
}

const updatingHabitId = ref(null)

async function toggleHabit(habit) {
    if (updatingHabitId.value === habit.id) return

    updatingHabitId.value = habit.id
    error.value = ''

    try {
        const alreadyDone = isHabitDoneToday(habit.id)
        const value = alreadyDone ? 0 : 1

        const data = await api.logHabit(habit.id, value)

        const existingIndex = habitLogs.value.findIndex(
            log => log.habit_id === habit.id && log.date === todayString.value
        )

        if (existingIndex >= 0) {
            habitLogs.value[existingIndex] = data.log
        } else {
            habitLogs.value.push(data.log)
        }
    } catch (e) {
        console.error('Erreur validation habitude:', e)
        error.value = e instanceof Error ? e.message : 'Impossible de valider cette habitude.'
    } finally {
        updatingHabitId.value = null
    }
}

const goalValues = ref({})
const updatingGoalId = ref(null)

function getGoalTodayValue(goal) {
    const logs = goalLogs.value.filter(
        log => log.goal_id === goal.id && log.logged_at?.startsWith(todayString.value)
    )
    if (logs.length === 0) return ''
    return logs[logs.length - 1].value
}

async function saveGoalProgress(goal) {
    const value = goalValues.value[goal.id]
    if (value === undefined || value === '' || Number(value) < 0) {
        error.value = 'Entre une valeur de progression valide.'
        return
    }

    updatingGoalId.value = goal.id
    error.value = ''

    try {
        const data = await api.logGoal(goal.id, Number(value))
        goalLogs.value.push(data.log)
        goalValues.value[goal.id] = ''
    } catch (e) {
        console.error('Erreur progression objectif:', e)
        error.value = e instanceof Error ? e.message : 'Impossible d’enregistrer la progression.'
    } finally {
        updatingGoalId.value = null
    }
}

const activeDays = computed(() => {
    const days = new Set()

    habitLogs.value.forEach(log => {
        if (log.date && Number(log.value || 0) > 0) days.add(log.date)
    })

    goalLogs.value.forEach(log => {
        if (log.logged_at && Number(log.value || 0) > 0) {
            const date = new Date(log.logged_at)
            const dateString = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, '0'),
                String(date.getDate()).padStart(2, '0'),
            ].join('-')
            days.add(dateString)
        }
    })

    return [...days].sort()
})

function dateToString(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-')
}

function addDays(date, amount) {
    const result = new Date(date)
    result.setDate(result.getDate() + amount)
    return result
}

const currentStreak = computed(() => {
    if (activeDays.value.length === 0) return 0

    const activeSet = new Set(activeDays.value)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    let cursor = todayDate
    let streak = 0

    const todayString = dateToString(cursor)
    if (!activeSet.has(todayString)) cursor = addDays(cursor, -1)

    while (activeSet.has(dateToString(cursor))) {
        streak += 1
        cursor = addDays(cursor, -1)
    }

    return streak
})

const bestStreak = computed(() => {
    if (activeDays.value.length === 0) return 0

    const activeSet = new Set(activeDays.value)
    let best = 0

    for (const day of activeDays.value) {
        const currentDate = new Date(`${day}T00:00:00`)
        const previousDate = addDays(currentDate, -1)
        const previousString = dateToString(previousDate)

        if (activeSet.has(previousString)) continue

        let streak = 1
        let cursor = addDays(currentDate, 1)

        while (activeSet.has(dateToString(cursor))) {
            streak += 1
            cursor = addDays(cursor, 1)
        }

        best = Math.max(best, streak)
    }

    return best
})

const updatingMilestoneId = ref(null)

const sortedMilestones = computed(() => {
    return [...milestones.value].sort((a, b) => {
        if (a.completed_at && !b.completed_at) return 1
        if (!a.completed_at && b.completed_at) return -1
        if (!a.target_date && !b.target_date) return 0
        if (!a.target_date) return 1
        if (!b.target_date) return -1
        return a.target_date.localeCompare(b.target_date)
    })
})

const completedMilestones = computed(() => {
    return milestones.value.filter(m => !!m.completed_at).length
})

function formatMilestoneDate(value) {
    if (!value) return 'Pas de date'
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
    }).format(parseDate(value))
}

function isMilestoneCompleted(milestone) {
    return !!milestone.completed_at
}

async function toggleMilestone(milestone) {
    if (updatingMilestoneId.value === milestone.id) return

    updatingMilestoneId.value = milestone.id
    error.value = ''

    try {
        const data = isMilestoneCompleted(milestone)
            ? await api.reopenMilestone(milestone.id)
            : await api.completeMilestone(milestone.id)

        const index = milestones.value.findIndex(item => item.id === milestone.id)
        if (index !== -1) milestones.value[index] = data.milestone
    } catch (e) {
        console.error('Erreur milestone:', e)
        error.value = e instanceof Error ? e.message : 'Impossible de mettre à jour ce milestone.'
    } finally {
        updatingMilestoneId.value = null
    }
}

const recentActivities = computed(() => {
    const activities = []

    goalLogs.value.forEach(log => {
        const goal = goals.value.find(item => item.id === log.goal_id)
        if (!goal || Number(log.value || 0) <= 0) return

        activities.push({
            id: `goal-${log.id}`,
            type: 'goal',
            title: goal.title,
            description: `Progression : ${formatActivityValue(log.value, goal.unit)}`,
            date: new Date(log.logged_at),
            icon: '↑',
        })
    })

    habitLogs.value.forEach(log => {
        const habit = habits.value.find(item => item.id === log.habit_id)
        if (!habit || Number(log.value || 0) <= 0) return

        activities.push({
            id: `habit-${log.id}`,
            type: 'habit',
            title: habit.name,
            description: 'Habitude accomplie',
            date: parseDate(log.date),
            icon: '✓',
        })
    })

    milestones.value.forEach(milestone => {
        if (!milestone.completed_at) return
        activities.push({
            id: `milestone-${milestone.id}`,
            type: 'milestone',
            title: milestone.title,
            description: 'Milestone franchi',
            date: new Date(milestone.completed_at),
            icon: '✦',
        })
    })

    checkins.value.forEach(item => {
        if (!item.reflection && !item.mood) return
        activities.push({
            id: `checkin-${item.id}`,
            type: 'checkin',
            title: 'Check-in',
            description: item.reflection || `Humeur : ${item.mood}/10 · Énergie : ${item.energy}/10`,
            date: parseDate(item.date),
            icon: '☼',
        })
    })

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime())
})

function formatActivityValue(value, unit) {
    const numericValue = Number(value || 0)
    return unit ? `${numericValue} ${unit}` : `${numericValue}`
}

function formatRelativeDate(date) {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const activityDate = new Date(date)
    activityDate.setHours(0, 0, 0, 0)

    const days = Math.round((startOfToday.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))

    if (days <= 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days}j`

    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

function getActivityLabel(type) {
    switch (type) {
        case 'goal': return 'Objectif'
        case 'habit': return 'Habitude'
        case 'milestone': return 'Milestone'
        case 'checkin': return 'Check-in'
        default: return 'Activité'
    }
}
</script>

<template>
    <main class="px-dashboard-page">

        <!-- CHARGEMENT -->
        <div v-if="loading" class="px-dashboard-state">
            <div class="px-loading-orbit"><span></span></div>
            <p>Ouverture du centre de contrôle...</p>
        </div>

        <!-- ERREUR -->
        <div v-else-if="error && !project" class="px-dashboard-state">
            <div class="px-error-icon">!</div>
            <p>{{ error }}</p>
        </div>

        <!-- SANS PROJET -->
        <div v-else-if="!project" class="px-dashboard-state">
            <p>Aucun Project X actif pour le moment.</p>
        </div>

        <!-- CONTENU DU DASHBOARD STYLE COMMAND CENTER FULL WIDTH -->
        <div v-else class="px-dashboard-container">

            <!-- BANNIÈRE HERO D'ENTÊTE -->
            <header class="px-hero-banner">
                <div class="px-hero-content">
                    <div class="px-hero-title-row">
                        <span class="px-badge-live">
                            <span class="px-badge-dot"></span>
                            TABLEAU DE BORD
                        </span>
                        <span class="px-dashboard-status" :class="`px-dashboard-status--${projectState}`">
                            {{ projectStateLabel }}
                        </span>
                    </div>

                    <h1 class="px-project-title">{{ project.name }}</h1>
                    <p v-if="project.motto" class="px-project-motto">« {{ project.motto }} »</p>
                </div>

                <div class="px-hero-metrics">
                    <div class="px-hero-metric-item">
                        <span class="px-metric-label">Progression globale</span>
                        <div class="px-metric-flex">
                            <strong class="px-metric-value">{{ globalProgress }}%</strong>
                            <div class="px-hero-mini-bar">
                                <div class="px-progress-fill" :style="{ width: `${globalProgress}%` }"></div>
                            </div>
                        </div>
                    </div>

                    <div class="px-hero-metric-item">
                        <span class="px-metric-label">Avancement temps</span>
                        <div class="px-metric-flex">
                            <strong class="px-metric-value">{{ currentDay }} <span class="px-small">/ {{ totalDays
                                    }}j</span></strong>
                            <span class="px-time-tag">{{ timeProgressLabel }}</span>
                        </div>
                    </div>

                    <div class="px-hero-metric-item">
                        <span class="px-metric-label">Série active</span>
                        <div class="px-metric-flex">
                            <strong class="px-metric-value">🔥 {{ currentStreak }}j</strong>
                        </div>
                    </div>
                </div>
            </header>

            <!-- BARRE D'ONGLETS / NAVIGATION SECTORISÉE -->
            <nav class="px-tabs-bar">
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'today' }"
                    @click="activeTab = 'today'">
                    ✦ Aujourd'hui
                    <span v-if="todayGoals.length + todayHabits.length > 0" class="px-tab-count">
                        {{ todayGoals.length + todayHabits.length }}
                    </span>
                </button>

                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'domains' }"
                    @click="activeTab = 'domains'">
                    Domaines & Objectifs
                </button>

                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'milestones' }"
                    @click="activeTab = 'milestones'">
                    Jalons (Milestones)
                    <span v-if="milestones.length > 0" class="px-tab-count">
                        {{ completedMilestones }}/{{ milestones.length }}
                    </span>
                </button>

                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'history' }"
                    @click="activeTab = 'history'">
                    Bilan & Historique
                </button>
            </nav>

            <!-- CONTENU DES ONGLETS -->
            <div class="px-tab-content">

                <!-- 1. ONGLET : AUJOURD'HUI -->
                <div v-if="activeTab === 'today'" class="px-dashboard-grid">
                    <div class="px-main-column">
                        <section class="px-card px-section-card">
                            <div class="px-section-header">
                                <div>
                                    <span class="px-card-label">AUJOURD'HUI</span>
                                    <h2>Ce que tu peux accomplir</h2>
                                </div>
                            </div>

                            <div class="px-today-blocks">
                                <!-- OBJECTIFS DU JOUR -->
                                <div v-if="todayGoals.length" class="px-today-group">
                                    <div class="px-group-header">
                                        <h3>Objectifs ciblés</h3>
                                        <span class="px-count-badge">{{ todayGoals.length }}</span>
                                    </div>

                                    <div class="px-today-list">
                                        <article v-for="goal in todayGoals" :key="goal.id" class="px-today-item">
                                            <div class="px-today-item-top">
                                                <div>
                                                    <h4>{{ goal.title }}</h4>
                                                    <p v-if="goal.unit">Unité : {{ goal.unit }}</p>
                                                </div>
                                                <strong class="px-percent-accent">{{ Math.round(getGoalProgress(goal))
                                                    }}%</strong>
                                            </div>

                                            <div class="px-progress-track">
                                                <div class="px-progress-fill"
                                                    :style="{ width: `${getGoalProgress(goal)}%` }"></div>
                                            </div>

                                            <div class="px-goal-input-row">
                                                <input v-model="goalValues[goal.id]" type="number" min="0"
                                                    class="px-input-sm"
                                                    :placeholder="getGoalTodayValue(goal) || 'Progression du jour'" />
                                                <button type="button" class="px-btn-sm px-btn--add"
                                                    :disabled="updatingGoalId === goal.id"
                                                    @click="saveGoalProgress(goal)">
                                                    {{ updatingGoalId === goal.id ? '...' : 'Valider' }}
                                                </button>
                                            </div>
                                        </article>
                                    </div>
                                </div>

                                <!-- HABITUDES DU JOUR -->
                                <div v-if="todayHabits.length" class="px-today-group">
                                    <div class="px-group-header">
                                        <h3>Routines à valider</h3>
                                        <span class="px-count-badge">{{ todayHabits.length }}</span>
                                    </div>

                                    <div class="px-today-list">
                                        <article v-for="habit in todayHabits" :key="habit.id" class="px-today-item"
                                            :class="{ 'px-today-item--done': isHabitDoneToday(habit.id) }">
                                            <div class="px-today-item-top">
                                                <div>
                                                    <h4>{{ habit.name }}</h4>
                                                    <p>{{ habit.frequency }} <span v-if="habit.target_count">· {{
                                                            habit.target_count }}x</span></p>
                                                </div>

                                                <button type="button" class="px-habit-btn"
                                                    :class="{ 'px-habit-btn--done': isHabitDoneToday(habit.id) }"
                                                    :disabled="updatingHabitId === habit.id"
                                                    @click="toggleHabit(habit)">
                                                    <span class="px-check-circle">{{ isHabitDoneToday(habit.id) ? '✓' :
                                                        '' }}</span>
                                                    {{ isHabitDoneToday(habit.id) ? 'Fait' : 'Valider' }}
                                                </button>
                                            </div>
                                        </article>
                                    </div>
                                </div>

                                <div v-if="!todayGoals.length && !todayHabits.length" class="px-empty-state">
                                    <p>Rien de prévu pour aujourd'hui. Profite de cet instant de calme pour faire le
                                        point. ✦</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <!-- COLONNE SECONDAIRE EN MODE AUJOURD'HUI -->
                    <aside class="px-side-column">
                        <div class="px-card px-checkin-widget">
                            <div class="px-widget-header">
                                <div>
                                    <span class="px-card-label">BILAN QUOTIDIEN</span>
                                    <h3>Check-in du jour</h3>
                                </div>
                                <span v-if="checkin" class="px-done-dot">✓</span>
                            </div>

                            <div class="px-checkin-compact-fields">
                                <div class="px-score-row">
                                    <span class="px-score-title">Humeur</span>
                                    <span class="px-score-val">{{ checkinForm.mood || '—' }}/10</span>
                                </div>
                                <div class="px-score-buttons-mini">
                                    <button v-for="score in 10" :key="`mood-${score}`" type="button"
                                        class="px-mini-score" :class="{ selected: checkinForm.mood === score }"
                                        @click="checkinForm.mood = score">
                                        {{ score }}
                                    </button>
                                </div>

                                <div class="px-score-row">
                                    <span class="px-score-title">Énergie</span>
                                    <span class="px-score-val">{{ checkinForm.energy || '—' }}/10</span>
                                </div>
                                <div class="px-score-buttons-mini">
                                    <button v-for="score in 10" :key="`energy-${score}`" type="button"
                                        class="px-mini-score" :class="{ selected: checkinForm.energy === score }"
                                        @click="checkinForm.energy = score">
                                        {{ score }}
                                    </button>
                                </div>

                                <textarea v-model="checkinForm.reflection" class="px-textarea-sm" rows="2"
                                    placeholder="Note ou apprentissage du jour..."></textarea>

                                <button type="button" class="px-btn-primary-full" :disabled="savingCheckin"
                                    @click="saveCheckin">
                                    {{ savingCheckin ? 'Enregistrement...' : checkin ? 'Mettre à jour' : 'Enregistrer mon bilan' }}
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>

                <!-- 2. ONGLET : DOMAINES & OBJECTIFS -->
                <div v-else-if="activeTab === 'domains'" class="px-tab-pane">
                    <section class="px-card px-section-card">
                        <div class="px-section-header">
                            <div>
                                <span class="px-card-label">DOMAINES DE VIE</span>
                                <h2>Progression par catégorie</h2>
                            </div>
                        </div>

                        <div v-if="categoryProgressions.length" class="px-category-grid">
                            <article v-for="category in categoryProgressions" :key="category.id" class="px-cat-card">
                                <div class="px-cat-header">
                                    <div>
                                        <h3>{{ category.name }}</h3>
                                        <p v-if="category.description">{{ category.description }}</p>
                                    </div>
                                    <strong class="px-cat-percent">{{ category.progress }}%</strong>
                                </div>

                                <div class="px-progress-track">
                                    <div class="px-progress-fill" :style="{ width: `${category.progress}%` }"></div>
                                </div>

                                <div class="px-cat-meta">
                                    <span v-if="category.goalCount">{{ category.goalCount }} obj.</span>
                                    <span v-if="category.habitCount">{{ category.habitCount }} routine(s)</span>
                                </div>
                            </article>
                        </div>
                    </section>

                    <!-- LISTE COMPLETE DES OBJECTIFS & HABITUDES -->
                    <div class="px-grid-2-cols">
                        <section class="px-card px-section-card">
                            <div class="px-section-header">
                                <h3>Tous les objectifs</h3>
                            </div>
                            <div class="px-item-stack">
                                <article v-for="goal in goalProgressions" :key="goal.id" class="px-today-item">
                                    <div class="px-today-item-top">
                                        <div>
                                            <h4>{{ goal.name }}</h4>
                                            <p v-if="goal.unit">{{ goal.unit }}</p>
                                        </div>
                                        <strong class="px-percent-accent">{{ Math.round(goal.progress) }}%</strong>
                                    </div>
                                    <div class="px-progress-track">
                                        <div class="px-progress-fill" :style="{ width: `${goal.progress}%` }"></div>
                                    </div>
                                </article>
                            </div>
                        </section>

                        <section class="px-card px-section-card">
                            <div class="px-section-header">
                                <h3>Toutes les habitudes</h3>
                            </div>
                            <div class="px-item-stack">
                                <article v-for="habit in habitProgressions" :key="habit.id" class="px-today-item">
                                    <div class="px-today-item-top">
                                        <div>
                                            <h4>{{ habit.name }}</h4>
                                            <p>{{ habit.frequency }} · {{ habit.times_per_period }}x</p>
                                        </div>
                                        <strong class="px-percent-accent">{{ Math.round(habit.progress) }}%</strong>
                                    </div>
                                    <div class="px-progress-track">
                                        <div class="px-progress-fill" :style="{ width: `${habit.progress}%` }"></div>
                                    </div>
                                </article>
                            </div>
                        </section>
                    </div>
                </div>

                <!-- 3. ONGLET : MILESTONES -->
                <div v-else-if="activeTab === 'milestones'" class="px-tab-pane">
                    <section class="px-card px-section-card">
                        <div class="px-section-header">
                            <div>
                                <span class="px-card-label">JALONS DE PARCOURS</span>
                                <h2>Milestones du projet</h2>
                            </div>
                            <div class="px-pill-badge">
                                <strong>{{ completedMilestones }} / {{ milestones.length }} complétés</strong>
                            </div>
                        </div>

                        <div v-if="milestones.length" class="px-milestone-list">
                            <article v-for="milestone in sortedMilestones" :key="milestone.id" class="px-milestone-item"
                                :class="{ 'is-completed': isMilestoneCompleted(milestone) }">
                                <div class="px-milestone-marker">
                                    <span v-if="isMilestoneCompleted(milestone)">✓</span>
                                </div>

                                <div class="px-milestone-content">
                                    <div class="px-milestone-top">
                                        <h3>{{ milestone.title }}</h3>
                                        <span class="px-status-tag">{{ isMilestoneCompleted(milestone) ? 'Clôturé' : 'À venir' }}</span>
                                    </div>

                                    <div class="px-milestone-bottom">
                                        <span class="px-milestone-date">◷ {{ formatMilestoneDate(milestone.target_date)
                                            }}</span>
                                        <button type="button" class="px-action-link"
                                            :disabled="updatingMilestoneId === milestone.id"
                                            @click="toggleMilestone(milestone)">
                                            {{ isMilestoneCompleted(milestone) ? 'Rouvrir' : 'Marquer comme accompli' }}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        </div>

                        <div v-else class="px-empty-state">
                            <p>Aucun milestone n'a été configuré pour ce projet.</p>
                        </div>
                    </section>
                </div>

                <!-- 4. ONGLET : HISTORIQUE ET ACTIVITÉS -->
                <div v-else-if="activeTab === 'history'" class="px-tab-pane">
                    <section class="px-card px-section-card">
                        <div class="px-section-header">
                            <div>
                                <span class="px-card-label">ACTIVITÉ RÉCENTE</span>
                                <h2>Journal des actions</h2>
                            </div>
                        </div>

                        <div v-if="recentActivities.length" class="px-full-activity-list">
                            <article v-for="activity in recentActivities" :key="activity.id" class="px-mini-activity">
                                <div class="px-mini-icon" :class="`is-${activity.type}`">
                                    {{ activity.icon }}
                                </div>
                                <div class="px-mini-activity-info">
                                    <h4>{{ activity.title }}</h4>
                                    <p>{{ activity.description }}</p>
                                    <time>{{ formatRelativeDate(activity.date) }}</time>
                                </div>
                            </article>
                        </div>

                        <div v-else class="px-empty-state">
                            <p>Aucune activité enregistrée pour le moment.</p>
                        </div>
                    </section>
                </div>

            </div>

        </div>

    </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

/* =========================================================
   VARIABLES FULL WIDTH & STYLE COMMAND CENTER
   ========================================================= */
.px-dashboard-page {
    --px-bg: #eef2eb;
    --px-surface: #ffffff;
    --px-surface-soft: #f8faf6;

    --px-sage: #7fa88a;
    --px-sage-dark: #52755d;
    --px-sage-light: #e4ece6;

    --px-sand: #e8c9a0;
    --px-sand-light: #f7eedf;

    --px-text: #2b352e;
    --px-text-soft: #5e6c62;
    --px-text-muted: #919c94;

    --px-border: #e0e7df;
    --px-border-soft: #ebf0ea;

    --px-radius-sm: 14px;
    --px-radius-md: 20px;
    --px-radius-lg: 28px;

    --px-shadow-card: 0 16px 40px -6px rgba(43, 53, 46, 0.07);
    --px-transition: 350ms cubic-bezier(0.16, 1, 0.3, 1);

    min-height: 100vh;
    width: 100%;
    background:
        radial-gradient(circle at 10% 0%, rgba(127, 168, 138, 0.18), transparent 40%),
        radial-gradient(circle at 90% 100%, rgba(232, 201, 160, 0.2), transparent 40%),
        var(--px-bg);

    color: var(--px-text);
    font-family: 'Nunito', -apple-system, sans-serif;
    padding: 24px 32px 60px;
    box-sizing: border-box;
}

.px-dashboard-container {
    width: 100%;
    max-width: none;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* =========================================================
   BARRE D'ONGLETS
   ========================================================= */
.px-tabs-bar {
    display: flex;
    gap: 12px;
    border-bottom: 2px solid var(--px-border-soft);
    padding-bottom: 8px;
}

.px-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: transparent;
    border: 0;
    border-radius: 999px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 800;
    color: var(--px-text-soft);
    cursor: pointer;
    transition: all var(--px-transition);
}

.px-tab-btn:hover {
    background: var(--px-surface-soft);
    color: var(--px-text);
}

.px-tab-btn--active {
    background: var(--px-surface);
    color: var(--px-sage-dark);
    box-shadow: 0 4px 12px rgba(43, 53, 46, 0.05);
}

.px-tab-count {
    padding: 2px 8px;
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
    border-radius: 999px;
    font-size: 11px;
}

/* =========================================================
   HERO BANNER
   ========================================================= */
.px-hero-banner {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid var(--px-border);
    border-radius: var(--px-radius-lg);
    padding: 28px 36px;
    box-shadow: var(--px-shadow-card);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 32px;
}

.px-badge-live {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
}

.px-badge-dot {
    width: 7px;
    height: 7px;
    background: var(--px-sage);
    border-radius: 50%;
}

.px-hero-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.px-project-title {
    font-size: 34px;
    font-weight: 900;
    margin: 0;
    line-height: 1.1;
}

.px-project-motto {
    font-size: 14px;
    color: var(--px-text-soft);
    font-style: italic;
    margin: 4px 0 0;
}

.px-dashboard-status {
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
}

.px-dashboard-status--active {
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
}

.px-dashboard-status--completed {
    background: var(--px-sand-light);
    color: #8c6e43;
}

.px-hero-metrics {
    display: flex;
    gap: 28px;
    background: var(--px-surface-soft);
    padding: 16px 24px;
    border-radius: var(--px-radius-md);
    border: 1px solid var(--px-border-soft);
}

.px-metric-label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--px-text-muted);
    margin-bottom: 4px;
}

.px-metric-flex {
    display: flex;
    align-items: center;
    gap: 10px;
}

.px-metric-value {
    font-size: 22px;
    font-weight: 900;
}

.px-small {
    font-size: 13px;
    color: var(--px-text-muted);
}

.px-hero-mini-bar {
    width: 70px;
    height: 7px;
    background: var(--px-border);
    border-radius: 999px;
    overflow: hidden;
}

.px-time-tag {
    padding: 4px 10px;
    background: var(--px-sand-light);
    color: #8c6e43;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
}

/* =========================================================
   LAYOUT FULL WIDTH
   ========================================================= */
.px-dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    width: 100%;
}

.px-tab-pane {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.px-grid-2-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.px-main-column,
.px-side-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* CARTES & ÉLÉMENTS */
.px-card {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid var(--px-border-soft);
    border-radius: var(--px-radius-lg);
    padding: 24px;
    box-shadow: var(--px-shadow-card);
}

.px-card-label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--px-text-muted);
    margin-bottom: 4px;
}

.px-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.px-section-header h2 {
    font-size: 20px;
    font-weight: 900;
    margin: 0;
}

.px-progress-track {
    width: 100%;
    height: 8px;
    background: var(--px-border-soft);
    border-radius: 999px;
    overflow: hidden;
}

.px-progress-fill {
    height: 100%;
    background: var(--px-sage);
    border-radius: 999px;
    transition: width 500ms ease;
}

/* AUJOURD'HUI */
.px-today-blocks {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.px-group-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.px-group-header h3 {
    font-size: 15px;
    font-weight: 800;
    margin: 0;
}

.px-count-badge {
    padding: 2px 8px;
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
}

.px-today-list,
.px-item-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.px-today-item {
    padding: 16px;
    background: var(--px-surface-soft);
    border: 1.5px solid var(--px-border);
    border-radius: var(--px-radius-md);
}

.px-today-item--done {
    background: rgba(127, 168, 138, 0.08);
    border-color: rgba(127, 168, 138, 0.3);
}

.px-today-item-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.px-today-item-top h4 {
    font-size: 15px;
    font-weight: 800;
    margin: 0;
}

.px-today-item-top p {
    font-size: 12px;
    color: var(--px-text-soft);
    margin: 2px 0 0;
}

.px-percent-accent {
    font-size: 14px;
    color: var(--px-sage-dark);
}

.px-goal-input-row {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}

.px-input-sm {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--px-border);
    border-radius: var(--px-radius-sm);
    font-family: inherit;
    font-size: 13px;
    outline: none;
}

.px-btn-sm {
    padding: 8px 14px;
    border-radius: 999px;
    border: 0;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
}

.px-btn--add {
    background: var(--px-sand);
    color: var(--px-text);
}

.px-habit-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    border: 1.5px solid var(--px-border);
    background: var(--px-surface);
    color: var(--px-text);
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
}

.px-habit-btn--done {
    background: var(--px-sage);
    color: white;
    border-color: var(--px-sage);
}

.px-check-circle {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.06);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
}

.px-habit-btn--done .px-check-circle {
    background: rgba(255, 255, 255, 0.3);
}

/* DOMAINES DE VIE (GRILLE DYNAMIQUE FULL WIDTH) */
.px-category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
}

.px-cat-card {
    padding: 18px;
    background: var(--px-surface-soft);
    border: 1px solid var(--px-border);
    border-radius: var(--px-radius-md);
}

.px-cat-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.px-cat-header h3 {
    font-size: 15px;
    font-weight: 800;
    margin: 0;
}

.px-cat-percent {
    font-size: 15px;
    color: var(--px-sage);
}

.px-cat-meta {
    font-size: 11px;
    color: var(--px-text-muted);
    margin-top: 8px;
    display: flex;
    gap: 8px;
}

/* MILESTONES */
.px-pill-badge {
    padding: 4px 12px;
    background: var(--px-surface-soft);
    border: 1px solid var(--px-border);
    border-radius: 999px;
    font-size: 12px;
}

.px-milestone-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.px-milestone-item {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: var(--px-surface-soft);
    border-radius: var(--px-radius-md);
    border: 1px solid var(--px-border-soft);
}

.px-milestone-marker {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--px-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: white;
}

.px-milestone-item.is-completed .px-milestone-marker {
    background: var(--px-sage);
    border-color: var(--px-sage);
}

.px-milestone-content {
    flex: 1;
}

.px-milestone-top {
    display: flex;
    justify-content: space-between;
}

.px-milestone-top h3 {
    font-size: 15px;
    font-weight: 800;
    margin: 0;
}

.px-status-tag {
    font-size: 11px;
    font-weight: 800;
    color: var(--px-text-muted);
}

.px-milestone-bottom {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: var(--px-text-soft);
}

.px-action-link {
    background: transparent;
    border: 0;
    color: var(--px-sage-dark);
    font-family: inherit;
    font-weight: 800;
    cursor: pointer;
}

/* WIDGET CHECK-IN */
.px-widget-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}

.px-widget-header h3 {
    font-size: 16px;
    font-weight: 800;
    margin: 0;
}

.px-done-dot {
    color: var(--px-sage-dark);
    font-weight: 900;
}

.px-checkin-compact-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.px-score-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 800;
}

.px-score-val {
    color: var(--px-sage-dark);
}

.px-score-buttons-mini {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
}

.px-mini-score {
    padding: 6px 0;
    background: var(--px-surface-soft);
    border: 1px solid var(--px-border);
    border-radius: 6px;
    font-family: inherit;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
}

.px-mini-score.selected {
    background: var(--px-sage);
    color: white;
    border-color: var(--px-sage);
}

.px-textarea-sm {
    width: 100%;
    padding: 10px;
    background: var(--px-surface);
    border: 1px solid var(--px-border);
    border-radius: var(--px-radius-sm);
    font-family: inherit;
    font-size: 12px;
    outline: none;
    box-sizing: border-box;
}

.px-btn-primary-full {
    width: 100%;
    padding: 12px;
    background: var(--px-sage);
    color: white;
    border: 0;
    border-radius: 999px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
}

/* ACTIVITÉ COMPACTE & COMPLÈTE */
.px-full-activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.px-mini-activity {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.px-mini-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--px-surface-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    flex-shrink: 0;
}

.px-mini-icon.is-goal {
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
}

.px-mini-icon.is-habit {
    background: var(--px-sand-light);
    color: #8c6e43;
}

.px-mini-activity-info h4 {
    font-size: 13px;
    font-weight: 800;
    margin: 0;
}

.px-mini-activity-info p {
    font-size: 12px;
    color: var(--px-text-soft);
    margin: 2px 0 0;
}

.px-mini-activity-info time {
    font-size: 10px;
    color: var(--px-text-muted);
}

.px-dashboard-state {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--px-text-soft);
}

.px-empty-state {
    padding: 24px;
    text-align: center;
    color: var(--px-text-soft);
    background: var(--px-surface-soft);
    border-radius: var(--px-radius-md);
    font-size: 13px;
}

/* RESPONSIVE */
@media (max-width: 960px) {
    .px-hero-banner {
        flex-direction: column;
        align-items: flex-start;
    }

    .px-hero-metrics {
        width: 100%;
        justify-content: space-between;
        box-sizing: border-box;
    }

    .px-dashboard-grid {
        grid-template-columns: 1fr;
    }

    .px-grid-2-cols {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 600px) {
    .px-dashboard-page {
        padding: 16px 12px;
    }

    .px-tabs-bar {
        overflow-x: auto;
        white-space: nowrap;
    }
}
</style>