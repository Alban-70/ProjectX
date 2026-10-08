import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description")
      .order("name");

    if (error) {
      console.error("Erreur récupération catégories:", error);

      return res.status(500).json({
        error: "Impossible de récupérer les catégories.",
      });
    }

    return res.json({
      categories: data,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);

    return res.status(500).json({
      error: "Erreur interne du serveur.",
    });
  }
});

export default router;
