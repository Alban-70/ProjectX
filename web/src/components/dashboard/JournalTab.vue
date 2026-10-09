<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../api.js'

const props = defineProps({
    projectId: [Number, String],
})

const journalEntries = ref([])
const journalLoading = ref(false)
const journalSaving = ref(false)
const journalError = ref('')
const journalSuccess = ref('')

const journalSearch = ref('')
const journalFrom = ref('')
const journalTo = ref('')

const showJournalForm = ref(false)
const editingJournalEntry = ref(null)

const journalForm = ref({
    title: '',
    content: '',
    mood: '',
})

// État pour la surbrillance
const highlightedElement = ref(null)

onMounted(() => {
    loadJournalEntries()
})

function triggerHighlight(elementIdOrQuery) {
    const el = document.querySelector(elementIdOrQuery)
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightedElement.value = elementIdOrQuery

    setTimeout(() => {
        if (highlightedElement.value === elementIdOrQuery) {
            highlightedElement.value = null
        }
    }, 2500)
}

function resetJournalForm() {
    journalForm.value = { title: '', content: '', mood: '' }
    editingJournalEntry.value = null
    showJournalForm.value = false
}

function openCreateJournalEntry() {
    journalError.value = ''
    journalSuccess.value = ''
    editingJournalEntry.value = null
    journalForm.value = { title: '', content: '', mood: '' }
    showJournalForm.value = true
}

function openEditJournalEntry(entry) {
    journalError.value = ''
    journalSuccess.value = ''
    editingJournalEntry.value = entry
    journalForm.value = {
        title: entry.title || '',
        content: entry.content || '',
        mood: entry.mood == null ? '' : String(entry.mood),
    }
    showJournalForm.value = true
}

async function loadJournalEntries() {
    journalLoading.value = true
    journalError.value = ''
    try {
        const response = await api.getJournalEntries({
            search: journalSearch.value,
            from: journalFrom.value,
            to: journalTo.value,
        })
        journalEntries.value = Array.isArray(response)
            ? response
            : response?.entries || response?.journalEntries || []
    } catch (err) {
        journalError.value = err.message || 'Impossible de charger le journal.'
    } finally {
        journalLoading.value = false
    }
}

async function handleSaveJournalEntry() {
    if (journalSaving.value) return
    const title = journalForm.value.title.trim()
    const content = journalForm.value.content.trim()

    if (!title || !content) {
        journalError.value = 'Le titre et le texte sont obligatoires.'
        return
    }

    const mood = journalForm.value.mood === '' ? null : Number(journalForm.value.mood)
    journalSaving.value = true
    journalError.value = ''
    journalSuccess.value = ''

    try {
        const payload = { title, content, mood }
        if (editingJournalEntry.value) {
            await api.updateJournalEntry(editingJournalEntry.value.id, payload)
            journalSuccess.value = 'Entrée modifiée.'
        } else {
            await api.createJournalEntry({ ...payload, project_id: props.projectId })
            journalSuccess.value = 'Entrée ajoutée au journal.'
        }
        resetJournalForm()
        await loadJournalEntries()
    } catch (err) {
        journalError.value = err.message || 'Impossible d’enregistrer cette entrée.'
    } finally {
        journalSaving.value = false
    }
}

async function handleDeleteJournalEntry(entry) {
    if (!window.confirm(`Supprimer l’entrée « ${entry.title} » ?`)) return
    try {
        await api.deleteJournalEntry(entry.id)
        journalEntries.value = journalEntries.value.filter(item => item.id !== entry.id)
        journalSuccess.value = 'Entrée supprimée.'
    } catch (err) {
        journalError.value = err.message || 'Impossible de supprimer cette entrée.'
    }
}

