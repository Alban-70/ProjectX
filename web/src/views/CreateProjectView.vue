<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '../api.js'
import { useProjectCreationStore } from '../stores/projectCreation.js'

const router = useRouter()

const {
    currentStep,
    name,
    description,
    motto,
    duration,
    customDuration,
    selectedCategories,
    objectives,
    habits,
    loadDraft,
    clearDraft,
} = useProjectCreationStore()

const totalSteps = 6

const categories = ref([])

const newObjective = ref({
    name: '',
    category_id: '',
    minimum: '',
    target: '',
    bonus: '',
    unit: '',
    deadline: '',
})

const newHabit = ref({
    name: '',
    category_id: '',
    frequency: 'weekly',
    times_per_period: 1,
    start_date: '',
    end_date: '',
})

const loading = ref(false)
const loadingCategories = ref(true)
const error = ref('')

const stepTitles = [
    { number: '01', label: 'Identité', title: 'Nom & Vision' },
    { number: '02', label: 'Horizon', title: 'Durée du projet' },
    { number: '03', label: 'Domaines', title: 'Catégories' },
    { number: '04', label: 'Actions', title: 'Objectifs' },
    { number: '05', label: 'Rythme', title: 'Habitudes' },
    { number: '06', label: 'Envol', title: 'Confirmation' },
]

const durationInMonths = computed(() => {
    if (duration.value === 'custom') {
        return Number(customDuration.value)
    }
    return Number(duration.value)
})

const selectedCategoryList = computed(() => {
    return categories.value.filter(category =>
        selectedCategories.value.includes(category.id)
    )
})

onMounted(async () => {
    loadDraft()
    loadingCategories.value = true
    error.value = ''

    try {
        const data = await api.categories()
        categories.value = data.categories || []

        if (categories.value.length === 0) {
            error.value = 'Aucune catégorie disponible.'
        }
    } catch (e) {
        console.error('Erreur chargement catégories:', e)
        error.value =
            e instanceof Error
                ? e.message
                : 'Impossible de charger les catégories.'
    } finally {
        loadingCategories.value = false
    }
})

function goToStep(step) {
    if (step < currentStep.value) {
        error.value = ''
        currentStep.value = step
    }
}

function nextStep() {
    error.value = ''

    if (currentStep.value === 1 && !name.value.trim()) {
        error.value = 'Le nom du projet est requis.'
        return
    }

    if (currentStep.value === 3 && selectedCategories.value.length === 0) {
        error.value = 'Sélectionne au moins une catégorie.'
        return
    }

    if (currentStep.value === 4 && objectives.value.length === 0) {
        error.value = 'Ajoute au moins un objectif.'
        return
    }

    if (currentStep.value === 5 && habits.value.length === 0) {
        error.value = 'Ajoute au moins une habitude.'
        return
    }

    currentStep.value++
}

function previousStep() {
    error.value = ''
    if (currentStep.value > 1) {
        currentStep.value--
    }
}

const projectDuration = computed(() => {
    const dates = calculateDates()
    if (!dates) return 0

    const start = new Date(dates.start_date)
    const end = new Date(dates.end_date)

    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
})

const projectDurationLabel = computed(() => {
    const months = projectDuration.value
    return months === 1 ? '1 mois' : `${months} mois`
})

const objectiveCount = computed(() => objectives.value.length)
const habitCount = computed(() => habits.value.length)

function toggleCategory(categoryId) {
    if (selectedCategories.value.includes(categoryId)) {
        selectedCategories.value = selectedCategories.value.filter(id => id !== categoryId)
    } else {
        selectedCategories.value.push(categoryId)
    }
}

function addObjective() {
    if (Number(newObjective.value.minimum) > Number(newObjective.value.target)) {
        error.value = 'Le minimum doit être inférieur ou égal au target.'
        return
    }

    if (Number(newObjective.value.target) > Number(newObjective.value.bonus)) {
        error.value = 'Le target doit être inférieur ou égal au bonus.'
        return
    }

    if (!newObjective.value.name.trim()) {
        error.value = 'Le nom de l’objectif est requis.'
        return
    }

    if (!newObjective.value.category_id) {
        error.value = 'Choisis une catégorie pour cet objectif.'
        return
    }

    objectives.value.push({
        id: crypto.randomUUID(),
        ...newObjective.value,
    })

    newObjective.value = {
        name: '',
        category_id: '',
        minimum: '',
        target: '',
        bonus: '',
        unit: '',
        deadline: '',
    }

    error.value = ''
}

