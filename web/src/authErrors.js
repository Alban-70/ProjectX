export function getAuthErrorMessage(error) {
  const message = error?.message?.toLowerCase() || "";

  if (message.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }

  if (message.includes("email not confirmed")) {
    return "Ton email n’a pas encore été confirmé.";
  }

  if (message.includes("user already registered")) {
    return "Un compte existe déjà avec cet email.";
  }

  if (message.includes("password should be at least")) {
    return "Le mot de passe est trop court.";
  }

  if (message.includes("invalid email")) {
    return "Adresse email invalide.";
  }

  if (message.includes("rate limit")) {
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  }

  if (message.includes("session")) {
    return "Ta session a expiré. Reconnecte-toi.";
  }

  return error?.message || "Une erreur est survenue.";
}
