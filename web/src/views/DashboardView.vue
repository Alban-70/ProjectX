<script setup>
import { computed, onMounted, ref, onBeforeUnmount } from 'vue'
import { api } from '../api.js'

import GoalCard from '../components/dashboard/GoalCard.vue'
import GoalFormModal from '../components/dashboard/GoalFormModal.vue'
import CheckinWidget from '../components/dashboard/CheckinWidget.vue'
import HabitHistory from '../components/dashboard/HabitHistory.vue'
import HabitFormModal from '../components/dashboard/HabitFormModal.vue'
import JournalTab from '../components/dashboard/JournalTab.vue'

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

const showHabitForm = ref(false)
const editingHabit = ref(null)
const habitSaving = ref(false)
const habitError = ref('')

const selectedHabitId = ref('')

const isHabitDropdownOpen = ref(false)
const habitDropdownRef = ref(null)

onMounted(async () => {
    await loadDashboard()
    document.addEventListener('click', handleClickOutsideHabitDropdown)
})

onBeforeUnmount(() => document.removeEventListener('click', handleClickOutsideHabitDropdown))

function selectHabit(habitId) {
    selectedHabitId.value = habitId
    isHabitDropdownOpen.value = false
}

function getSelectedHabitName() {
    const selected = habits.value.find(h => h.id === selectedHabitId.value)
    return selected ? selected.name : 'Choisir une habitude'
}

function handleClickOutsideHabitDropdown(event) {
    if (habitDropdownRef.value && !habitDropdownRef.value.contains(event.target)) {
        isHabitDropdownOpen.value = false
    }
}

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

        if (!habits.value.some(h => h.id === selectedHabitId.value)) {
            selectedHabitId.value = habits.value[0]?.id || ''
        }
    } catch (e) {
        error.value = 'Erreur lors du chargement des données.'
    } finally {
        loading.value = false
    }
}

/* COMPUTEDS TEMPORELS & RECAP */
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
        return { ...cat, progress, goalCount: catGoals.length, habitCount: catHabits.length }
    })
})

/* HABITUDES & STREAK */
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

/* GESTION HABITUDES MODALE */
function openCreateHabit() { editingHabit.value = null; habitError.value = ''; showHabitForm.value = true }
function openEditHabit(habit) { editingHabit.value = habit; habitError.value = ''; showHabitForm.value = true }

async function handleSaveHabit(formData) {
    habitSaving.value = true
    try {
        if (editingHabit.value) {
            const res = await api.updateHabit(editingHabit.value.id, formData)
            const updated = res?.habit ?? res
            habits.value = habits.value.map(h => h.id === editingHabit.value.id ? { ...h, ...formData, ...updated } : h)
        } else {
            const res = await api.createHabit(formData)
            const created = res?.habit ?? res
            habits.value.push(created)
            selectedHabitId.value = created.id
        }
        showHabitForm.value = false
    } catch (e) {
        habitError.value = e.message || 'Impossible d’enregistrer l’habitude.'
    } finally {
        habitSaving.value = false
    }
}

/* JALONS & ACTIONS */
const sortedMilestones = computed(() => {
    return [...milestones.value].sort((a, b) => {
        if (a.completed_at && !b.completed_at) return 1
        if (!a.completed_at && b.completed_at) return -1
        return (a.target_date || '').localeCompare(b.target_date || '')
    })
})

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

