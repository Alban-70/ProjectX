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
    const userId = req.user.id;
    const { habitId } = req.params;

    const value = req.body?.value === undefined ? 1 : Number(req.body.value);

    const note = req.body?.note || null;

    if (Number.isNaN(value) || value < 0) {
      return res.status(400).json({
        error: "La valeur de l’habitude est invalide.",
      });
    }

    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select(
        `
                    id,
                    project_id,
                    name,
                    projects!inner(
                        user_id
                    )
                `,
      )
      .eq("id", habitId)
      .eq("projects.user_id", userId)
      .maybeSingle();

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

    const today = new Date().toISOString().split("T")[0];

    const { data: existingLog, error: existingError } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("habit_id", habitId)
      .eq("date", today)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({
        error: "Impossible de vérifier la validation actuelle.",
      });
    }

    let log;

    if (existingLog) {
      const { data, error } = await supabase
        .from("habit_logs")
        .update({
          value,
          note,
        })
        .eq("id", existingLog.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: "Impossible de mettre à jour l’habitude.",
        });
      }

      log = data;
    } else {
      const { data, error } = await supabase
        .from("habit_logs")
        .insert({
          habit_id: habitId,
          date: today,
          value,
          note,
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: "Impossible de valider l’habitude.",
        });
      }

      log = data;
    }

    return res.json({
      log,
    });
  } catch (error) {
    console.error("Erreur log habitude:", error);

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

export default router;
