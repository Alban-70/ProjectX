<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api.js'

import GoalCard from '../components/dashboard/GoalCard.vue'
import GoalFormModal from '../components/dashboard/GoalFormModal.vue'
import CheckinWidget from '../components/dashboard/CheckinWidget.vue'

const loading = ref(true)
const error = ref('')
const activeTab = ref('today')

const project = ref(null)
const categories = ref([])
const goals = ref([])
const habits = ref([])
const milestones = ref([])
const goalLogs = ref([])
const habitLogs = ref([])
const checkin = ref(null)
const checkins = ref([])

const showGoalForm = ref(false)
const editingGoal = ref(null)
const goalSaving = ref(false)
const goalError = ref('')
const deletingGoalId = ref(null)

const savingCheckin = ref(false)
const updatingHabitId = ref(null)
const updatingMilestoneId = ref(null)

const progressGoalId = ref(null)
const expandedGoalHistoryId = ref(null)

onMounted(async () => {
    await loadDashboard()
})

async function loadDashboard() {
    loading.value = true
    try {
        const data = await api.dashboard()
        project.value = data.project
        categories.value = data.categories || []
        goals.value = data.goals || []
        habits.value = data.habits || []
        milestones.value = data.milestones || []
        goalLogs.value = data.goalLogs || []
        habitLogs.value = data.habitLogs || []
        checkins.value = data.checkins || []

        const todayStr = [
            new Date().getFullYear(),
            String(new Date().getMonth() + 1).padStart(2, '0'),
            String(new Date().getDate()).padStart(2, '0'),
        ].join('-')

        checkin.value = checkins.value.find(c => c.date === todayStr) || null
    } catch (e) {
        error.value = 'Erreur lors du chargement des données.'
    } finally {
        loading.value = false
    }
}

/* LOGIQUE DATES & PROGRES GLOBAL */
const todayString = computed(() => {
    const d = new Date()
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
})

const startDate = computed(() => project.value?.start_date ? new Date(project.value.start_date) : null)
const endDate = computed(() => project.value?.end_date ? new Date(project.value.end_date) : null)
const todayDate = computed(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })

const totalDays = computed(() => {
    if (!startDate.value || !endDate.value) return 0
    return Math.max(1, Math.ceil((endDate.value.getTime() - startDate.value.getTime()) / (1000 * 60 * 60 * 24)))
})

const currentDay = computed(() => {
    if (!startDate.value || !endDate.value) return 0
    if (todayDate.value < startDate.value) return 0
    if (todayDate.value >= endDate.value) return totalDays.value
    return Math.min(totalDays.value, Math.floor((todayDate.value.getTime() - startDate.value.getTime()) / (1000 * 60 * 60 * 24)) + 1)
})

const timeProgress = computed(() => {
    if (!totalDays.value || !startDate.value) return 0
    if (todayDate.value < startDate.value) return 0
    if (todayDate.value >= endDate.value) return 100
    return Math.min(100, Math.max(0, ((currentDay.value - 1) / totalDays.value) * 100))
})

const projectState = computed(() => {
    if (!project.value) return 'none'
    if (!startDate.value || !endDate.value) return 'unknown'
    if (todayDate.value < startDate.value) return 'upcoming'
    if (todayDate.value >= endDate.value) return 'completed'
    return 'active'
})

/* GOAL COMPUTEDS */
function getGoalLogs(goalId) {
    return goalLogs.value
        .filter(l => l.goal_id === goalId)
        .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
}

function getGoalTotalProgress(goalId) {
    return getGoalLogs(goalId).reduce((sum, l) => sum + Number(l.value || 0), 0)
}

function getGoalProgressPercent(goal) {
    const target = Number(goal.target_value || 0)
    const bonus = Number(goal.bonus_value || 0)
    const maximum = bonus > target ? bonus : target
    if (maximum <= 0) return 0
    return Math.min(100, Math.max(0, (getGoalTotalProgress(goal.id) / maximum) * 100))
}

function isGoalMinimumReached(goal) {
    const min = Number(goal.minimum_value)
    return Number.isFinite(min) && min > 0 ? getGoalTotalProgress(goal.id) >= min : false
}

function isGoalTargetReached(goal) {
    const target = Number(goal.target_value)
    return Number.isFinite(target) && target > 0 ? getGoalTotalProgress(goal.id) >= target : false
}