/* HANDLERS OBJECTIFS */
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

            <!-- NAVIGATION PAR ONGLETS -->
            <nav class="px-tabs-bar">
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'today' }"
                    @click="activeTab = 'today'">✦ Aujourd'hui</button>
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'domains' }"
                    @click="activeTab = 'domains'">Domaines & Objectifs</button>
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'habits' }"
                    @click="activeTab = 'habits'">Habitudes & Suivi</button>
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'milestones' }"
                    @click="activeTab = 'milestones'">Jalons</button>
                <button type="button" class="px-tab-btn" :class="{ 'px-tab-btn--active': activeTab === 'journal' }"
                    @click="activeTab = 'journal'">Mon Journal</button>
            </nav>

            <!-- CONTENU DE L'ONGLET -->
            <div class="px-tab-content">

                <!-- 1. AUJOURD'HUI -->
                <div v-if="activeTab === 'today'" class="px-dashboard-grid">
                    <div class="px-main-column">

                        <!-- BANDEAU GUIDE PÉDAGOGIQUE -->
                        <div class="px-guide-card">
                            <div class="px-guide-icon">✦</div>
                            <div class="px-guide-body">
                                <h3>Ton cockpit quotidien</h3>
                                <p>Cette vue rassemble tout ce que tu peux accomplir aujourd'hui pour garder une
                                    dynamique constante.</p>
                                <div class="px-guide-steps">
                                    <span><strong>Valider une routine :</strong> Clique sur le bouton <em>« Valider
                                            »</em> face à une habitude.</span>
                                    <span><strong>Faire ton bilan :</strong> Remplis le widget <em>Check-in</em> sur la
                                        droite pour enregistrer ton humeur et tes réussites du jour.</span>
                                </div>
                            </div>
                        </div>

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

                    <!-- BANDEAU GUIDE PÉDAGOGIQUE -->
                    <div class="px-guide-card">
                        <div class="px-guide-icon">🎯</div>
                        <div class="px-guide-body">
                            <h3>Domaines de vie & Objectifs chiffrés</h3>
                            <p>Organise tes ambitions et suis tes cibles chiffrées par domaine d'activité.</p>
                            <div class="px-guide-steps">
                                <span><strong>Créer un objectif :</strong> Clique sur <em>« + Nouvel objectif »</em> et
                                    définis tes niveaux (Minimum, Target, Bonus).</span>
                                <span><strong>Saisir une avance :</strong> Sur une carte, clique sur <em>« + Progression
                                        »</em> pour ajouter tes derniers résultats (ex: +5 km).</span>
                                <span><strong>Gérer une carte :</strong> Utilise le <em>crayon ✎</em> pour modifier ou
                                    la <em>croix ×</em> pour supprimer.</span>
                            </div>
                        </div>
                    </div>

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
                                :expanded-history="expandedGoalHistoryId === goal.id"
                                :progress-form-goal-id="progressGoalId" :deleting="deletingGoalId === goal.id"
                                @open-progress="g => progressGoalId = g.id" @close-progress="progressGoalId = null"
                                @save-progress="handleSaveProgress" @edit="openEditGoal" @delete="handleDeleteGoal"
                                @toggle-history="id => expandedGoalHistoryId = expandedGoalHistoryId === id ? null : id" />
                        </div>
                    </section>
                </div>

                <!-- 3. HABITUDES & SUIVI -->
                <div v-else-if="activeTab === 'habits'" class="px-tab-pane">

                    <!-- BANDEAU GUIDE PÉDAGOGIQUE -->
                    <div class="px-guide-card">
                        <div class="px-guide-icon">🔥</div>
                        <div class="px-guide-body">
                            <h3>Régularité & Suivi d'habitudes</h3>
                            <p>Analyse la constance de tes routines et conserve tes séries actives (*streaks*) sur le
                                long terme.</p>
                            <div class="px-guide-steps">
                                <span><strong>Sélectionner une habitude :</strong> Utilise le menu déroulant sur-mesure
                                    ci-dessous pour choisir la routine à analyser.</span>
                                <span><strong>Consulter le calendrier :</strong> Visualise les jours validés et ton taux
                                    de réussite mensuel.</span>
                                <span><strong>Ajouter une routine :</strong> Clique sur <em>« + Nouvelle habitude »</em>
                                    pour en configurer une nouvelle.</span>
                            </div>
                        </div>
                    </div>

                    <section class="px-card">
                        <div class="px-section-header">
                            <div>
                                <h2>Gestion des Habitudes</h2>
                                <p class="px-sub-text">Consulte l'historique et la régularité de tes routines.</p>
                            </div>
                            <button type="button" class="px-dashboard-button" @click="openCreateHabit">
                                + Nouvelle habitude
                            </button>
                        </div>

                        <!-- SÉLECTEUR PERSONNALISÉ D'HABITUDE -->
                        <div v-if="habits.length" class="px-habit-selector-wrapper" ref="habitDropdownRef">
                            <label class="px-selector-label">Habitude consultée</label>
                            <div class="px-custom-select" :class="{ 'is-open': isHabitDropdownOpen }"
                                @click="isHabitDropdownOpen = !isHabitDropdownOpen">
                                <div class="px-select-current">
                                    <span class="px-habit-dot"></span>
                                    <span class="px-select-title">{{ getSelectedHabitName() }}</span>
                                </div>
                                <span class="px-select-arrow">▾</span>
                            </div>

                            <!-- MENU DÉROULANT FLOTTANT -->
                            <Transition name="dropdown">
                                <ul v-if="isHabitDropdownOpen" class="px-dropdown-menu">
                                    <li v-for="h in habits" :key="h.id" class="px-dropdown-item"
                                        :class="{ 'is-selected': selectedHabitId === h.id }"
                                        @click.stop="selectHabit(h.id)">
                                        <span class="px-habit-dot"></span>
                                        <div class="px-habit-item-info">
                                            <span class="px-habit-item-name">{{ h.name }}</span>
                                            <small class="px-habit-item-sub">{{ h.frequency || 'Quotidienne' }}</small>
                                        </div>
                                        <span v-if="selectedHabitId === h.id" class="px-check-mark">✓</span>
                                    </li>
                                </ul>
                            </Transition>
                        </div>

                        <!-- COMPOSANT HABITHISTORY -->
                        <HabitHistory v-if="selectedHabitId" :habit-id="selectedHabitId" @edit="openEditHabit" />
                        <div v-else class="px-empty-state">
                            <p>Aucune habitude créée pour le moment.</p>
                        </div>
                    </section>
                </div>

                <!-- 4. JALONS (MILESTONES) -->
                <div v-else-if="activeTab === 'milestones'" class="px-tab-pane">

                    <!-- BANDEAU GUIDE PÉDAGOGIQUE -->
                    <div class="px-guide-card">
                        <div class="px-guide-icon">🚩</div>
                        <div class="px-guide-body">
                            <h3>Jalons & Feuilles de route</h3>
                            <p>Valide les grandes étapes majeures qui structurent l'avancement global de ton projet.</p>
                            <div class="px-guide-steps">
                                <span><strong>Compléter une étape :</strong> Clique sur <em>« Marquer comme accompli
                                        »</em> lorsque tu as franchi un cap.</span>
                                <span><strong>Ajuster :</strong> Tu peux à tout moment cliquer sur <em>« Rouvrir »</em>
                                    si une étape nécessite plus de travail.</span>
                            </div>
                        </div>
                    </div>

                    <section class="px-card">
                        <h2>Jalons du parcours</h2>
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

                <!-- 5. JOURNAL PERSONNEL -->
                <div v-else-if="activeTab === 'journal'" class="px-tab-pane">

                    <!-- BANDEAU GUIDE PÉDAGOGIQUE -->
                    <div class="px-guide-card">
                        <div class="px-guide-icon">📖</div>
                        <div class="px-guide-body">
                            <h3>Journal Personnel</h3>
                            <p>Prends du recul sur ton parcours, consigne tes réflexions et garde une trace de tes
                                prises de conscience.</p>
                            <div class="px-guide-steps">
                                <span><strong>Rédiger :</strong> Clique sur <em>« + Nouvelle entrée »</em> pour ajouter
                                    un titre, un texte et une humeur.</span>
                                <span><strong>Rechercher :</strong> Utilise les filtres de recherche et de dates pour
                                    retrouver tes souvenirs.</span>
                            </div>
                        </div>
                    </div>

                    <JournalTab :project-id="project?.id" />
                </div>
            </div>
        </div>

        <!-- MODALE HABITUDES -->
        <HabitFormModal :show="showHabitForm" :editing-habit="editingHabit" :categories="categories"
            :saving="habitSaving" :error="habitError" :today-string="todayString" @close="showHabitForm = false"
            @save="handleSaveHabit" />
    </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&display=swap');