function removeObjective(objectiveId) {
    objectives.value = objectives.value.filter(objective => objective.id !== objectiveId)
}

function addHabit() {
    if (!newHabit.value.name.trim()) {
        error.value = "Le nom de l'habitude est requis."
        return
    }

    if (!newHabit.value.category_id) {
        error.value = "Choisis une catégorie pour cette habitude."
        return
    }

    if (!newHabit.value.times_per_period || newHabit.value.times_per_period < 1) {
        error.value = 'Le nombre de fois doit être supérieur à 0.'
        return
    }

    if (!newHabit.value.start_date) {
        error.value = "La date de début de l'habitude est requise."
        return
    }

    if (!newHabit.value.end_date) {
        error.value = "La date de fin de l'habitude est requise."
        return
    }

    if (newHabit.value.end_date < newHabit.value.start_date) {
        error.value = 'La date de fin doit être après la date de début.'
        return
    }

    habits.value.push({
        id: crypto.randomUUID(),
        ...newHabit.value,
    })

    newHabit.value = {
        name: '',
        category_id: '',
        frequency: 'weekly',
        times_per_period: 1,
        start_date: '',
        end_date: '',
    }

    error.value = ''
}

function removeHabit(habitId) {
    habits.value = habits.value.filter(habit => habit.id !== habitId)
}

async function createProject() {
    error.value = ''

    if (!name.value.trim()) {
        error.value = 'Le nom du projet est requis.'
        return
    }

    if (selectedCategories.value.length === 0) {
        error.value = 'Sélectionne au moins une catégorie.'
        return
    }

    if (duration.value === 'custom' && (!customDuration.value || customDuration.value < 1)) {
        error.value = 'La durée doit être d’au moins 1 mois.'
        return
    }

    loading.value = true

    try {
        const dates = calculateDates()

        await api.createProject({
            name: name.value,
            description: description.value,
            motto: motto.value,
            start_date: dates.start_date,
            end_date: dates.end_date,
            categories: selectedCategories.value,
            objectives: objectives.value,
            habits: habits.value,
        })

        clearDraft()
        router.push('/')
    } catch (e) {
        console.error('Erreur création Project X:', e)
        error.value = e instanceof Error ? e.message : 'Impossible de créer le Project X.'
    } finally {
        loading.value = false
    }
}

function calculateDates() {
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + durationInMonths.value)

    return {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
    }
}
</script>