function isGoalBonusReached(goal) {
    const bonus = Number(goal.bonus_value)
    return Number.isFinite(bonus) && bonus > 0 ? getGoalTotalProgress(goal.id) >= bonus : false
}

const globalProgress = computed(() => {
    if (goals.value.length === 0) return 0
    const total = goals.value.reduce((sum, g) => sum + getGoalProgressPercent(g), 0)
    return Math.round(total / goals.value.length)
})

const categoryProgressions = computed(() => {
    return categories.value.map(cat => {
        const catGoals = goals.value.filter(g => g.category_id === cat.id)
        const catHabits = habits.value.filter(h => h.category_id === cat.id)
        const progress = catGoals.length === 0 ? 0 : Math.round(catGoals.reduce((s, g) => s + getGoalProgressPercent(g), 0) / catGoals.length)
        return {
            ...cat,
            progress,
            goalCount: catGoals.length,
            habitCount: catHabits.length
        }
    })
})

/* HABITUDES & AUJOURD'HUI */
const todayGoals = computed(() => goals.value.filter(g => !g.deadline || g.deadline >= todayString.value))
const todayHabits = computed(() => habits.value.filter(h => {
    if (h.start_date && todayString.value < h.start_date) return false
    if (h.end_date && todayString.value > h.end_date) return false
    return true
}))

function isHabitDoneToday(habitId) {
    const log = habitLogs.value.find(l => l.habit_id === habitId && l.date === todayString.value)
    return !!log && Number(log.value || 0) > 0
}

async function toggleHabit(habit) {
    if (updatingHabitId.value === habit.id) return
    updatingHabitId.value = habit.id
    try {
        const alreadyDone = isHabitDoneToday(habit.id)
        const data = await api.logHabit(habit.id, alreadyDone ? 0 : 1)
        const idx = habitLogs.value.findIndex(l => l.habit_id === habit.id && l.date === todayString.value)
        if (idx >= 0) habitLogs.value[idx] = data.log
        else habitLogs.value.push(data.log)
    } catch (e) {
        console.error(e)
    } finally {
        updatingHabitId.value = null
    }
}

