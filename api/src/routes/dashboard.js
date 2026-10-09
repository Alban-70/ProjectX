import express from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

// ============================================================
// DASHBOARD
// ============================================================

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (projectError) {
      console.error("Erreur récupération projet actif:", projectError);

      return res.status(500).json({
        error: "Impossible de récupérer le projet actif.",
      });
    }

    if (!project) {
      return res.json({
        project,
        categories: projectCategories || [],
        goals: goals || [],
        habits: habits || [],
        milestones: milestones || [],
        goalLogs: goalLogs || [],
        habitLogs: habitLogs || [],
        checkins: checkins || [],
        journalEntries: journalEntries || [],
      });
    }

    const projectId = project.id;

    const { data: projectCategories, error: projectCategoriesError } =
      await supabase
        .from("project_categories")
        .select("category_id")
        .eq("project_id", projectId);

    if (projectCategoriesError) {
      return res.status(500).json({
        error: "Impossible de récupérer les catégories du projet.",
      });
    }

    const categoryIds =
      projectCategories?.map((item) => item.category_id) || [];

    let categories = [];

    if (categoryIds.length > 0) {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .in("id", categoryIds);

      if (error) {
        return res.status(500).json({
          error: "Impossible de récupérer les catégories.",
        });
      }

      categories = data || [];
    }

    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: true,
      });

    if (goalsError) {
      return res.status(500).json({
        error: "Impossible de récupérer les objectifs.",
      });
    }

    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: true,
      });

    if (habitsError) {
      return res.status(500).json({
        error: "Impossible de récupérer les habitudes.",
      });
    }

    const goalIds = goals?.map((goal) => goal.id) || [];

    let goalLogs = [];

    if (goalIds.length > 0) {
      const { data, error } = await supabase
        .from("goal_logs")
        .select("*")
        .in("goal_id", goalIds)
        .order("logged_at", {
          ascending: false,
        });

      if (error) {
        return res.status(500).json({
          error: "Impossible de récupérer les logs des objectifs.",
        });
      }

      goalLogs = data || [];
    }

    const habitIds = habits?.map((habit) => habit.id) || [];

    let habitLogs = [];

    if (habitIds.length > 0) {
      const { data, error } = await supabase
        .from("habit_logs")
        .select("*")
        .in("habit_id", habitIds);

      if (error) {
        return res.status(500).json({
          error: "Impossible de récupérer les logs des habitudes.",
        });
      }

      habitLogs = data || [];
    }

    const { data: milestones, error: milestonesError } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: true,
      });

    if (milestonesError) {
      return res.status(500).json({
        error: "Impossible de récupérer les milestones.",
      });
    }

    const { data: checkins, error: checkinsError } = await supabase
      .from("project_checkins")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: false,
      })
      .limit(30);

    if (checkinsError) {
      return res.status(500).json({
        error: "Impossible de récupérer les check-ins.",
      });
    }

    const { data: journalEntries, error: journalError } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: false,
      })
      .limit(20);

    if (journalError) {
      return res.status(500).json({
        error: "Impossible de récupérer le journal.",
      });
    }

    return res.json({
      project,
      categories,
      goals: goals || [],
      habits: habits || [],
      milestones: milestones || [],
      goalLogs,
      habitLogs,
      checkins: checkins || [],
      journalEntries: journalEntries || [],
    });
  } catch (error) {
    console.error("Erreur dashboard:", error);

    return res.status(500).json({
      error: "Erreur interne du serveur.",
    });
  }
});

// ============================================================
// AJOUTER UN LOG D'OBJECTIF
// ============================================================