<template>
    <main class="px-fullscreen">

        <div class="px-fullscreen-body">

            <!-- SIDEBAR GAUCHE FIXE -->
            <aside class="px-aside">
                <div class="px-aside-top">
                    <div class="px-brand">
                        <span class="px-brand-dot"></span>
                        <span class="px-brand-name">PROJECT X</span>
                    </div>

                    <div class="px-project-info">
                        <div class="px-info-tag">
                            <span>Projet</span>
                            <strong class="px-project-name-text">{{ name || 'Sans titre' }}</strong>
                        </div>
                        <div class="px-info-tag">
                            <span>Horizon</span>
                            <strong>{{ projectDurationLabel }}</strong>
                        </div>
                    </div>

                    <nav class="px-nav-list">
                        <div v-for="(step, idx) in stepTitles" :key="idx" class="px-nav-item" :class="{
                            'px-nav-item--active': currentStep === (idx + 1),
                            'px-nav-item--done': currentStep > (idx + 1)
                        }" @click="goToStep(idx + 1)">
                            <div class="px-nav-badge">
                                <span v-if="currentStep > (idx + 1)">✓</span>
                                <span v-else>{{ step.number }}</span>
                            </div>
                            <div class="px-nav-info">
                                <span class="px-nav-label">{{ step.label }}</span>
                                <span class="px-nav-title">{{ step.title }}</span>
                            </div>
                        </div>
                    </nav>
                </div>

                <div class="px-aside-footer">
                    <p class="px-aside-quote">
                        « La constance prévaut toujours sur l'intensité. »
                    </p>
                </div>
            </aside>

            <!-- CONTENU PRINCIPAL AJUSTÉ -->
            <section class="px-main-wrapper">
                <div class="px-hero-container">

                    <!-- CHARGEMENT -->
                    <div v-if="loadingCategories" class="px-hero-card px-center-card">
                        <div class="px-loading-orbit">
                            <span></span>
                        </div>
                        <h2>Préparation de ton espace zen...</h2>
                        <p>Chaque grande transformation commence par un instant de calme.</p>
                    </div>

                    <!-- ERREUR CHARGEMENT -->
                    <div v-else-if="error && categories.length === 0" class="px-hero-card px-center-card">
                        <div class="px-error-icon">!</div>
                        <h2>{{ error }}</h2>
                        <button type="button" class="px-btn px-btn--secondary" @click="router.push('/')">
                            Retourner au tableau de bord
                        </button>
                    </div>

                    <template v-else>
                        <form class="px-hero-form" @submit.prevent="createProject">

                            <div class="px-hero-card">

                                <!-- ÉTAPE 1 : IDENTITÉ -->
                                <div v-if="currentStep === 1" class="px-step-body">
                                    <header class="px-hero-header">
                                        <span class="px-hero-badge">01. Identité</span>
                                        <h1 class="px-hero-title">Donne une âme à ton projet</h1>
                                        <p class="px-hero-subtitle">Inscris ce projet dans ta vision personnelle. Prends
                                            le temps d'exprimer tes intentions.</p>
                                    </header>

                                    <div class="px-fields-stack">
                                        <div class="px-field">
                                            <label class="px-label" for="name">Nom du projet</label>
                                            <input id="name" v-model="name" class="px-input" type="text" maxlength="30"
                                                placeholder="Ex. : Nouvelle Énergie" autofocus />
                                        </div>

                                        <div class="px-field">
                                            <label class="px-label" for="description">Description & Vision</label>
                                            <textarea id="description" v-model="description" class="px-textarea"
                                                maxlength="1000" rows="4"
                                                placeholder="Pourquoi ce projet compte-t-il pour toi ?"></textarea>
                                        </div>

                                        <div class="px-field">
                                            <label class="px-label" for="motto">Motto / Mantra</label>
                                            <input id="motto" v-model="motto" class="px-input" type="text"
                                                maxlength="200"
                                                placeholder="Ex. : Avancer un jour à la fois avec bienveillance." />
                                        </div>
                                    </div>
                                </div>

                                <!-- ÉTAPE 2 : DURÉE -->
                                <div v-if="currentStep === 2" class="px-step-body">
                                    <header class="px-hero-header">
                                        <span class="px-hero-badge">02. Horizon</span>
                                        <h1 class="px-hero-title">Définis la période d'engagement</h1>
                                        <p class="px-hero-subtitle">Choisis une temporalité apaisante et adaptée à tes
                                            ambitions.</p>
                                    </header>

                                    <div class="px-fields-stack">
                                        <div class="px-field">
                                            <label class="px-label" for="duration">Durée globale</label>
                                            <select id="duration" v-model="duration" class="px-select">
                                                <option value="1">1 mois — Découverte & Élan initial</option>
                                                <option value="3">3 mois — Cycle trimestriel équilibré</option>
                                                <option value="6">6 mois — Transformation continue</option>
                                                <option value="9">9 mois — Approfondissement</option>
                                                <option value="12">12 mois — Un cycle annuel complet</option>
                                                <option value="custom">Durée sur-mesure</option>
                                            </select>
                                        </div>

                                        <div v-if="duration === 'custom'" class="px-field">
                                            <label class="px-label" for="customDuration">Mois personnalisés</label>
                                            <input id="customDuration" v-model.number="customDuration" class="px-input"
                                                type="number" min="1" placeholder="Ex. : 18" />
                                        </div>

                                        <div class="px-preview-banner">
                                            <span>Horizon estimé du projet :</span>
                                            <strong>{{ projectDurationLabel }}</strong>
                                        </div>
                                    </div>
                                </div>

                                <!-- ÉTAPE 3 : CATÉGORIES -->
                                <div v-if="currentStep === 3" class="px-step-body">
                                    <header class="px-hero-header">
                                        <span class="px-hero-badge">03. Domaines</span>
                                        <h1 class="px-hero-title">Sur quels piliers souhaites-tu progresser ?</h1>
                                        <p class="px-hero-subtitle">Sélectionne au moins une catégorie d'épanouissement.
                                        </p>
                                    </header>

                                    <div class="px-categories-grid">
                                        <button v-for="category in categories" :key="category.id" type="button"
                                            class="px-cat-card"
                                            :class="{ 'px-cat-card--selected': selectedCategories.includes(category.id) }"
                                            @click="toggleCategory(category.id)">
                                            <div class="px-cat-check">
                                                <span v-if="selectedCategories.includes(category.id)">✓</span>
                                            </div>
                                            <strong class="px-cat-title">{{ category.name }}</strong>
                                            <p class="px-cat-text">{{ category.description }}</p>
                                        </button>
                                    </div>
                                </div>

                                <!-- ÉTAPE 4 : OBJECTIFS -->
                                <div v-if="currentStep === 4" class="px-step-body">
                                    <header class="px-hero-header">
                                        <span class="px-hero-badge">04. Objectifs</span>
                                        <h1 class="px-hero-title">Formule tes intentions</h1>
                                        <p class="px-hero-subtitle">Définis des seuils ajustables pour avancer à ton
                                            rythme sans culpabiliser.</p>
                                    </header>

                                    <div class="px-fields-stack">
                                        <div class="px-field">
                                            <label class="px-label">Nom de l'objectif</label>
                                            <input v-model="newObjective.name" class="px-input" type="text"
                                                placeholder="Ex. : Méditation de pleine conscience" />
                                        </div>

                                        <div class="px-field">
                                            <label class="px-label">Catégorie rattachée</label>
                                            <select v-model="newObjective.category_id" class="px-select">
                                                <option value="">Sélectionner une catégorie</option>
                                                <option v-for="cat in selectedCategoryList" :key="cat.id"
                                                    :value="cat.id">
                                                    {{ cat.name }}
                                                </option>
                                            </select>
                                        </div>

                                        <div class="px-grid-3">
                                            <div class="px-field">
                                                <label class="px-label">Seuil Minimum</label>
                                                <input v-model.number="newObjective.minimum" class="px-input"
                                                    type="number" placeholder="10" />
                                            </div>
                                            <div class="px-field">
                                                <label class="px-label">Seuil Cible (Target)</label>
                                                <input v-model.number="newObjective.target" class="px-input"
                                                    type="number" placeholder="30" />
                                            </div>
                                            <div class="px-field">
                                                <label class="px-label">Seuil Bonus</label>
                                                <input v-model.number="newObjective.bonus" class="px-input"
                                                    type="number" placeholder="60" />
                                            </div>
                                        </div>

                                        <div class="px-grid-2">
                                            <div class="px-field">
                                                <label class="px-label">Unité de mesure</label>
                                                <input v-model="newObjective.unit" class="px-input" type="text"
                                                    placeholder="ex. minutes, séances, km" />
                                            </div>
                                            <div class="px-field">
                                                <label class="px-label">Échéance souhaitée</label>
                                                <input v-model="newObjective.deadline" class="px-input" type="date" />
                                            </div>
                                        </div>

                                        <button type="button" class="px-btn px-btn--add"
                                            @click="addObjective">
                                            + Ajouter cet objectif
                                        </button>
                                    </div>
                                </div>

                                <!-- ÉTAPE 5 : HABITUDES -->
                                <div v-if="currentStep === 5" class="px-step-body">
                                    <header class="px-hero-header">
                                        <span class="px-hero-badge">05. Routines</span>
                                        <h1 class="px-hero-title">Ancre des habitudes durables</h1>
                                        <p class="px-hero-subtitle">Détermine la répétition de tes actions au quotidien.
                                        </p>
                                    </header>

                                    <div class="px-fields-stack">
                                        <div class="px-field">
                                            <label class="px-label">Nom de l'habitude</label>
                                            <input v-model="newHabit.name" class="px-input" type="text"
                                                placeholder="Ex. : Boire une tisane au calme" />
                                        </div>

                                        <div class="px-field">
                                            <label class="px-label">Catégorie</label>
                                            <select v-model="newHabit.category_id" class="px-select">
                                                <option value="">Sélectionner une catégorie</option>
                                                <option v-for="cat in selectedCategoryList" :key="cat.id"
                                                    :value="cat.id">
                                                    {{ cat.name }}
                                                </option>
                                            </select>
                                        </div>

                                        <div class="px-grid-2">
                                            <div class="px-field">
                                                <label class="px-label">Fréquence</label>
                                                <select v-model="newHabit.frequency" class="px-select">
                                                    <option value="daily">Par jour</option>
                                                    <option value="weekly">Par semaine</option>
                                                    <option value="monthly">Par mois</option>
                                                </select>
                                            </div>
                                            <div class="px-field">
                                                <label class="px-label">Fois par période</label>
                                                <input v-model.number="newHabit.times_per_period" class="px-input"
                                                    type="number" min="1" placeholder="1" />
                                            </div>
                                        </div>

                                        <div class="px-grid-2">
                                            <div class="px-field">
                                                <label class="px-label">Date de lancement</label>
                                                <input v-model="newHabit.start_date" class="px-input" type="date" />
                                            </div>
                                            <div class="px-field">
                                                <label class="px-label">Date de fin</label>
                                                <input v-model="newHabit.end_date" class="px-input" type="date" />
                                            </div>
                                        </div>

                                        <button type="button" class="px-btn px-btn--add"
                                            @click="addHabit">
                                            + Ajouter cette habitude
                                        </button>
                                    </div>
                                </div>

                                <!-- ÉTAPE 6 : CONFIRMATION -->
                                <div v-if="currentStep === 6" class="px-step-body px-confirm-center">
                                    <div class="px-confirm-star">✦</div>
                                    <h1 class="px-hero-title">Ton Project X est prêt</h1>
                                    <p class="px-hero-subtitle">Prends un moment de calme pour valider l'ensemble de la
                                        structure de ton projet.</p>

                                    <div class="px-summary-grid">
                                        <div class="px-summary-card">
                                            <span>Nom du projet</span>
                                            <strong>{{ name }}</strong>
                                        </div>
                                        <div class="px-summary-card">
                                            <span>Horizon</span>
                                            <strong>{{ projectDurationLabel }}</strong>
                                        </div>
                                        <div class="px-summary-card">
                                            <span>Catégories</span>
                                            <strong>{{ selectedCategories.length }} retenue(s)</strong>
                                        </div>
                                        <div class="px-summary-card">
                                            <span>Engagements</span>
                                            <strong>{{ objectiveCount }} obj. / {{ habitCount }} routine(s)</strong>
                                        </div>
                                    </div>
                                </div>

                                <!-- ALERTE ERREUR -->
                                <div v-if="error" class="px-error-banner">
                                    <span class="px-error-dot">!</span>
                                    <span>{{ error }}</span>
                                </div>

                                <!-- FOOTER D'ACTIONS -->
                                <footer class="px-card-footer">
                                    <button type="button" class="px-btn px-btn--ghost" :disabled="currentStep === 1"
                                        @click="previousStep">
                                        ← Étape précédente
                                    </button>

                                    <button v-if="currentStep < totalSteps" type="button" class="px-btn px-btn--primary"
                                        @click="nextStep">
                                        Continuer →
                                    </button>

                                    <button v-else type="submit" class="px-btn px-btn--primary" :disabled="loading">
                                        <span v-if="loading" class="px-spinner"></span>
                                        {{ loading ? 'Création en cours...' : 'Officialiser mon Project X ✦' }}
                                    </button>
                                </footer>

                            </div>

                        </form>

                        <!-- LISTES DE RÉCAPITULATIF EN DESSOUS -->
                        <div v-if="objectives.length && currentStep === 4" class="px-recap-section">
                            <h2 class="px-recap-heading">Objectifs programmés ({{ objectives.length }})</h2>
                            <div class="px-recap-cards-grid">
                                <div v-for="obj in objectives" :key="obj.id" class="px-recap-card">
                                    <div class="px-recap-card-header">
                                        <strong>{{ obj.name }}</strong>
                                        <button type="button" class="px-delete-link"
                                            @click="removeObjective(obj.id)">Supprimer</button>
                                    </div>
                                    <div class="px-recap-pills">
                                        <span class="px-pill px-pill--soft">Min: {{ obj.minimum }} {{ obj.unit }}</span>
                                        <span class="px-pill px-pill--sage">Cible: {{ obj.target }} {{ obj.unit
                                            }}</span>
                                        <span class="px-pill px-pill--sand">Bonus: {{ obj.bonus }} {{ obj.unit }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="habits.length && currentStep === 5" class="px-recap-section">
                            <h2 class="px-recap-heading">Habitudes programmées ({{ habits.length }})</h2>
                            <div class="px-recap-cards-grid">
                                <div v-for="h in habits" :key="h.id" class="px-recap-card">
                                    <div class="px-recap-card-header">
                                        <strong>{{ h.name }}</strong>
                                        <button type="button" class="px-delete-link"
                                            @click="removeHabit(h.id)">Supprimer</button>
                                    </div>
                                    <p class="px-recap-sub">
                                        {{ h.times_per_period }}x / {{ h.frequency === 'daily' ? 'jour' : h.frequency
                                        === 'weekly' ? 'semaine' : 'mois' }}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </template>
                </div>
            </section>

        </div>
    </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.px-fullscreen {
    --px-bg: #f3f5ef;
    --px-surface: #ffffff;
    --px-surface-soft: #f8faf6;

    --px-sage: #7fa88a;
    --px-sage-dark: #55775f;
    --px-sage-light: #e4ece6;

    --px-sand: #e8c9a0;
    --px-sand-light: #f7eedf;

    --px-text: #2f3b33;
    --px-text-soft: #637168;
    --px-text-muted: #95a19a;

    --px-border: #e2e8e1;
    --px-border-soft: #edf1eb;

    --px-error-bg: #f7ebe6;
    --px-error-text: #73574c;
    --px-error-border: #edd6cb;

    --px-radius-sm: 16px;
    --px-radius-md: 20px;
    --px-radius-lg: 28px;

    --px-shadow-soft: 0 10px 30px -4px rgba(47, 59, 51, 0.04);
    --px-shadow-card: 0 20px 50px -8px rgba(47, 59, 51, 0.07);

    --px-transition: 350ms cubic-bezier(0.16, 1, 0.3, 1);

    min-height: 100vh;
    width: 100%;
    background:
        radial-gradient(circle at 10% 10%, rgba(127, 168, 138, 0.15), transparent 45%),
        radial-gradient(circle at 90% 90%, rgba(232, 201, 160, 0.18), transparent 45%),
        var(--px-bg);

    color: var(--px-text);
    font-family: 'Nunito', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
}

.px-fullscreen-body {
    display: grid;
    grid-template-columns: 300px 1fr;
    min-height: 100vh;
}

/* =========================================================
   SIDEBAR GAUCHE FIXE (NON-SCROLLABLE)
   ========================================================= */
.px-aside {
    position: sticky;
    top: 0;
    height: 100vh;
    padding: 36px 24px;
    background: rgba(255, 255, 255, 0.6);
    border-right: 1px solid var(--px-border-soft);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    backdrop-filter: blur(12px);
    box-sizing: border-box;
    overflow-y: auto;
}

.px-brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--px-sage-light);
    border-radius: 999px;
    margin-bottom: 20px;
}

