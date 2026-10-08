import express from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      motto,
      start_date,
      end_date,
      categories = [],
      objectives = [],
      habits = [],
    } = req.body;

    // -------------------------
    // VALIDATION
    // -------------------------

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Le nom du projet est requis.",
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: "Les dates du projet sont requises.",
      });
    }

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        error: "Les catégories doivent être un tableau.",
      });
    }

    if (!Array.isArray(objectives)) {
      return res.status(400).json({
        error: "Les objectifs doivent être un tableau.",
      });
    }

    if (!Array.isArray(habits)) {
      return res.status(400).json({
        error: "Les habitudes doivent être un tableau.",
      });
    }

    // -------------------------
    // 1. CRÉER LE PROJET
    // -------------------------

    const { data: project, error: projectError } =
      await supabase
        .from("projects")
        .insert({
          user_id: req.user.id,
          name: name.trim(),
          description: description?.trim() || null,
          motto: motto?.trim() || null,
          start_date,
          end_date,
          status: "active",
        })
        .select()
        .single();

    if (projectError) {
      console.error("Erreur création projet:", projectError);

      return res.status(400).json({
        error: projectError.message,
      });
    }

    // -------------------------
    // 2. AJOUTER LES CATÉGORIES
    // -------------------------

    if (categories.length > 0) {
      const projectCategories = categories.map((categoryId) => ({
        project_id: project.id,
        category_id: categoryId,
      }));

      const { error: categoriesError } =
        await supabase
          .from("project_categories")
          .insert(projectCategories);

      if (categoriesError) {
        console.error(
          "Erreur ajout catégories:",
          categoriesError
        );

        return res.status(400).json({
          error: categoriesError.message,
        });
      }
    }

    // -------------------------
    // 3. AJOUTER LES OBJECTIFS
    // -------------------------

    if (objectives.length > 0) {
      const goalRows = objectives.map((objective) => ({
        project_id: project.id,
        category_id: objective.category_id,
        title: objective.name.trim(),
        goal_type: "numeric",
        unit: objective.unit?.trim() || null,
        minimum_value:
          objective.minimum !== ""
            ? Number(objective.minimum)
            : null,
        target_value:
          objective.target !== ""
            ? Number(objective.target)
            : null,
        bonus_value:
          objective.bonus !== ""
            ? Number(objective.bonus)
            : null,
        deadline: objective.deadline || null,
      }));

      const { error: goalsError } =
        await supabase
          .from("goals")
          .insert(goalRows);

      if (goalsError) {
        console.error(
          "Erreur ajout objectifs:",
          goalsError
        );

        return res.status(400).json({
          error: goalsError.message,
        });
      }
    }

    // -------------------------
    // 4. AJOUTER LES HABITUDES
    // -------------------------

    if (habits.length > 0) {
      const habitRows = habits.map((habit) => ({
        project_id: project.id,
        category_id: habit.category_id,
        name: habit.name.trim(),
        frequency: habit.frequency,
        target_count: Number(habit.times_per_period),
        start_date: habit.start_date,
        end_date: habit.end_date,
      }));

      const { error: habitsError } =
        await supabase
          .from("habits")
          .insert(habitRows);

      if (habitsError) {
        console.error(
          "Erreur ajout habitudes:",
          habitsError
        );

        return res.status(400).json({
          error: habitsError.message,
        });
      }
    }

    // -------------------------
    // 5. RÉPONSE
    // -------------------------

    return res.status(201).json({
      project,
      categoriesCreated: categories.length,
      objectivesCreated: objectives.length,
      habitsCreated: habits.length,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);

    return res.status(500).json({
      error: "Impossible de créer le projet.",
    });
  }
});

export default router;