router.post("/goals/:goalId/log", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;
    const { value, note } = req.body;

    if (
      value === undefined ||
      value === null ||
      Number.isNaN(Number(value)) ||
      Number(value) < 0
    ) {
      return res.status(400).json({
        error: "La valeur de progression est invalide.",
      });
    }

    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select(
        `
                    id,
                    project_id,
                    title,
                    projects!inner(
                        user_id
                    )
                `,
      )
      .eq("id", goalId)
      .eq("projects.user_id", userId)
      .maybeSingle();

    if (goalError) {
      console.error("Erreur vérification objectif:", goalError);

      return res.status(500).json({
        error: "Impossible de vérifier cet objectif.",
      });
    }

    if (!goal) {
      return res.status(404).json({
        error: "Objectif introuvable.",
      });
    }

    const { data: log, error: logError } = await supabase
      .from("goal_logs")
      .insert({
        goal_id: goalId,
        value: Number(value),
        note: note || null,
      })
      .select()
      .single();

    if (logError) {
      console.error("Erreur création log objectif:", logError);

      return res.status(500).json({
        error: "Impossible d’enregistrer la progression.",
      });
    }

    return res.status(201).json({
      log,
    });
  } catch (error) {
    console.error("Erreur log objectif:", error);

    return res.status(500).json({
      error: "Erreur interne du serveur.",
    });
  }
});

// ============================================================
// VALIDER UNE HABITUDE POUR AUJOURD'HUI
// ============================================================

router.post("/habits/:habitId/log", requireAuth, async (req, res) => {
  try {
    const { habitId } = req.params;
    const userId = req.user.id;
    const value = req.body?.value === undefined ? 1 : Number(req.body.value);
    const note =
      typeof req.body?.note === "string" ? req.body.note.trim() : null;

    const date = req.body?.date || new Date().toISOString().slice(0, 10);

    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({
        error: "La valeur de l’habitude est invalide.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: "La date de validation est invalide.",
      });
    }

    const { data: habit, error: habitError } = await getOwnedHabit(
      habitId,
      userId,
    );

    if (habitError) {
      console.error("Erreur vérification habitude:", habitError);
      return res.status(500).json({
        error: "Impossible de vérifier cette habitude.",
      });
    }

    if (!habit) {
      return res.status(404).json({
        error: "Habitude introuvable.",
      });
    }

    if (habit.start_date && date < habit.start_date) {
      return res.status(400).json({
        error: "Cette habitude n’a pas encore commencé.",
      });
    }

    if (habit.end_date && date > habit.end_date) {
      return res.status(400).json({
        error: "La période de cette habitude est terminée.",
      });
    }

    const { data: existingLog, error: existingError } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("habit_id", habitId)
      .eq("date", date)
      .maybeSingle();

    if (existingError) {
      console.error("Erreur lecture historique:", existingError);
      return res.status(500).json({
        error: "Impossible de vérifier la validation actuelle.",
      });
    }

    let log;
    let error;

    if (existingLog) {
      const result = await supabase
        .from("habit_logs")
        .update({ value, note })
        .eq("id", existingLog.id)
        .select()
        .single();

      log = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("habit_logs")
        .insert({
          habit_id: habitId,
          date,
          value,
          note,
        })
        .select()
        .single();

      log = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Erreur enregistrement habitude:", error);
      return res.status(500).json({
        error: "Impossible d’enregistrer cette réalisation.",
      });
    }

    return res.json({ log });
  } catch (error) {
    console.error("Erreur validation habitude:", error);
    return res.status(500).json({
      error: "Erreur interne du serveur.",
    });
  }
});

router.patch("/milestones/:milestoneId/complete", async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select(
        `
                    id,
                    project_id,
                    title,
                    description,
                    target_date,
                    completed_at,
                    projects!inner (
                        id,
                        user_id
                    )
                `,
      )
      .eq("id", milestoneId)
      .eq("projects.user_id", req.user.id)
      .single();

    if (milestoneError || !milestone) {
      return res.status(404).json({
        error: "Milestone introuvable.",
      });
    }

    const { data, error } = await supabase
      .from("milestones")
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq("id", milestoneId)
      .select()
      .single();

    if (error) {
      console.error("Erreur validation milestone:", error);

      return res.status(500).json({
        error: "Impossible de valider le milestone.",
      });
    }

    return res.json({
      milestone: data,
    });
  } catch (error) {
    console.error("Erreur serveur validation milestone:", error);

    return res.status(500).json({
      error: "Erreur interne du serveur.",
    });
  }
});