.px-brand-dot {
    width: 8px;
    height: 8px;
    background: var(--px-sage);
    border-radius: 50%;
}

.px-brand-name {
    font-size: 11px;
    font-weight: 800;
    color: var(--px-sage-dark);
    letter-spacing: 0.1em;
}

.px-project-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
}

.px-info-tag {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 9px 12px;
    background: var(--px-surface);
    border: 1px solid var(--px-border-soft);
    border-radius: var(--px-radius-sm);
    font-size: 12px;
}

.px-info-tag span {
    color: var(--px-text-muted);
    flex-shrink: 0;
}

.px-project-name-text {
    font-weight: 800;
    color: var(--px-text);
    text-align: right;

    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;

    line-height: 1.25;
    max-height: 2.5em;
}

.px-info-tag strong {
    font-weight: 800;
    color: var(--px-text);
}

.px-nav-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.px-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--px-radius-sm);
    cursor: pointer;
    transition: all var(--px-transition);
}

.px-nav-item:hover {
    background: rgba(255, 255, 255, 0.85);
}

.px-nav-badge {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--px-border-soft);
    color: var(--px-text-muted);
    font-size: 12px;
    font-weight: 800;
    transition: all var(--px-transition);
}

.px-nav-item--active .px-nav-badge {
    background: var(--px-sage);
    color: white;
}

