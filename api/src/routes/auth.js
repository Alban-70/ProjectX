import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis.",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);

      return res.status(401).json({
        error: error.message,
      });
    }

    if (!data || !data.session || !data.user) {
      return res.status(401).json({
        error: "Aucune session retournée par Supabase.",
      });
    }

    return res.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erreur interne du serveur.",
    });
  }
});


router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Erreur Supabase:", error);

      return res.status(400).json({
        error: error.message,
      });
    }

    if (!data?.user) {
      return res.status(400).json({
        error: "Impossible de créer le compte.",
      });
    }

    return res.status(201).json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);

    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Erreur interne du serveur.",
    });
  }
});


router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Adresse email requise.",
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset-password",
    });

    if (error) {
      console.error("Erreur reset password:", error);

      return res.status(400).json({
        error: error.message,
      });
    }

    return res.json({
      message:
        "Si cette adresse existe, un email de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);

    return res.status(500).json({
      error: "Impossible de traiter la demande.",
    });
  }
});


router.post("/reset-password", async (req, res) => {
  try {
    const { access_token, refresh_token, password } = req.body;

    if (!access_token || !refresh_token || !password) {
      return res.status(400).json({
        error: "Informations de réinitialisation manquantes.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

    if (sessionError || !sessionData?.session) {
      return res.status(401).json({
        error: "Le lien de réinitialisation est invalide ou expiré.",
      });
    }

    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.json({
      user: data.user,
      message: "Mot de passe modifié avec succès.",
    });
  } catch (error) {
    console.error("Erreur reset password:", error);

    return res.status(500).json({
      error: "Impossible de modifier le mot de passe.",
    });
  }
});


router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: "Refresh token manquant.",
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !data?.session || !data?.user) {
      return res.status(401).json({
        error: "Session expirée. Veuillez vous reconnecter.",
      });
    }

    return res.json({
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error("Erreur refresh:", error);

    return res.status(500).json({
      error: "Impossible de restaurer la session.",
    });
  }
});

export default router;
