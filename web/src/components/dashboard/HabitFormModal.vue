<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    show: Boolean,
    editingHabit: Object,
    categories: Array,
    saving: Boolean,
    error: String,
    todayString: String,
})

const emit = defineEmits(['close', 'save'])

const form = ref({
    name: '',
    category_id: '',
    frequency: 'daily',
    times_per_period: 1,
    start_date: '',
    end_date: '',
})

watch(
    () => props.editingHabit,
    habit => {
        if (habit) {
            form.value = {
                name: habit.name ?? '',
                category_id: habit.category_id ?? '',
                frequency: habit.frequency ?? 'daily',
                times_per_period: habit.times_per_period ?? 1,
                start_date: habit.start_date?.slice(0, 10) ?? '',
                end_date: habit.end_date?.slice(0, 10) ?? '',
            }
        } else {
            form.value = {
                name: '',
                category_id: '',
                frequency: 'daily',
                times_per_period: 1,
                start_date: props.todayString || '',
                end_date: '',
            }
        }
    },
    { immediate: true }
)

function handleSubmit() {
    emit('save', { ...form.value })
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div v-if="show" class="px-modal-overlay" @click.self="emit('close')">
                <div class="px-dashboard-form-card">
                    <div class="px-form-header">
                        <div>
                            <p class="px-card-label">Routines & Habitudes</p>
                            <h3>{{ editingHabit ? 'Modifier l’habitude' : 'Nouvelle habitude' }}</h3>
                        </div>
                        <button type="button" class="px-close-btn" @click="emit('close')">×</button>
                    </div>

                    <div v-if="error" class="px-form-error">{{ error }}</div>

                    <form @submit.prevent="handleSubmit" class="px-form-grid">
                        <div class="px-form-field px-full">
                            <label>Nom de l'habitude</label>
                            <input v-model="form.name" type="text" placeholder="Ex. Méditer 10 minutes" required />
                        </div>

                        <div class="px-form-field">
                            <label>Catégorie</label>
                            <select v-model="form.category_id">
                                <option value="">Sans catégorie</option>
                                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>

                        <div class="px-form-field">
                            <label>Fréquence</label>
                            <select v-model="form.frequency">
                                <option value="daily">Quotidienne</option>
                                <option value="weekly">Hebdomadaire</option>
                                <option value="monthly">Mensuelle</option>
                            </select>
                        </div>

                        <div class="px-form-field">
                            <label>Répétitions par période</label>
                            <input v-model.number="form.times_per_period" type="number" min="1" required />
                        </div>

                        <div class="px-form-field">
                            <label>Date de début</label>
                            <input v-model="form.start_date" type="date" />
                        </div>

                        <div class="px-form-field px-full">
                            <label>Date de fin (optionnel)</label>
                            <input v-model="form.end_date" type="date" />
                        </div>

                        <div class="px-form-actions px-full">
                            <button type="button" class="px-btn-secondary" :disabled="saving" @click="emit('close')">
                                Annuler
                            </button>
                            <button type="submit" class="px-btn-primary" :disabled="saving">
                                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
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

.px-dashboard-form-card {
    width: 100%;
    max-width: 500px;
    padding: 28px;
    border-radius: 24px;
    background: #ffffff;
    border: 1px solid #d4ded3;
    box-shadow: 0 20px 40px -10px rgba(36, 46, 39, 0.18);
}

.px-form-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.px-card-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d9b90;
}

.px-form-header h3 {
    margin: 4px 0 0;
    font-size: 20px;
    color: #2d4734;
}

.px-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 0;
    background: #f4f8f3;
    font-size: 18px;
    color: #8d9b90;
    cursor: pointer;
}

.px-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.px-form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.px-form-field.px-full {
    grid-column: 1 / -1;
}

.px-form-field label {
    font-size: 12px;
    font-weight: 700;
    color: #2d4734;
}

.px-form-field input,
.px-form-field select {
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid #d4ded3;
    background: #f4f8f3;
    font-family: inherit;
    font-size: 13px;
    outline: none;
}

.px-form-error {
    padding: 10px 14px;
    background: #f7efe3;
    color: #a35252;
    border: 1px solid #e5be8a;
    border-radius: 12px;
    font-size: 13px;
    margin-bottom: 16px;
}

.px-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
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

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>