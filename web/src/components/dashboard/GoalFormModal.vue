<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
    show: Boolean,
    editingGoal: Object,
    categories: Array,
    saving: Boolean,
    error: String,
})

const emit = defineEmits(['close', 'save'])

function createEmptyForm() {
    return {
        title: '',
        description: '',
        category_id: '',
        goal_type: 'numeric',
        unit: '',
        minimum_value: '',
        target_value: '',
        bonus_value: '',
        deadline: '',
    }
}

const form = ref(createEmptyForm())
const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

watch(
    () => props.editingGoal,
    goal => {
        if (!goal) {
            form.value = createEmptyForm()
            return
        }

        form.value = {
            title: goal.title || '',
            description: goal.description || '',
            category_id: goal.category_id || '',
            goal_type: goal.goal_type || 'numeric',
            unit: goal.unit || '',
            minimum_value: goal.minimum_value ?? '',
            target_value: goal.target_value ?? '',
            bonus_value: goal.bonus_value ?? '',
            deadline: goal.deadline || '',
        }
    },
    { immediate: true }
)

function selectCategory(categoryId) {
    form.value.category_id = categoryId
    isDropdownOpen.value = false
}

function getSelectedCategoryName() {
    const selected = props.categories?.find(c => c.id === form.value.category_id)
    return selected ? selected.name : 'Choisir une catégorie'
}

// Fermer le menu si on clique à l'extérieur
function handleClickOutside(event) {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        isDropdownOpen.value = false
    }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

