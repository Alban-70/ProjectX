import { ref, watch } from "vue";

const DRAFT_KEY = "project_x_create_draft";

const currentStep = ref(1);

const name = ref("");
const description = ref("");
const motto = ref("");

const duration = ref("3");
const customDuration = ref(1);

const selectedCategories = ref([]);

const objectives = ref([]);

const habits = ref([]);

function saveDraft() {
  const draft = {
    currentStep: currentStep.value,
    name: name.value,
    description: description.value,
    motto: motto.value,
    duration: duration.value,
    customDuration: customDuration.value,
    selectedCategories: selectedCategories.value,
    objectives: objectives.value,
    habits: habits.value,
  };

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function loadDraft() {
  const saved = localStorage.getItem(DRAFT_KEY);

  if (!saved) {
    return false;
  }

  try {
    const draft = JSON.parse(saved);

    currentStep.value = draft.currentStep ?? 1;
    name.value = draft.name ?? "";
    description.value = draft.description ?? "";
    motto.value = draft.motto ?? "";
    duration.value = draft.duration ?? "3";
    customDuration.value = draft.customDuration ?? 1;
    selectedCategories.value = draft.selectedCategories ?? [];
    objectives.value = draft.objectives ?? [];
    habits.value = draft.habits ?? [];

    return true;
  } catch (error) {
    console.error("Impossible de restaurer le brouillon Project X:", error);

    localStorage.removeItem(DRAFT_KEY);

    return false;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);

  currentStep.value = 1;

  name.value = "";
  description.value = "";
  motto.value = "";

  duration.value = "3";
  customDuration.value = 1;

  selectedCategories.value = [];
  objectives.value = [];
  habits.value = [];
}

// Sauvegarde automatique
watch(
  [
    currentStep,
    name,
    description,
    motto,
    duration,
    customDuration,
    selectedCategories,
    objectives,
    habits,
  ],
  saveDraft,
  { deep: true },
);

export function useProjectCreationStore() {
  return {
    currentStep,

    name,
    description,
    motto,

    duration,
    customDuration,

    selectedCategories,

    objectives,

    habits,

    saveDraft,
    loadDraft,
    clearDraft,
  };
}
