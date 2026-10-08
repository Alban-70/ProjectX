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

export default router;
