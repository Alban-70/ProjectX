import { supabase } from "../lib/supabase.js"

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        error: "Token manquant.",
      });
    }

    const token = authorization.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Token invalide.",
      });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Session invalide ou expirée.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware:", error);

    return res.status(401).json({
      error: "Impossible de vérifier la session.",
    });
  }
}