/* STREAK */
const currentStreak = computed(() => {
    const days = new Set()
    habitLogs.value.forEach(l => { if (l.date && Number(l.value || 0) > 0) days.add(l.date) })
    goalLogs.value.forEach(l => {
        if (l.logged_at && Number(l.value || 0) > 0) {
            const d = new Date(l.logged_at)
            days.add([d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'))
        }
    })
    const activeSet = new Set([...days].sort())
    let cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    let streak = 0
    const fmt = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
    if (!activeSet.has(fmt(cursor))) cursor.setDate(cursor.getDate() - 1)
    while (activeSet.has(fmt(cursor))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
    }
    return streak
})

/* MILESTONES */
const sortedMilestones = computed(() => {
    return [...milestones.value].sort((a, b) => {
        if (a.completed_at && !b.completed_at) return 1
        if (!a.completed_at && b.completed_at) return -1
        return (a.target_date || '').localeCompare(b.target_date || '')
    })
})
const completedMilestones = computed(() => milestones.value.filter(m => !!m.completed_at).length)

async function toggleMilestone(m) {
    if (updatingMilestoneId.value === m.id) return
    updatingMilestoneId.value = m.id
    try {
        const data = m.completed_at ? await api.reopenMilestone(m.id) : await api.completeMilestone(m.id)
        const idx = milestones.value.findIndex(item => item.id === m.id)
        if (idx !== -1) milestones.value[idx] = data.milestone
    } catch (e) {
        console.error(e)
    } finally {
        updatingMilestoneId.value = null
    }
}

/* HISTORIQUE */
const recentActivities = computed(() => {
    const activities = []
    goalLogs.value.forEach(l => {
        const g = goals.value.find(item => item.id === l.goal_id)
        if (g && Number(l.value || 0) > 0) activities.push({ id: `g-${l.id}`, type: 'goal', title: g.title, description: `+${l.value} ${g.unit || ''}`, date: new Date(l.logged_at) })
    })
    habitLogs.value.forEach(l => {
        const h = habits.value.find(item => item.id === l.habit_id)
        if (h && Number(l.value || 0) > 0) activities.push({ id: `h-${l.id}`, type: 'habit', title: h.name, description: 'Accomplie', date: new Date(l.date) })
    })
    return activities.sort((a, b) => b.date - a.date)
})

/* HANDLERS ACTIONS */
function getCategoryName(id) { return categories.value.find(c => c.id === id)?.name || 'Sans catégorie' }
function openCreateGoal() { editingGoal.value = null; showGoalForm.value = true }
function openEditGoal(goal) { editingGoal.value = goal; showGoalForm.value = true }

async function handleSaveGoal(formData) {
    goalSaving.value = true
    try {
        if (editingGoal.value) {
            const data = await api.updateGoal(editingGoal.value.id, formData)
            const idx = goals.value.findIndex(g => g.id === editingGoal.value.id)
            if (idx !== -1) goals.value[idx] = data.goal
        } else {
            const data = await api.createGoal(formData)
            if (data?.goal) goals.value.push(data.goal)
        }
        showGoalForm.value = false
    } catch (e) {
        goalError.value = 'Impossible d’enregistrer l’objectif.'
    } finally {
        goalSaving.value = false
    }
}

async function handleDeleteGoal(goal) {
    if (!window.confirm(`Supprimer « ${goal.title} » ?`)) return
    deletingGoalId.value = goal.id
    try {
        await api.deleteGoal(goal.id)
        goals.value = goals.value.filter(g => g.id !== goal.id)
    } catch (e) {
        console.error(e)
    } finally {
        deletingGoalId.value = null
    }
}

async function handleSaveProgress({ goalId, value, note }) {
    try {
        const data = await api.logGoal(goalId, value, note)
        if (data?.log) goalLogs.value.push(data.log)
        progressGoalId.value = null
    } catch (e) {
        console.error(e)
    }
}

async function handleSaveCheckin(checkinData) {
    savingCheckin.value = true
    try {
        const data = await api.saveCheckin({ date: todayString.value, ...checkinData })
        checkin.value = data.checkin
    } catch (e) {
        console.error(e)
    } finally {
        savingCheckin.value = false
    }
}
</script>

<template>
    <main class="px-dashboard-page">
        <div v-if="loading" class="px-dashboard-state">
            <p>Chargement du tableau de bord...</p>
        </div>
        <div v-else-if="!project" class="px-dashboard-state">
            <p>Aucun projet actif pour le moment.</p>
        </div>

        <div v-else class="px-dashboard-container">
            <!-- HERO BANNER -->
            <header class="px-hero-banner">
                <div class="px-hero-content">
                    <div class="px-hero-title-row">
                        <span class="px-badge-live"><span class="px-badge-dot"></span> TABLEAU DE BORD</span>
                        <span class="px-dashboard-status" :class="`px-dashboard-status--${projectState}`">
                            {{ projectState === 'active' ? 'En cours' : 'Terminé' }}
                        </span>
                    </div>
                    <h1 class="px-project-title">{{ project.name }}</h1>
                    <p v-if="project.motto" class="px-project-motto">« {{ project.motto }} »</p>
                </div>

                <div class="px-hero-metrics">
                    <div class="px-hero-metric-item">
                        <span class="px-metric-label">Progression globale</span>
                        <strong class="px-metric-value">{{ globalProgress }}%</strong>
                    </div>
                    <div class="px-hero-metric-item">
                        <span class="px-metric-label">Avancement temps</span>
                        <strong class="px-metric-value">{{ currentDay }} <span class="px-small">/ {{ totalDays
                        }}j</span></strong>
                    </div>
                    <div class="px-hero-metric-item">
                        <span class="px-metric-label">Série active</span>
                        <strong class="px-metric-value">🔥 {{ currentStreak }}j</strong>
                    </div>
                </div>
            </header>

            <!-- BARRE D'ONGLETS -->
            <nav class="px-tabs-bar">
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'today' }"
                    @click="activeTab = 'today'">
                    ✦ Aujourd'hui
                </button>
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'domains' }"
                    @click="activeTab = 'domains'">
                    Domaines & Objectifs
                </button>
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'milestones' }"
                    @click="activeTab = 'milestones'">
                    Jalons (Milestones)
                </button>
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'history' }"
                    @click="activeTab = 'history'">
                    Bilan & Historique
                </button>
            </nav>

            <!-- CONTENU DES ONGLETS -->
            <div class="px-tab-content">
                <!-- 1. AUJOURD'HUI -->
                <div v-if="activeTab === 'today'" class="px-dashboard-grid">
                    <div class="px-main-column">
                        <section class="px-card">
                            <h2>Ce que tu peux accomplir aujourd'hui</h2>
                            <div class="px-today-blocks">
                                <div v-if="todayGoals.length" class="px-today-group">
                                    <h3>Objectifs ciblés</h3>
                                    <div class="px-today-list">
                                        <article v-for="g in todayGoals" :key="g.id" class="px-today-item">
                                            <h4>{{ g.title }}</h4>
                                            <div class="px-progress-track">
                                                <div class="px-progress-fill"
                                                    :style="{ width: `${getGoalProgressPercent(g)}%` }"></div>
                                            </div>
                                        </article>
                                    </div>
                                </div>

                                <div v-if="todayHabits.length" class="px-today-group">
                                    <h3>Routines à valider</h3>
                                    <div class="px-today-list">
                                        <article v-for="h in todayHabits" :key="h.id" class="px-today-item"
                                            :class="{ 'px-today-item--done': isHabitDoneToday(h.id) }">
                                            <div class="px-today-item-top">
                                                <h4>{{ h.name }}</h4>
                                                <button type="button" class="px-habit-btn"
                                                    :class="{ 'px-habit-btn--done': isHabitDoneToday(h.id) }"
                                                    @click="toggleHabit(h)">
                                                    {{ isHabitDoneToday(h.id) ? 'Fait ✓' : 'Valider' }}
                                                </button>
                                            </div>
                                        </article>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside class="px-side-column">
                        <CheckinWidget :checkin="checkin" :saving="savingCheckin" @save="handleSaveCheckin" />
                    </aside>
                </div>

                <!-- 2. DOMAINES & OBJECTIFS -->
                <div v-else-if="activeTab === 'domains'" class="px-tab-pane">
                    <!-- CARTES DOMAINES/CATEGORIES -->
                    <section class="px-card">
                        <h2>Domaines de vie</h2>
                        <div class="px-category-grid">
                            <article v-for="cat in categoryProgressions" :key="cat.id" class="px-cat-card">
                                <h3>{{ cat.name }}</h3>
                                <strong>{{ cat.progress }}%</strong>
                                <div class="px-progress-track">
                                    <div class="px-progress-fill" :style="{ width: `${cat.progress}%` }"></div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <!-- SECTION OBJECTIFS -->
                    <section class="px-card">
                        <div class="px-section-header">
                            <h2>Objectifs</h2>
                            <button type="button" class="px-dashboard-button" @click="openCreateGoal">+ Nouvel
                                objectif</button>
                        </div>

                        <GoalFormModal :show="showGoalForm" :editing-goal="editingGoal" :categories="categories"
                            :saving="goalSaving" :error="goalError" @close="showGoalForm = false"
                            @save="handleSaveGoal" />

                        <div class="px-dashboard-goals-list">
                            <GoalCard v-for="goal in goals" :key="goal.id" :goal="goal"
                                :category-name="getCategoryName(goal.category_id)" :logs="getGoalLogs(goal.id)"
                                :total-progress="getGoalTotalProgress(goal.id)"
                                :progress-percent="getGoalProgressPercent(goal)"
                                :is-minimum-reached="isGoalMinimumReached(goal)"
                                :is-target-reached="isGoalTargetReached(goal)"
                                :is-bonus-reached="isGoalBonusReached(goal)"
                                :expanded-history="expandedGoalHistoryId === goal.id"
                                :progress-form-goal-id="progressGoalId" :deleting="deletingGoalId === goal.id"
                                @open-progress="g => progressGoalId = g.id" @close-progress="progressGoalId = null"
                                @save-progress="handleSaveProgress" @edit="openEditGoal" @delete="handleDeleteGoal"
                                @toggle-history="id => expandedGoalHistoryId = expandedGoalHistoryId === id ? null : id" />
                        </div>
                    </section>
                </div>

                <!-- 3. MILESTONES -->
                <div v-else-if="activeTab === 'milestones'" class="px-tab-pane">
                    <section class="px-card">
                        <h2>Jalons du parcours ({{ completedMilestones }}/{{ milestones.length }})</h2>
                        <div class="px-milestone-list">
                            <article v-for="m in sortedMilestones" :key="m.id" class="px-milestone-item"
                                :class="{ 'is-completed': m.completed_at }">
                                <h3>{{ m.title }}</h3>
                                <button type="button" class="px-action-link" @click="toggleMilestone(m)">
                                    {{ m.completed_at ? 'Rouvrir' : 'Marquer comme accompli' }}
                                </button>
                            </article>
                        </div>
                    </section>
                </div>

                <!-- 4. HISTORIQUE -->
                <div v-else-if="activeTab === 'history'" class="px-tab-pane">
                    <section class="px-card">
                        <h2>Journal d'activités</h2>
                        <div class="px-full-activity-list">
                            <article v-for="act in recentActivities" :key="act.id" class="px-mini-activity">
                                <h4>{{ act.title }}</h4>
                                <p>{{ act.description }}</p>
                            </article>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&display=swap');

