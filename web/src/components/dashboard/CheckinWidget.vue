<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    checkin: Object,
    saving: Boolean,
})

const emit = defineEmits(['save'])

const form = ref({
    mood: null,
    energy: null,
    motivation: null,
    reflection: '',
})

watch(
    () => props.checkin,
    val => {
        if (val) {
            form.value = {
                mood: val.mood,
                energy: val.energy,
                motivation: val.motivation,
                reflection: val.reflection || '',
            }
        }
    },
    { immediate: true }
)

function handleSave() {
    emit('save', { ...form.value })
}
</script>

<template>
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
                <span>Humeur</span>
                <span class="px-score-val">{{ form.mood || '—' }}/10</span>
            </div>
            <div class="px-score-buttons-mini">
                <button v-for="s in 10" :key="`mood-${s}`" type="button" class="px-mini-score"
                    :class="{ selected: form.mood === s }" @click="form.mood = s">
                    {{ s }}
                </button>
            </div>

            <div class="px-score-row">
                <span>Énergie</span>
                <span class="px-score-val">{{ form.energy || '—' }}/10</span>
            </div>
            <div class="px-score-buttons-mini">
                <button v-for="s in 10" :key="`energy-${s}`" type="button" class="px-mini-score"
                    :class="{ selected: form.energy === s }" @click="form.energy = s">
                    {{ s }}
                </button>
            </div>

            <textarea v-model="form.reflection" class="px-textarea-sm" rows="2"
                placeholder="Note ou apprentissage du jour..."></textarea>

            <button type="button" class="px-btn-primary-full" :disabled="saving" @click="handleSave">
                {{ saving ? 'Enregistrement...' : checkin ? 'Mettre à jour' : 'Enregistrer mon bilan' }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.px-card {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid #ebf0ea;
    border-radius: 28px;
    padding: 24px;
    box-shadow: 0 16px 40px -6px rgba(43, 53, 46, 0.07);
}

.px-card-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #919c94;
    display: block;
    margin-bottom: 2px;
}

.px-widget-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.px-widget-header h3 {
    font-size: 17px;
    font-weight: 800;
    margin: 0;
    color: #2b352e;
}

.px-done-dot {
    color: #52755d;
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
    color: #2b352e;
}

.px-score-val {
    color: #52755d;
}

.px-score-buttons-mini {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
}

.px-mini-score {
    padding: 6px 0;
    background: #f8faf6;
    border: 1px solid #e0e7df;
    border-radius: 6px;
    font-family: inherit;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
}

.px-mini-score.selected {
    background: #7fa88a;
    color: white;
    border-color: #7fa88a;
}

.px-textarea-sm {
    width: 100%;
    padding: 10px;
    background: #ffffff;
    border: 1px solid #e0e7df;
    border-radius: 14px;
    font-family: inherit;
    font-size: 12px;
    box-sizing: border-box;
    outline: none;
}

.px-btn-primary-full {
    width: 100%;
    padding: 12px;
    background: #7fa88a;
    color: white;
    border: 0;
    border-radius: 999px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(127, 168, 138, 0.25);
}
</style>