.px-nav-item--done .px-nav-badge {
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
}

.px-nav-info {
    display: flex;
    flex-direction: column;
}

.px-nav-label {
    font-size: 10px;
    color: var(--px-text-muted);
    font-weight: 700;
}

.px-nav-title {
    font-size: 13px;
    font-weight: 800;
}

.px-nav-item--active .px-nav-title {
    color: var(--px-sage-dark);
}

.px-aside-quote {
    font-size: 12px;
    color: var(--px-text-soft);
    font-style: italic;
    line-height: 1.4;
    margin: 0;
}

/* =========================================================
   CONTENU PRINCIPAL RÉDUIT À UNE TAILLE OPTIMALE
   ========================================================= */
.px-main-wrapper {
    padding: 40px 48px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    box-sizing: border-box;
}

.px-hero-container {
    width: 100%;
    max-width: 960px;
    /* Taille réajustée plus équilibrée */
}

.px-hero-card {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.95);
    border-radius: var(--px-radius-lg);
    padding: 48px;
    box-shadow: var(--px-shadow-card);
    backdrop-filter: blur(16px);
    animation: px-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes px-fade {
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.px-hero-header {
    margin-bottom: 36px;
}

.px-hero-badge {
    display: inline-block;
    padding: 6px 14px;
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 12px;
    letter-spacing: 0.04em;
}

.px-hero-title {
    font-size: 34px;
    /* Taille de titre ajustée */
    font-weight: 900;
    line-height: 1.18;
    margin: 0;
    letter-spacing: -0.01em;
}

.px-hero-subtitle {
    font-size: 16px;
    /* Taille de sous-titre ajustée */
    color: var(--px-text-soft);
    margin: 10px 0 0;
    line-height: 1.55;
}

/* CHAMPS DE FORMULAIRE */
.px-fields-stack {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.px-field {
    display: flex;
    flex-direction: column;
}

.px-label {
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 8px;
    color: var(--px-text);
}

.px-input,
.px-textarea,
.px-select {
    width: 100%;
    padding: 15px 20px;
    background: var(--px-surface);
    border: 1.5px solid var(--px-border);
    border-radius: var(--px-radius-md);
    font-family: inherit;
    font-size: 15px;
    color: var(--px-text);
    outline: none;
    box-sizing: border-box;
    transition: all var(--px-transition);
}

.px-input:hover,
.px-textarea:hover,
.px-select:hover {
    border-color: #cbd5cc;
}

.px-input:focus,
.px-textarea:focus,
.px-select:focus {
    border-color: var(--px-sage);
    box-shadow: 0 0 0 5px rgba(127, 168, 138, 0.16);
    background: #ffffff;
}

.px-textarea {
    resize: vertical;
    min-height: 130px;
}

.px-preview-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    background: var(--px-sand-light);
    border-radius: var(--px-radius-md);
    font-size: 15px;
}

/* GRILLES */
.px-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
}