router.patch("/milestones/:milestoneId/reopen", async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select(
        `
                    id,
                    project_id,
                    title,
                    description,
                    target_date,
                    completed_at,
                    projects!inner (
                        id,
                        user_id
                    )
                `,
      )
      .eq("id", milestoneId)
      .eq("projects.user_id", req.user.id)
      .single();

    if (milestoneError || !milestone) {
      return res.status(404).json({
        error: "Milestone introuvable.",
      });
    }

    const { data, error } = await supabase
      .from("milestones")
      .update({
        completed_at: null,
      })
      .eq("id", milestoneId)
      .select()
      .single();

    if (error) {
      console.error("Erreur réouverture milestone:", error);

      return res.status(500).json({
        error: "Impossible de rouvrir le milestone.",
      });
    }

    return res.json({
      milestone: data,
    });
  } catch (error) {
    console.error("Erreur serveur réouverture milestone:", error);

    return res.status(500).json({
      error: "Erreur interne du serveur.",
    });
  }
});

router.post("/checkin", async (req, res) => {
  try {
    const { date, mood, energy, motivation, reflection } = req.body;

    if (!date) {
      return res.status(400).json({
        error: "La date du check-in est requise.",
      });
    }

    const validateScore = (value, label) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      const number = Number(value);

      if (!Number.isInteger(number) || number < 1 || number > 10) {
        throw new Error(`${label} doit être compris entre 1 et 10.`);
      }

      return number;
    };

    let validatedMood;
    let validatedEnergy;
    let validatedMotivation;

    try {
      validatedMood = validateScore(mood, "L’humeur");

      validatedEnergy = validateScore(energy, "L’énergie");

      validatedMotivation = validateScore(motivation, "La motivation");
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    // Récupérer le projet actif de l'utilisateur
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("status", "active")
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        error: "Aucun Project X actif trouvé.",
      });
    }

    const { data: existingCheckin } = await supabase
      .from("project_checkins")
      .select("id")
      .eq("project_id", project.id)
      .eq("date", date)
      .maybeSingle();

    const checkinData = {
      project_id: project.id,
      date,
      mood: validatedMood,
      energy: validatedEnergy,
      motivation: validatedMotivation,
      reflection: reflection?.trim() || null,
    };

    let data;
    let error;

    if (existingCheckin) {
      const result = await supabase
        .from("project_checkins")
        .update({
          mood: checkinData.mood,
          energy: checkinData.energy,
          motivation: checkinData.motivation,
          reflection: checkinData.reflection,
        })
        .eq("id", existingCheckin.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("project_checkins")
        .insert(checkinData)
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Erreur sauvegarde check-in:", error);

      return res.status(500).json({
        error: "Impossible d’enregistrer le check-in.",
      });
    }

    return res.json({
      checkin: data,
    });
  } catch (error) {
    console.error("Erreur serveur check-in:", error);

    return res.status(500).json({
      error: "Erreur interne du serveur.",
    });
  }
});