/* =========================================================
   CHARTE SOFT ZEN ELEVATED (Dashboard lumineux & structuré)
   ========================================================= */
.px-dashboard-page {
    --px-bg: #e6ece4;
    /* Vert sauge clair très apaisant */
    --px-surface: #ffffff;
    --px-surface-soft: #f4f8f3;

    --px-sage-main: #4d7358;
    /* Vert forêt / sauge soutenu */
    --px-sage-light: #dbe8dd;
    /* Fond de badge doux */
    --px-sage-dark: #2d4734;
    /* Texte contrasté */

    --px-sand-accent: #d9a05b;
    /* Touche miel / sable chaud */
    --px-sand-soft: #f7efe3;

    --px-text-main: #242e27;
    --px-text-sub: #5c6a60;
    --px-text-muted: #8d9b90;

    --px-border: #d4ded3;
    --px-border-soft: #e8eee7;

    --px-radius-md: 18px;
    --px-radius-lg: 26px;

    --px-shadow-dashboard: 0 12px 32px -6px rgba(36, 46, 39, 0.08);

    min-height: 100vh;
    width: 100%;
    background:
        radial-gradient(circle at 10% 0%, rgba(77, 115, 88, 0.12), transparent 45%),
        radial-gradient(circle at 90% 100%, rgba(217, 160, 91, 0.12), transparent 45%),
        var(--px-bg);

    font-family: 'Nunito', -apple-system, sans-serif;
    color: var(--px-text-main);
    padding: 28px 36px 60px;
    box-sizing: border-box;
}