.px-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
}

.px-categories-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
}

.px-cat-card {
    position: relative;
    padding: 24px;
    text-align: left;
    background: var(--px-surface);
    border: 1.5px solid var(--px-border);
    border-radius: var(--px-radius-md);
    cursor: pointer;
    transition: all var(--px-transition);
}

.px-cat-card:hover {
    transform: translateY(-3px);
    border-color: var(--px-sage);
    box-shadow: var(--px-shadow-soft);
}

.px-cat-card--selected {
    background: var(--px-sage-light);
    border-color: var(--px-sage);
}

.px-cat-check {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--px-surface-soft);
    border: 1px solid var(--px-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
}

.px-cat-card--selected .px-cat-check {
    background: var(--px-sage);
    color: white;
    border-color: var(--px-sage);
}

.px-cat-title {
    display: block;
    font-size: 17px;
    font-weight: 800;
    margin-bottom: 6px;
}

.px-cat-text {
    font-size: 14px;
    color: var(--px-text-soft);
    margin: 0;
    line-height: 1.45;
}

/* BOUTONS D'ACTION */
.px-btn {
    min-height: 50px;
    padding: 13px 28px;
    border-radius: 999px;
    border: 0;
    font-family: inherit;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all var(--px-transition);
}

.px-btn:hover:not(:disabled) {
    transform: translateY(-2px);
}