.px-dashboard-page {
    min-height: 100vh;
    width: 100%;
    background: #e6ece4;
    font-family: 'Nunito', sans-serif;
    padding: 28px 36px 60px;
    box-sizing: border-box;
}

.px-dashboard-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 28px;
}

/* HERO BANNER */
.px-hero-banner {
    background: #ffffff;
    border: 1px solid #d4ded3;
    border-radius: 26px;
    padding: 28px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 12px 32px -6px rgba(36, 46, 39, 0.08);
}

.px-badge-live {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: #2d4734;
    color: #fff;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
}

.px-badge-dot {
    width: 7px;
    height: 7px;
    background: #d9a05b;
    border-radius: 50%;
}

.px-project-title {
    font-size: 34px;
    font-weight: 900;
    margin: 8px 0 0;
    color: #242e27;
}

.px-hero-metrics {
    display: flex;
    gap: 24px;
    background: #f4f8f3;
    padding: 18px 28px;
    border-radius: 18px;
    border: 1px solid #e8eee7;
}

.px-metric-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d9b90;
    display: block;
}

.px-metric-value {
    font-size: 24px;
    font-weight: 900;
    color: #2d4734;
}

/* BARRE D'ONGLETS */
.px-tabs-bar {
    display: flex;
    gap: 8px;
    background: rgba(255, 255, 255, 0.6);
    padding: 6px;
    border-radius: 999px;
    border: 1px solid #d4ded3;
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
    color: #5c6a60;
    cursor: pointer;
}

.px-tab-btn--active {
    background: #ffffff;
    color: #2d4734;
    box-shadow: 0 4px 12px rgba(36, 46, 39, 0.08);
    border-bottom: 2px solid #4d7358;
}

/* BANDEAU DE GUIDE PÉDAGOGIQUE (TAILLES DE TEXTE AGRANDIES) */
.px-guide-card {
    display: flex;
    gap: 18px;
    padding: 22px 26px;
    background: #fbf8f3;
    border: 1px solid #e8decb;
    border-radius: 22px;
    box-shadow: 0 6px 20px -4px rgba(60, 48, 38, 0.05);
}