.px-dashboard-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 28px;
}

/* =========================================================
   BANNIÈRE HERO (Style Carte de Contrôle Zen)
   ========================================================= */
.px-hero-banner {
    background: var(--px-surface);
    border: 1px solid var(--px-border);
    border-radius: var(--px-radius-lg);
    padding: 28px 36px;
    box-shadow: var(--px-shadow-dashboard);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
}

.px-badge-live {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: var(--px-sage-dark);
    color: #ffffff;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
}

.px-badge-dot {
    width: 7px;
    height: 7px;
    background: var(--px-sand-accent);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--px-sand-accent);
}

.px-project-title {
    font-size: 34px;
    font-weight: 900;
    margin: 8px 0 0;
    color: var(--px-text-main);
    letter-spacing: -0.02em;
}

.px-project-motto {
    font-size: 14px;
    color: var(--px-text-sub);
    font-style: italic;
    margin: 4px 0 0;
}

.px-dashboard-status {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
}

.px-hero-metrics {
    display: flex;
    gap: 24px;
    background: var(--px-surface-soft);
    padding: 18px 28px;
    border-radius: var(--px-radius-md);
    border: 1px solid var(--px-border-soft);
}

.px-metric-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--px-text-muted);
    display: block;
    margin-bottom: 4px;
}

.px-metric-value {
    font-size: 24px;
    font-weight: 900;
    color: var(--px-sage-dark);
}

.px-small {
    font-size: 13px;
    color: var(--px-text-muted);
    font-weight: 700;
}

/* =========================================================
   BARRE D'ONGLETS ZEN STRUCTURÉE
   ========================================================= */