function handleSubmit() {
    if (!form.value.category_id) return
    emit('save', { ...form.value })
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div v-if="show" class="px-modal-overlay" @click.self="emit('close')">
                <div class="px-dashboard-goal-form">
                    <div class="px-dashboard-goal-form-header">
                        <div>
                            <p class="px-card-label">
                                {{ editingGoal ? 'Modifier l’objectif' : 'Nouvel objectif' }}
                            </p>
                            <h3>
                                {{ editingGoal ? 'Fais évoluer ton objectif' : 'Qu’est-ce que tu veux accomplir ?' }}
                            </h3>
                        </div>
                        <button type="button" class="px-dashboard-goal-form-close" @click="emit('close')">
                            ×
                        </button>
                    </div>

                    <div v-if="error" class="px-dashboard-form-error">{{ error }}</div>

                    <form @submit.prevent="handleSubmit">
                        <div class="px-dashboard-form-grid">
                            <!-- TITRE -->
                            <div class="px-dashboard-form-field px-full">
                                <label>Objectif</label>
                                <input v-model="form.title" type="text" placeholder="Ex. Courir un semi-marathon"
                                    required />
                            </div>

                            <!-- CATÉGORIE EN SÉLECTEUR PERSONNALISÉ -->
                            <div class="px-dashboard-form-field" ref="dropdownRef">
                                <label>Catégorie</label>
                                <div class="px-custom-select" :class="{ 'is-open': isDropdownOpen }"
                                    @click="isDropdownOpen = !isDropdownOpen">
                                    <span class="px-select-label" :class="{ 'is-placeholder': !form.category_id }">
                                        {{ getSelectedCategoryName() }}
                                    </span>
                                    <span class="px-select-arrow">▾</span>
                                </div>

                                <!-- DROPDOWN MENU -->
                                <Transition name="dropdown">
                                    <ul v-if="isDropdownOpen" class="px-dropdown-menu">
                                        <li v-for="c in categories" :key="c.id" class="px-dropdown-item"
                                            :class="{ 'is-selected': form.category_id === c.id }"
                                            @click.stop="selectCategory(c.id)">
                                            <span class="px-category-dot"></span>
                                            <span>{{ c.name }}</span>
                                            <span v-if="form.category_id === c.id" class="px-check-mark">✓</span>
                                        </li>
                                    </ul>
                                </Transition>
                            </div>

                            <!-- UNITÉ -->
                            <div class="px-dashboard-form-field">
                                <label>Unité</label>
                                <input v-model="form.unit" type="text" placeholder="km, livres, projets..." />
                            </div>

                            <!-- DESCRIPTION -->
                            <div class="px-dashboard-form-field px-full">
                                <label>Description</label>
                                <textarea v-model="form.description" rows="2"
                                    placeholder="Pourquoi cet objectif compte pour toi ?"></textarea>
                            </div>

                            <!-- VALEURS MIN / TARGET / BONUS -->
                            <div class="px-dashboard-form-field">
                                <label>Minimum</label>
                                <input v-model="form.minimum_value" type="number" step="any" placeholder="Ex. 10" />
                            </div>

                            <div class="px-dashboard-form-field">
                                <label>Target</label>
                                <input v-model="form.target_value" type="number" step="any" placeholder="Ex. 20" />
                            </div>

                            <div class="px-dashboard-form-field">
                                <label>Bonus</label>
                                <input v-model="form.bonus_value" type="number" step="any" placeholder="Ex. 30" />
                            </div>

                            <div class="px-dashboard-form-field">
                                <label>Échéance</label>
                                <input v-model="form.deadline" type="date" />
                            </div>
                        </div>

                        <!-- ACTIONS -->
                        <div class="px-dashboard-goal-form-actions">
                            <button type="button" class="px-dashboard-button-secondary" :disabled="saving"
                                @click="emit('close')">
                                Annuler
                            </button>
                            <button type="submit" class="px-dashboard-button" :disabled="saving || !form.category_id">
                                {{ saving ? 'Enregistrement...' : editingGoal ? 'Enregistrer les modifications' : 'Créer l’objectif' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* OVERLAY ET MODALE */
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

.px-dashboard-goal-form {
    position: relative;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 28px;
    border-radius: 24px;
    background: #ffffff;
    border: 1px solid #d4ded3;
    box-shadow: 0 20px 40px -10px rgba(36, 46, 39, 0.18);
}

.px-dashboard-goal-form-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.px-dashboard-goal-form-header h3 {
    margin: 4px 0 0;
    font-size: 20px;
    color: #2d4734;
}

.px-dashboard-goal-form-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 0;
    background: #f4f8f3;
    font-size: 18px;
    color: #8d9b90;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
}

.px-dashboard-goal-form-close:hover {
    background: #e8eee7;
    color: #2d4734;
}

.px-card-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d9b90;
}

.px-dashboard-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.px-dashboard-form-field {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.px-dashboard-form-field.px-full {
    grid-column: 1 / -1;
}

.px-dashboard-form-field label {
    font-size: 12px;
    font-weight: 700;
    color: #2d4734;
}

/* CHAMPS DE SAISIE */
.px-dashboard-form-field input,
.px-dashboard-form-field textarea {
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid #d4ded3;
    background: #f4f8f3;
    font-family: inherit;
    font-size: 13px;
    color: #242e27;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s ease, background-color 0.2s ease;
}

.px-dashboard-form-field input:focus,
.px-dashboard-form-field textarea:focus {
    border-color: #4d7358;
    background: #ffffff;
}

/* =========================================================
   LISTE DÉROULANTE STYLISÉE (CUSTOM SELECT)
   ========================================================= */
.px-custom-select {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid #d4ded3;
    background: #f4f8f3;
    font-size: 13px;
    color: #242e27;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
}

.px-custom-select:hover,
.px-custom-select.is-open {
    border-color: #4d7358;
    background: #ffffff;
}

.px-select-label.is-placeholder {
    color: #8d9b90;
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

/* MENU DÉROULANT FLOTTANT */
.px-dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 20;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: #ffffff;
    border: 1px solid #d4ded3;
    border-radius: 14px;
    box-shadow: 0 10px 25px -5px rgba(36, 46, 39, 0.15);
    max-height: 180px;
    overflow-y: auto;
}

.px-dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #242e27;
    cursor: pointer;
    transition: background 0.15s ease;
}

.px-dropdown-item:hover {
    background: #f4f8f3;
    color: #2d4734;
}

.px-dropdown-item.is-selected {
    background: #e8eee7;
    color: #2d4734;
    font-weight: 800;
}

.px-category-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4d7358;
}

.px-check-mark {
    margin-left: auto;
    font-size: 12px;
    color: #4d7358;
}

/* ANIMATION DÉROULANTE */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

/* ERREUR & ACTIONS */
.px-dashboard-form-error {
    padding: 10px 14px;
    background: #f7efe3;
    color: #a35252;
    border: 1px solid #e5be8a;
    border-radius: 12px;
    font-size: 13px;
    margin-bottom: 16px;
}

.px-dashboard-goal-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

.px-dashboard-button {
    background: #4d7358;
    color: white;
    border: 0;
    padding: 10px 18px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(77, 115, 88, 0.2);
    transition: background 0.2s ease;
}

.px-dashboard-button:hover:not(:disabled) {
    background: #2d4734;
}

.px-dashboard-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.px-dashboard-button-secondary {
    background: #e8eee7;
    color: #2d4734;
    border: 0;
    padding: 10px 18px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
}

/* ANIMATIONS MODALE */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>