function formatJournalDate(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function getJournalMoodLabel(mood) {
    const moods = { 1: '😞 Difficile', 2: '😕 Bof', 3: '😐 Neutre', 4: '🙂 Bien', 5: '😄 Excellent' }
    return moods[mood] || 'Humeur non renseignée'
}
</script>

<template>
    <div class="px-journal-wrapper">
        <!-- BANDEAU GUIDE PÉDAGOGIQUE (STYLE WARM ZEN) -->
        <div class="px-guide-card">
            <div class="px-guide-icon">📖</div>
            <div class="px-guide-body">
                <h3>Journal Personnel</h3>
                <p>Prends du recul sur ton parcours, consigne tes réflexions quotidiennes et garde une trace de ton
                    évolution.</p>
                <div class="px-guide-steps">
                    <span>
                        <strong>Rédiger une entrée :</strong>
                        Clique sur
                        <button type="button" class="px-guide-link" @click="triggerHighlight('#btn-create-journal')">
                            « + Nouvelle entrée »
                        </button>
                        pour écrire une note et associer ton humeur.
                    </span>
                    <span>
                        <strong>Rechercher & Filtrer :</strong>
                        Utilise la
                        <button type="button" class="px-guide-link"
                            @click="triggerHighlight('#journal-search-filters')">
                            barre de recherche et les dates
                        </button>
                        pour retrouver d'anciens écrits.
                    </span>
                    <span>
                        <strong>Modifier ou archiver :</strong>
                        Utilise les icônes
                        <button type="button" class="px-guide-link" @click="triggerHighlight('.px-journal-list')">
                            « ✎ Modifier »
                        </button>
                        ou
                        <button type="button" class="px-guide-link" @click="triggerHighlight('.px-journal-list')">
                            « × Supprimer »
                        </button>
                        sur tes cartes.
                    </span>
                </div>
            </div>
        </div>

        <section class="px-card px-journal-section">
            <div class="px-section-header">
                <div>
                    <h2>Mes Entrées</h2>
                    <p class="px-sub-text">Consigne tes pensées, tes victoires et tes réflexions.</p>
                </div>
                <button id="btn-create-journal" type="button" class="px-btn-primary"
                    :class="{ 'px-highlight-flash': highlightedElement === '#btn-create-journal' }"
                    @click="openCreateJournalEntry">
                    + Nouvelle entrée
                </button>
            </div>

            <div v-if="journalSuccess" class="px-alert px-alert-success">{{ journalSuccess }}</div>
            <div v-if="journalError" class="px-alert px-alert-error">{{ journalError }}</div>

            <!-- RECHERCHE & FILTRES -->
            <div id="journal-search-filters" class="px-journal-filters"
                :class="{ 'px-highlight-flash': highlightedElement === '#journal-search-filters' }">
                <input v-model="journalSearch" type="text" placeholder="Rechercher par mot-clé..."
                    @input="loadJournalEntries" class="px-input" />
                <input v-model="journalFrom" type="date" @change="loadJournalEntries" class="px-input" />
                <input v-model="journalTo" type="date" @change="loadJournalEntries" class="px-input" />
            </div>

            <!-- LISTE DES ENTRÉES -->
            <div v-if="journalLoading" class="px-loading">Chargement du journal...</div>
            <div v-else-if="!journalEntries.length" class="px-empty">Aucune entrée trouvée dans ton journal.</div>

            <div v-else class="px-journal-list"
                :class="{ 'px-highlight-flash': highlightedElement === '.px-journal-list' }">
                <article v-for="entry in journalEntries" :key="entry.id" class="px-journal-item">
                    <div class="px-journal-item-header">
                        <div>
                            <h3>{{ entry.title }}</h3>
                            <span class="px-journal-date">{{ formatJournalDate(entry.created_at || entry.date) }}</span>
                        </div>
                        <div class="px-journal-item-actions">
                            <span v-if="entry.mood" class="px-mood-badge">{{ getJournalMoodLabel(entry.mood) }}</span>
                            <button type="button" class="px-btn-icon" @click="openEditJournalEntry(entry)">✎</button>
                            <button type="button" class="px-btn-icon px-btn-danger"
                                @click="handleDeleteJournalEntry(entry)">×</button>
                        </div>
                    </div>
                    <p class="px-journal-content">{{ entry.content }}</p>
                </article>
            </div>

            <!-- MODALE FORMULAIRE JOURNAL -->
            <Teleport to="body">
                <div v-if="showJournalForm" class="px-modal-overlay" @click.self="resetJournalForm">
                    <div class="px-modal-card">
                        <h3>{{ editingJournalEntry ? 'Modifier l’entrée' : 'Nouvelle entrée au journal' }}</h3>
                        <form @submit.prevent="handleSaveJournalEntry" class="px-form-grid">
                            <input v-model="journalForm.title" type="text" placeholder="Titre..." required
                                class="px-input px-full" />
                            <select v-model="journalForm.mood" class="px-input px-full">
                                <option value="">Sélectionner une humeur (optionnel)</option>
                                <option value="1">😞 Difficile</option>
                                <option value="2">😕 Bof</option>
                                <option value="3">😐 Neutre</option>
                                <option value="4">🙂 Bien</option>
                                <option value="5">😄 Excellent</option>
                            </select>
                            <textarea v-model="journalForm.content" rows="5" placeholder="Aujourd'hui, j'ai remarqué..."
                                required class="px-input px-full"></textarea>

                            <div class="px-modal-actions px-full">
                                <button type="button" class="px-btn-secondary"
                                    @click="resetJournalForm">Annuler</button>
                                <button type="submit" class="px-btn-primary" :disabled="journalSaving">
                                    {{ journalSaving ? 'Enregistrement...' : 'Enregistrer' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Teleport>
        </section>
    </div>
</template>

<style scoped>
.px-journal-wrapper {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* BANDEAU DE GUIDE PÉDAGOGIQUE (WARM ZEN) */
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
    font-weight: 800;
    color: #382c23;
}

.px-guide-body p {
    margin: 0 0 12px;
    font-size: 14.5px;
    color: #5d4c3f;
    line-height: 1.5;
}

.px-guide-steps {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13.5px;
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

/* LIENS CLIQUABLES DANS LES GUIDES */
.px-guide-link {
    background: #f0e6d6;
    color: #5a4638;
    border: 1px solid #dccaba;
    padding: 1px 7px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 12.5px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    transition: all 0.2s ease;
    text-decoration: none;
}

.px-guide-link:hover {
    background: #5a4638;
    color: #ffffff;
    border-color: #5a4638;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(90, 70, 56, 0.2);
}

.px-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 28px;
    border: 1px solid #e8eee7;
    box-shadow: 0 10px 28px -6px rgba(36, 46, 39, 0.06);
}

.px-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.px-sub-text {
    font-size: 13px;
    color: #8d9b90;
    margin-top: 2px;
}

.px-journal-filters {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
    border-radius: 14px;
    transition: all 0.3s ease;
}

.px-input {
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid #d4ded3;
    background: #f4f8f3;
    font-family: inherit;
    font-size: 13px;
    outline: none;
}

.px-journal-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-radius: 18px;
    transition: all 0.3s ease;
}

.px-journal-item {
    padding: 20px;
    background: #f8faf6;
    border: 1px solid #e0e7df;
    border-radius: 16px;
}

.px-journal-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.px-journal-item-header h3 {
    margin: 0;
    font-size: 16px;
    color: #2d4734;
    font-weight: 800;
}

.px-journal-date {
    font-size: 11px;
    color: #8d9b90;
    font-weight: 700;
}

.px-journal-item-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.px-mood-badge {
    font-size: 12px;
    padding: 4px 10px;
    background: #e8eee7;
    border-radius: 999px;
    font-weight: 700;
    color: #2d4734;
}

.px-journal-content {
    font-size: 14px;
    color: #475569;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
}

.px-btn-primary {
    background: #4d7358;
    color: white;
    border: 0;
    padding: 10px 18px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.px-btn-secondary {
    background: #e8eee7;
    color: #2d4734;
    border: 0;
    padding: 10px 18px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
}

.px-btn-icon {
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: 16px;
    color: #8d9b90;
}

.px-btn-danger {
    color: #a35252;
}

.px-alert {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    margin-bottom: 16px;
}

.px-alert-success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
}

.px-alert-error {
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fca5a5;
}

.px-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(36, 46, 39, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.px-modal-card {
    width: 100%;
    max-width: 500px;
    background: #fff;
    border-radius: 24px;
    padding: 28px;
}

.px-form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    margin-top: 16px;
}

.px-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
}

/* CLASS ANIMÉE APPLIQUÉE À L'ÉLÉMENT CIBLE */
.px-highlight-flash {
    animation: highlight-pulse 2s ease-in-out infinite !important;
    position: relative;
    z-index: 10;
}

/* ANIMATION DE SURBRILLANCE / GLOW SOFT ZEN */
@keyframes highlight-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(77, 115, 88, 0.7);
        outline: 3px solid #4d7358;
        outline-offset: 3px;
    }

    50% {
        box-shadow: 0 0 22px 10px rgba(77, 115, 88, 0.45);
        outline: 3px solid #2d4734;
        outline-offset: 6px;
        transform: scale(1.01);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(77, 115, 88, 0);
        outline: 3px solid transparent;
        outline-offset: 0px;
    }
}
</style>