.px-tabs-bar {
    display: flex;
    gap: 8px;
    background: rgba(255, 255, 255, 0.6);
    padding: 6px;
    border-radius: 999px;
    border: 1px solid var(--px-border);
    width: fit-content;
    backdrop-filter: blur(8px);
}

.px-tab-btn {
    padding: 10px 22px;
    background: transparent;
    border: 0;
    border-radius: 999px;
    font-weight: 800;
    font-size: 13px;
    color: var(--px-text-sub);
    cursor: pointer;
    transition: all 0.25s ease;
}

.px-tab-btn:hover {
    color: var(--px-text-main);
    background: rgba(255, 255, 255, 0.8);
}

.px-tab-btn--active {
    background: var(--px-surface);
    color: var(--px-sage-dark);
    box-shadow: 0 4px 12px rgba(36, 46, 39, 0.08);
    border-bottom: 2px solid var(--px-sage-main);
}

/* =========================================================
   GRILLE ET CARTES DU DASHBOARD
   ========================================================= */
.px-dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 28px;
    width: 100%;
}

.px-main-column,
.px-side-column,
.px-tab-pane {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.px-card {
    background: var(--px-surface);
    border: 1px solid var(--px-border-soft);
    border-radius: var(--px-radius-lg);
    padding: 28px;
    box-shadow: var(--px-shadow-dashboard);
}

.px-card h2 {
    font-size: 20px;
    font-weight: 900;
    color: var(--px-text-main);
    margin: 0 0 18px;
}

.px-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

/* CATEGORIES / DOMAINES */
.px-category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
}

.px-cat-card {
    padding: 18px;
    background: var(--px-surface-soft);
    border: 1px solid var(--px-border-soft);
    border-radius: var(--px-radius-md);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.px-cat-card h3 {
    font-size: 15px;
    font-weight: 800;
    margin: 0;
    color: var(--px-text-main);
}

.px-cat-card strong {
    font-size: 20px;
    color: var(--px-sage-dark);
}

/* GRILLE OBJECTIFS */
.px-dashboard-goals-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
}

.px-dashboard-button {
    background: var(--px-sage-main);
    color: #ffffff;
    border: 0;
    padding: 11px 20px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(77, 115, 88, 0.25);
    transition: transform 0.2s ease, background-color 0.2s ease;
}

.px-dashboard-button:hover {
    background: var(--px-sage-dark);
    transform: translateY(-1px);
}

/* BARRES DE PROGRESSION */
.px-progress-track {
    width: 100%;
    height: 8px;
    background: #dde6dd;
    border-radius: 999px;
    overflow: hidden;
}

.px-progress-fill {
    height: 100%;
    background: var(--px-sage-main);
    border-radius: 999px;
}

/* BLOCS AUJOURD'HUI & HABITUDES */
.px-today-blocks {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.px-today-item {
    padding: 18px;
    background: var(--px-surface-soft);
    border: 1px solid var(--px-border-soft);
    border-radius: var(--px-radius-md);
}

.px-today-item-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.px-today-item h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
}

.px-habit-btn {
    padding: 7px 16px;
    border-radius: 999px;
    border: 1.5px solid var(--px-border);
    background: var(--px-surface);
    color: var(--px-text-main);
    cursor: pointer;
    font-weight: 800;
    font-size: 12px;
}

.px-habit-btn--done {
    background: var(--px-sage-main);
    color: #ffffff;
    border-color: var(--px-sage-main);
}

/* JALONS / MILESTONES */
.px-milestone-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.px-milestone-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--px-surface-soft);
    border-radius: var(--px-radius-md);
    border: 1px solid var(--px-border-soft);
}

.px-milestone-item h3 {
    font-size: 15px;
    font-weight: 800;
    margin: 0;
}

.px-action-link {
    background: transparent;
    border: 0;
    color: var(--px-sage-main);
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
}

/* ÉTAT DE CHARGEMENT */
.px-dashboard-state {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--px-text-sub);
}

/* RESPONSIVE */
@media (max-width: 960px) {
    .px-hero-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
    }

    .px-hero-metrics {
        width: 100%;
        justify-content: space-between;
        box-sizing: border-box;
    }

    .px-dashboard-grid {
        grid-template-columns: 1fr;
    }
}
</style>