router.post("/goals", requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      goal_type,
      unit,
      minimum_value,
      target_value,
      bonus_value,
      deadline,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        error: "Le titre de l’objectif est requis.",
      });
    }

    if (!category_id) {
      return res.status(400).json({
        error: "La catégorie est requise.",
      });
    }

    if (
      minimum_value !== null &&
      minimum_value !== undefined &&
      Number(minimum_value) < 0
    ) {
      return res.status(400).json({
        error: "La valeur Minimum ne peut pas être négative.",
      });
    }

    if (
      target_value !== null &&
      target_value !== undefined &&
      Number(target_value) < 0
    ) {
      return res.status(400).json({
        error: "La valeur Target ne peut pas être négative.",
      });
    }

    if (
      bonus_value !== null &&
      bonus_value !== undefined &&
      Number(bonus_value) < 0
    ) {
      return res.status(400).json({
        error: "La valeur Bonus ne peut pas être négative.",
      });
    }

    if (
      minimum_value !== null &&
      target_value !== null &&
      minimum_value !== undefined &&
      target_value !== undefined &&
      Number(target_value) < Number(minimum_value)
    ) {
      return res.status(400).json({
        error: "Target doit être supérieur ou égal à Minimum.",
      });
    }

    if (
      target_value !== null &&
      bonus_value !== null &&
      target_value !== undefined &&
      bonus_value !== undefined &&
      Number(bonus_value) < Number(target_value)
    ) {
      return res.status(400).json({
        error: "Bonus doit être supérieur ou égal à Target.",
      });
    }

    // On récupère le projet actif de l'utilisateur
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (projectError) {
      console.error("Erreur récupération projet:", projectError);

      return res.status(500).json({
        error: "Impossible de récupérer le projet.",
      });
    }

    if (!project) {
      return res.status(404).json({
        error: "Aucun projet actif trouvé.",
      });
    }

    // Vérifie que la catégorie existe
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", category_id)
      .maybeSingle();

    if (categoryError) {
      console.error("Erreur vérification catégorie:", categoryError);

      return res.status(500).json({
        error: "Impossible de vérifier la catégorie.",
      });
    }

    if (!category) {
      return res.status(400).json({
        error: "Catégorie invalide.",
      });
    }

    const { data: goal, error } = await supabase
      .from("goals")
      .insert({
        project_id: project.id,
        category_id,
        title: title.trim(),
        description: description?.trim() || null,
        goal_type: goal_type || "numeric",
        unit: unit?.trim() || null,
        minimum_value:
          minimum_value === "" || minimum_value === undefined
            ? null
            : minimum_value,
        target_value:
          target_value === "" || target_value === undefined
            ? null
            : target_value,
        bonus_value:
          bonus_value === "" || bonus_value === undefined ? null : bonus_value,
        deadline: deadline || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création objectif:", error);

      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      goal,
    });
  } catch (error) {
    console.error("Erreur serveur création objectif:", error);

    return res.status(500).json({
      error: "Impossible de créer l’objectif.",
    });
  }
});