.px-guide-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid #e8decb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
    color: #5a4638;
    box-shadow: 0 2px 8px rgba(60, 48, 38, 0.04);
}

.px-guide-body h3 {
    margin: 0 0 6px;
    font-size: 17px;
    /* Agrandit le titre du guide */
    font-weight: 800;
    color: #382c23;
}

.px-guide-body p {
    margin: 0 0 12px;
    font-size: 14.5px;
    /* Agrandit le texte descriptif */
    color: #5d4c3f;
    line-height: 1.5;
}

.px-guide-steps {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13.5px;
    /* Agrandit la taille des étapes */
    color: #4a3c31;
    line-height: 1.4;
}

.px-guide-steps span {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.px-guide-steps span::before {
    content: "•";
    color: #b0722a;
    font-weight: bold;
    font-size: 16px;
}

/* GRILLES ET CARTES */
.px-dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 28px;
}

.px-main-column,
.px-side-column,
.px-tab-pane {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.px-card {
    background: #ffffff;
    border: 1px solid #e8eee7;
    border-radius: 26px;
    padding: 28px;
    box-shadow: 0 12px 32px -6px rgba(36, 46, 39, 0.08);
}

.px-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.px-category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
}

.px-cat-card {
    padding: 18px;
    background: #f4f8f3;
    border: 1px solid #e8eee7;
    border-radius: 18px;
}

.px-dashboard-goals-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
}

.px-dashboard-button {
    background: #4d7358;
    color: white;
    border: 0;
    padding: 11px 20px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
}

.px-progress-track {
    width: 100%;
    height: 8px;
    background: #dde6dd;
    border-radius: 999px;
    overflow: hidden;
}

.px-progress-fill {
    height: 100%;
    background: #4d7358;
}

.px-today-blocks {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.px-today-item {
    padding: 18px;
    background: #f4f8f3;
    border: 1px solid #e8eee7;
    border-radius: 18px;
}

.px-today-item-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.px-habit-btn {
    padding: 7px 16px;
    border-radius: 999px;
    border: 1.5px solid #d4ded3;
    background: #ffffff;
    cursor: pointer;
    font-weight: 800;
    font-size: 12px;
}

.px-habit-btn--done {
    background: #4d7358;
    color: white;
    border-color: #4d7358;
}

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
    background: #f4f8f3;
    border-radius: 18px;
    border: 1px solid #e8eee7;
}

.px-action-link {
    background: transparent;
    border: 0;
    color: #4d7358;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
}

/* SÉLECTEUR SUR MESURE HABITUDES */
.px-sub-text {
    font-size: 13px;
    color: #8d9b90;
    margin: 2px 0 0;
}

.px-habit-selector-wrapper {
    position: relative;
    margin-bottom: 24px;
    max-width: 380px;
}

.px-selector-label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d9b90;
    margin-bottom: 6px;
    letter-spacing: 0.05em;
}

.px-custom-select {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-radius: 16px;
    border: 1px solid #d4ded3;
    background: #f4f8f3;
    font-size: 14px;
    font-weight: 700;
    color: #242e27;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
}

.px-custom-select:hover,
.px-custom-select.is-open {
    border-color: #4d7358;
    background: #ffffff;
    box-shadow: 0 4px 14px rgba(36, 46, 39, 0.06);
}

.px-select-current {
    display: flex;
    align-items: center;
    gap: 10px;
}

.px-habit-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4d7358;
    flex-shrink: 0;
}

.px-select-title {
    color: #2d4734;
    font-weight: 800;
}

.px-select-arrow {
    font-size: 12px;
    color: #8d9b90;
    transition: transform 0.2s ease;
}

.px-custom-select.is-open .px-select-arrow {
    transform: rotate(180deg);
    color: #4d7358;
}

.px-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 30;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: #ffffff;
    border: 1px solid #d4ded3;
    border-radius: 16px;
    box-shadow: 0 12px 30px -6px rgba(36, 46, 39, 0.15);
    max-height: 220px;
    overflow-y: auto;
}

.px-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s ease;
}

.px-dropdown-item:hover {
    background: #f4f8f3;
}

.px-dropdown-item.is-selected {
    background: #e8eee7;
}

.px-habit-item-info {
    display: flex;
    flex-direction: column;
}

.px-habit-item-name {
    font-size: 13px;
    font-weight: 800;
    color: #242e27;
}

.px-habit-item-sub {
    font-size: 11px;
    color: #8d9b90;
    text-transform: capitalize;
}

.px-check-mark {
    margin-left: auto;
    font-size: 13px;
    font-weight: 900;
    color: #4d7358;
}

.px-empty-state {
    padding: 24px;
    text-align: center;
    color: #8d9b90;
    font-size: 13px;
}

.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>