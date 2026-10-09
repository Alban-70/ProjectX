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

onMounted(() => {
    loadJournalEntries()
})

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
    <section class="px-card px-journal-section">
        <div class="px-section-header">
            <div>
                <h2>Journal Personnel</h2>
                <p class="px-sub-text">Consigne tes pensées, tes victoires et tes réflexions.</p>
            </div>
            <button type="button" class="px-btn-primary" @click="openCreateJournalEntry">+ Nouvelle entrée</button>
        </div>

        <div v-if="journalSuccess" class="px-alert px-alert-success">{{ journalSuccess }}</div>
        <div v-if="journalError" class="px-alert px-alert-error">{{ journalError }}</div>

        <!-- RECHERCHE & FILTRES -->
        <div class="px-journal-filters">
            <input v-model="journalSearch" type="text" placeholder="Rechercher..." @input="loadJournalEntries"
                class="px-input" />
            <input v-model="journalFrom" type="date" @change="loadJournalEntries" class="px-input" />
            <input v-model="journalTo" type="date" @change="loadJournalEntries" class="px-input" />
        </div>

        <!-- LISTE DES ENTRÉES -->
        <div v-if="journalLoading" class="px-loading">Chargement du journal...</div>
        <div v-else-if="!journalEntries.length" class="px-empty">Aucune entrée trouvée dans ton journal.</div>

        <div v-else class="px-journal-list">
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
                            <button type="button" class="px-btn-secondary" @click="resetJournalForm">Annuler</button>
                            <button type="submit" class="px-btn-primary" :disabled="journalSaving">
                                {{ journalSaving ? 'Enregistrement...' : 'Enregistrer' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>
    </section>
</template>

<style scoped>
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
</style>