router.patch("/goals/:goalId", requireAuth, async (req, res) => {
  try {
    const { goalId } = req.params;

    const {
      title,
      description,
      category_id,
      goal_type,
      unit,
      minimum_value,
      target_value,
      bonus_value,
      deadline,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        error: "Le titre de l’objectif est requis.",
      });
    }

    if (!category_id) {
      return res.status(400).json({
        error: "La catégorie est requise.",
      });
    }

    const minimum =
      minimum_value === "" || minimum_value === undefined
        ? null
        : Number(minimum_value);

    const target =
      target_value === "" || target_value === undefined
        ? null
        : Number(target_value);

    const bonus =
      bonus_value === "" || bonus_value === undefined
        ? null
        : Number(bonus_value);

    if (minimum !== null && (Number.isNaN(minimum) || minimum < 0)) {
      return res.status(400).json({
        error: "La valeur Minimum doit être positive.",
      });
    }

    if (target !== null && (Number.isNaN(target) || target < 0)) {
      return res.status(400).json({
        error: "La valeur Target doit être positive.",
      });
    }

    if (bonus !== null && (Number.isNaN(bonus) || bonus < 0)) {
      return res.status(400).json({
        error: "La valeur Bonus doit être positive.",
      });
    }

    if (minimum !== null && target !== null && target < minimum) {
      return res.status(400).json({
        error: "Target doit être supérieur ou égal à Minimum.",
      });
    }

    if (target !== null && bonus !== null && bonus < target) {
      return res.status(400).json({
        error: "Bonus doit être supérieur ou égal à Target.",
      });
    }

    // Vérifie que l'objectif appartient bien
    // à un projet de l'utilisateur connecté.
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select(
        `
                id,
                project_id,
                projects!inner (
                    id,
                    user_id,
                    status
                )
            `,
      )
      .eq("id", goalId)
      .eq("projects.user_id", req.user.id)
      .maybeSingle();

    if (goalError) {
      console.error("Erreur vérification objectif:", goalError);

      return res.status(500).json({
        error: "Impossible de vérifier l’objectif.",
      });
    }

    if (!goal) {
      return res.status(404).json({
        error: "Objectif introuvable.",
      });
    }

    // Vérifie que la catégorie existe.
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", category_id)
      .maybeSingle();

    if (categoryError) {
      console.error("Erreur vérification catégorie:", categoryError);

      return res.status(500).json({
        error: "Impossible de vérifier la catégorie.",
      });
    }

    if (!category) {
      return res.status(400).json({
        error: "Catégorie invalide.",
      });
    }

    const { data: updatedGoal, error: updateError } = await supabase
      .from("goals")
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        category_id,
        goal_type: goal_type || "numeric",
        unit: unit?.trim() || null,
        minimum_value: minimum,
        target_value: target,
        bonus_value: bonus,
        deadline: deadline || null,
      })
      .eq("id", goalId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur modification objectif:", updateError);

      return res.status(400).json({
        error: updateError.message,
      });
    }

    return res.json({
      goal: updatedGoal,
    });
  } catch (error) {
    console.error("Erreur serveur modification objectif:", error);

    return res.status(500).json({
      error: "Impossible de modifier l’objectif.",
    });
  }
});

router.delete("/goals/:goalId", requireAuth, async (req, res) => {
  try {
    const { goalId } = req.params;

    // Vérifie que l'objectif appartient bien
    // à un projet de l'utilisateur connecté.
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select(
        `
                id,
                project_id,
                projects!inner (
                    id,
                    user_id
                )
            `,
      )
      .eq("id", goalId)
      .eq("projects.user_id", req.user.id)
      .maybeSingle();

    if (goalError) {
      console.error("Erreur vérification objectif:", goalError);

      return res.status(500).json({
        error: "Impossible de vérifier l’objectif.",
      });
    }

    if (!goal) {
      return res.status(404).json({
        error: "Objectif introuvable.",
      });
    }

    const { error: deleteError } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    if (deleteError) {
      console.error("Erreur suppression objectif:", deleteError);

      return res.status(400).json({
        error: deleteError.message,
      });
    }

    return res.json({
      success: true,
      message: "Objectif supprimé.",
    });
  } catch (error) {
    console.error("Erreur serveur suppression objectif:", error);

    return res.status(500).json({
      error: "Impossible de supprimer l’objectif.",
    });
  }
});

// ============================================================
// OUTILS DE VALIDATION DES HABITUDES
// ============================================================

const habitFrequencies = ["daily", "weekly", "monthly"];

function validateHabitPayload(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      errors.push("Le nom de l’habitude est requis.");
    } else if (body.name.trim().length > 150) {
      errors.push("Le nom ne peut pas dépasser 150 caractères.");
    }
  }

  if (!partial || body.category_id !== undefined) {
    if (typeof body.category_id !== "string" || !body.category_id) {
      errors.push("La catégorie est requise.");
    }
  }

  if (!partial || body.frequency !== undefined) {
    if (!habitFrequencies.includes(body.frequency)) {
      errors.push("La fréquence doit être daily, weekly ou monthly.");
    }
  }

  if (!partial || body.times_per_period !== undefined) {
    const times = Number(body.times_per_period);

    if (
      !Number.isInteger(times) ||
      times < 1 ||
      times > 31
    ) {
      errors.push("Le nombre de répétitions doit être compris entre 1 et 31.");
    }
  }

  for (const field of ["start_date", "end_date"]) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== "") {
      if (
        typeof body[field] !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(body[field]) ||
        Number.isNaN(Date.parse(`${body[field]}T00:00:00Z`))
      ) {
        errors.push(`La date ${field} est invalide.`);
      }
    }
  }

  const startDate = body.start_date;
  const endDate = body.end_date;

  if (startDate && endDate && endDate < startDate) {
    errors.push("La date de fin doit être postérieure à la date de début.");
  }

  return errors;
}