.px-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.px-btn--primary {
    background: var(--px-sage);
    color: white;
    box-shadow: 0 10px 24px rgba(127, 168, 138, 0.28);
}

.px-btn--secondary {
    background: var(--px-surface);
    color: var(--px-text);
    border: 1.5px solid var(--px-border);
}

.px-btn--ghost {
    background: transparent;
    color: var(--px-text-soft);
    border: 1.5px solid transparent;
}

.px-btn--ghost:hover:not(:disabled) {
    background: var(--px-surface-soft);
    color: var(--px-text);
}

/* =========================================================
   BOUTONS D'AJOUT (STYLE SABLE CHALEUREUX)
   ========================================================= */
.px-btn--add {
    background: var(--px-sand);
    color: var(--px-text);
    border: 1.5px solid rgba(232, 201, 160, 0.4);
    box-shadow: 0 8px 20px rgba(232, 201, 160, 0.35);
}

.px-btn--add:hover:not(:disabled) {
    background: #e2bd8f;
    /* Teinte sable légèrement plus soutenue au survol */
    box-shadow: 0 12px 24px rgba(232, 201, 160, 0.45);
    transform: translateY(-2px);
}

.px-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 40px;
    padding-top: 28px;
    border-top: 1.5px solid var(--px-border-soft);
}

/* ERREUR BIENVENANTE */
.px-error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: var(--px-error-bg);
    border: 1px solid var(--px-error-border);
    border-radius: var(--px-radius-md);
    color: var(--px-error-text);
    margin-top: 24px;
    font-size: 14px;
    font-weight: 700;
}

.px-error-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(115, 87, 76, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
}

/* CONFIRMATION */
.px-confirm-center {
    text-align: center;
}

.px-confirm-star {
    width: 68px;
    height: 68px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
}

.px-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 32px;
    text-align: left;
}

.px-summary-card {
    padding: 18px;
    background: var(--px-surface-soft);
    border-radius: var(--px-radius-md);
}

.px-summary-card span {
    font-size: 11px;
    color: var(--px-text-muted);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.px-summary-card strong {
    display: block;
    font-size: 16px;
    margin-top: 4px;
}

/* RECAPITULATIFS EN DESSOUS */
.px-recap-section {
    margin-top: 36px;
}

.px-recap-heading {
    font-size: 18px;
    font-weight: 800;
    margin-bottom: 16px;
}

.px-recap-cards-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.px-recap-card {
    padding: 18px 20px;
    background: rgba(255, 255, 255, 0.88);
    border: 1.5px solid var(--px-border);
    border-radius: var(--px-radius-md);
}

.px-recap-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
}

.px-delete-link {
    background: transparent;
    border: 0;
    color: var(--px-text-muted);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.px-delete-link:hover {
    color: var(--px-error-text);
}

.px-recap-pills {
    display: flex;
    gap: 10px;
    margin-top: 12px;
}

.px-pill {
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
}

.px-pill--soft {
    background: var(--px-surface-soft);
}

.px-pill--sage {
    background: var(--px-sage-light);
    color: var(--px-sage-dark);
}

.px-pill--sand {
    background: var(--px-sand-light);
}

.px-recap-sub {
    font-size: 14px;
    color: var(--px-text-soft);
    margin: 6px 0 0;
}

/* RESPONSIVE */
@media (max-width: 900px) {
    .px-fullscreen-body {
        grid-template-columns: 1fr;
    }

    .px-aside {
        position: relative;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--px-border-soft);
        overflow-y: visible;
    }

    .px-nav-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }

    .px-main-wrapper {
        padding: 24px 16px;
    }
}

@media (max-width: 640px) {
    .px-nav-list {
        grid-template-columns: repeat(2, 1fr);
    }

    .px-grid-2,
    .px-grid-3,
    .px-categories-grid,
    .px-summary-grid {
        grid-template-columns: 1fr;
    }

    .px-hero-card {
        padding: 24px 18px;
    }

    .px-hero-title {
        font-size: 26px;
    }

    .px-card-footer {
        flex-direction: column-reverse;
        gap: 12px;
    }

    .px-card-footer .px-btn {
        width: 100%;
    }
}
</style>