async function getOwnedHabit(habitId, userId) {
  return supabase
    .from("habits")
    .select("*, projects!inner(id, user_id)")
    .eq("id", habitId)
    .eq("projects.user_id", userId)
    .maybeSingle();
}

async function categoryBelongsToProject(categoryId, projectId) {
  const { data, error } = await supabase
    .from("project_categories")
    .select("category_id")
    .eq("project_id", projectId)
    .eq("category_id", categoryId)
    .maybeSingle();

  return {
    valid: Boolean(data),
    error,
  };
}


/* ============================================================
   HISTORIQUE ET STATISTIQUES D'UNE HABITUDE
   ============================================================ */

router.get("/habits/:habitId/history", requireAuth, async (req, res) => {
  try {
    const { habitId } = req.params;

    const { data: habit, error: habitError } = await getOwnedHabit(
      habitId,
      req.user.id
    );

    if (habitError) {
      console.error("Erreur vérification habitude:", habitError);
      return res.status(500).json({ error: "Impossible de vérifier l'habitude." });
    }

    if (!habit) {
      return res.status(404).json({ error: "Habitude introuvable." });
    }

    const { data: logs, error } = await supabase
      .from("habit_logs")
      .select("id, habit_id, date, value, note")
      .eq("habit_id", habitId)
      .order("date", { ascending: true });

    if (error) {
      console.error("Erreur historique:", error);
      return res.status(500).json({ error: "Impossible de récupérer l'historique." });
    }

    const completedLogs = (logs || []).filter(log => Number(log.value) > 0);
    const totalCompletions = completedLogs.length;

    return res.json({
      habit,
      logs: logs || [],
      stats: {
        totalCompletions,
        firstCompletion: completedLogs[0]?.date || null,
        lastCompletion: completedLogs.at(-1)?.date || null,
      },
    });
  } catch (error) {
    console.error("Erreur historique habitude:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

// ============================================================
// CRÉER UNE HABITUDE
// ============================================================

router.post("/habits", requireAuth, async (req, res) => {
  try {
    const errors = validateHabitPayload(req.body);

    if (errors.length) {
      return res.status(400).json({ error: errors[0] });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (projectError) {
      console.error("Erreur récupération projet:", projectError);
      return res.status(500).json({ error: "Impossible de récupérer le projet." });
    }

    if (!project) {
      return res.status(404).json({ error: "Aucun projet actif trouvé." });
    }

    const { name, category_id, frequency, times_per_period, start_date, end_date } =
      req.body;

    const category = await categoryBelongsToProject(category_id, project.id);

    if (category.error) {
      return res.status(500).json({ error: "Impossible de vérifier la catégorie." });
    }

    if (!category.valid) {
      return res.status(400).json({
        error: "Cette catégorie ne fait pas partie du projet actif.",
      });
    }

    const { data: habit, error } = await supabase
      .from("habits")
      .insert({
        project_id: project.id,
        name: name.trim(),
        category_id,
        frequency,
        times_per_period: Number(times_per_period),
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    
if (error) {
  console.error("Erreur création habitude Supabase:", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  return res.status(500).json({
    error: "Impossible de créer l’habitude.",
    details: error.message,
    code: error.code,
  });
}

    return res.status(201).json({ habit });
  } catch (error) {
    console.error("Erreur création habitude:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

// ============================================================
// MODIFIER UNE HABITUDE
// ============================================================

router.patch("/habits/:habitId", requireAuth, async (req, res) => {
  try {
    const errors = validateHabitPayload(req.body, { partial: true });

    if (errors.length) {
      return res.status(400).json({ error: errors[0] });
    }

    const { habitId } = req.params;

    const { data: habit, error: habitError } = await getOwnedHabit(
      habitId,
      req.user.id,
    );

    if (habitError) {
      console.error("Erreur vérification habitude:", habitError);
      return res.status(500).json({ error: "Impossible de vérifier l’habitude." });
    }

    if (!habit) {
      return res.status(404).json({ error: "Habitude introuvable." });
    }

    const merged = {
      name: req.body.name ?? habit.name,
      category_id: req.body.category_id ?? habit.category_id,
      frequency: req.body.frequency ?? habit.frequency,
      times_per_period:
        req.body.times_per_period ?? habit.times_per_period,
      start_date: req.body.start_date ?? habit.start_date,
      end_date: req.body.end_date ?? habit.end_date,
    };

    const mergedErrors = validateHabitPayload(merged);

    if (mergedErrors.length) {
      return res.status(400).json({ error: mergedErrors[0] });
    }

    const category = await categoryBelongsToProject(
      merged.category_id,
      habit.project_id,
    );

    if (category.error) {
      return res.status(500).json({ error: "Impossible de vérifier la catégorie." });
    }

    if (!category.valid) {
      return res.status(400).json({
        error: "Cette catégorie ne fait pas partie du projet.",
      });
    }

    const { data: updatedHabit, error } = await supabase
      .from("habits")
      .update({
        ...merged,
        name: merged.name.trim(),
        times_per_period: Number(merged.times_per_period),
        start_date: merged.start_date || null,
        end_date: merged.end_date || null,
      })
      .eq("id", habitId)
      .select()
      .single();

    if (error) {
      console.error("Erreur modification habitude:", error);
      return res.status(500).json({ error: "Impossible de modifier l’habitude." });
    }

    return res.json({ habit: updatedHabit });
  } catch (error) {
    console.error("Erreur modification habitude:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

// ============================================================
// SUPPRIMER UNE HABITUDE
// ============================================================

router.delete("/habits/:habitId", requireAuth, async (req, res) => {
  try {
    const { habitId } = req.params;

    const { data: habit, error: habitError } = await getOwnedHabit(
      habitId,
      req.user.id,
    );

    if (habitError) {
      console.error("Erreur vérification habitude:", habitError);
      return res.status(500).json({ error: "Impossible de vérifier l’habitude." });
    }

    if (!habit) {
      return res.status(404).json({ error: "Habitude introuvable." });
    }

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId);

    if (error) {
      console.error("Erreur suppression habitude:", error);
      return res.status(500).json({ error: "Impossible de supprimer l’habitude." });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression habitude:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});


const isValidJournalDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
};

async function getActiveJournalProject(userId) {
  return supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

async function getOwnedJournalEntry(entryId, userId) {
  return supabase
    .from("journal_entries")
    .select("*, projects!inner(id, user_id)")
    .eq("id", entryId)
    .eq("projects.user_id", userId)
    .maybeSingle();
}

// GET /dashboard/journal?search=...&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/journal", requireAuth, async (req, res) => {
  try {
    const { data: project, error: projectError } =
      await getActiveJournalProject(req.user.id);

    if (projectError) throw projectError;

    if (!project) return res.json({ entries: [] });

    const { search = "", from = "", to = "" } = req.query;

    if (from && !isValidJournalDate(from)) {
      return res.status(400).json({ error: "Date de début invalide." });
    }

    if (to && !isValidJournalDate(to)) {
      return res.status(400).json({ error: "Date de fin invalide." });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        error: "La date de début doit précéder la date de fin.",
      });
    }

    let query = supabase
      .from("journal_entries")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);

    if (to) {
      const endDate = new Date(`${to}T00:00:00.000Z`);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      query = query.lt("created_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const term = typeof search === "string" ? search.trim().toLowerCase() : "";
    const entries = (data || []).filter((entry) => {
      if (!term) return true;

      return (
        (entry.title || "").toLowerCase().includes(term) ||
        (entry.content || "").toLowerCase().includes(term)
      );
    });

    return res.json({ entries });
  } catch (error) {
    console.error("Erreur lecture journal:", error);
    return res.status(500).json({
      error: "Impossible de récupérer le journal.",
    });
  }
});

// POST /dashboard/journal
router.post("/journal", requireAuth, async (req, res) => {
  try {
    const { title, content, mood = null } = req.body || {};

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Le titre est obligatoire." });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        error: "Le titre ne peut pas dépasser 200 caractères.",
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Le texte est obligatoire." });
    }

    if (
      mood !== null &&
      mood !== undefined &&
      mood !== "" &&
      (!Number.isInteger(Number(mood)) || Number(mood) < 1 || Number(mood) > 5)
    ) {
      return res.status(400).json({
        error: "L'humeur doit être un nombre entre 1 et 5.",
      });
    }

    const { data: project, error: projectError } =
      await getActiveJournalProject(req.user.id);

    if (projectError) throw projectError;

    if (!project) {
      return res.status(404).json({ error: "Aucun projet actif trouvé." });
    }

    const { data: entry, error } = await supabase
      .from("journal_entries")
      .insert({
        project_id: project.id,
        title: title.trim(),
        content: content.trim(),
        mood: mood === "" || mood == null ? null : Number(mood),
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ entry });
  } catch (error) {
    console.error("Erreur création journal:", error);
    return res.status(500).json({
      error: "Impossible de créer l'entrée du journal.",
    });
  }
});

// PATCH /dashboard/journal/:entryId
router.patch("/journal/:entryId", requireAuth, async (req, res) => {
  try {
    const { entryId } = req.params;
    const { title, content, mood } = req.body || {};
    const updates = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200
      ) {
        return res.status(400).json({ error: "Le titre est invalide." });
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Le texte est obligatoire." });
      }
      updates.content = content.trim();
    }

    if (mood !== undefined) {
      if (
        mood !== null &&
        mood !== "" &&
        (!Number.isInteger(Number(mood)) ||
          Number(mood) < 1 ||
          Number(mood) > 5)
      ) {
        return res
          .status(400)
          .json({ error: "L'humeur doit être un nombre entre 1 et 5." });
      }
      updates.mood = mood === null || mood === "" ? null : Number(mood);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "Aucune modification fournie." });
    }

    const { data: existing, error: ownershipError } =
      await getOwnedJournalEntry(entryId, req.user.id);

    if (ownershipError) throw ownershipError;

    if (!existing) {
      return res.status(404).json({ error: "Entrée introuvable." });
    }

    const { data: entry, error } = await supabase
      .from("journal_entries")
      .update(updates)
      .eq("id", entryId)
      .eq("project_id", existing.project_id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ entry });
  } catch (error) {
    console.error("Erreur modification journal:", error);
    return res.status(500).json({
      error: "Impossible de modifier l'entrée.",
    });
  }
});

// DELETE /dashboard/journal/:entryId
router.delete("/journal/:entryId", requireAuth, async (req, res) => {
  try {
    const { entryId } = req.params;

    const { data: existing, error: ownershipError } =
      await getOwnedJournalEntry(entryId, req.user.id);

    if (ownershipError) throw ownershipError;

    if (!existing) {
      return res.status(404).json({ error: "Entrée introuvable." });
    }

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId)
      .eq("project_id", existing.project_id);

    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression journal:", error);
    return res.status(500).json({
      error: "Impossible de supprimer l'entrée.",
    });
  }
});

export default router;
