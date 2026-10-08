<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.js'
import { saveSession } from '../auth.js'
import { getAuthErrorMessage } from '../authErrors.js'

const router = useRouter()

const email = ref('')
const password = ref('')

const loading = ref(false)
const error = ref('')

async function login() {
    error.value = ''

    if (!email.value || !password.value) {
        error.value = 'Veuillez remplir tous les champs.'
        return
    }

    loading.value = true

    try {
        const data = await api.login(
            email.value,
            password.value
        )

        console.log('Réponse API :', data)

        if (!data?.session || !data?.user) {
            throw new Error(
                'La connexion a réussi mais aucune session n’a été retournée.'
            )
        }

        saveSession(data.session, data.user)

        router.push('/')

    } catch (e) {
        console.error('Erreur connexion:', e)

        error.value = getAuthErrorMessage(e)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="auth-page">
        <div class="auth-card">

            <header class="auth-header">
                <div class="auth-badge">
                    <span class="auth-badge-dot"></span>
                    PROJECT X
                </div>

                <h1 class="auth-title">Connexion</h1>

                <p class="auth-subtitle">
                    Connecte-toi à ton Project X.
                </p>
            </header>

            <form class="auth-form" @submit.prevent="login">

                <div class="field">
                    <label class="label" for="email">
                        Email
                    </label>

                    <input id="email" v-model="email" class="input" type="email" placeholder="ton@email.com"
                        autocomplete="email" :disabled="loading" />
                </div>

                <div class="field">
                    <div class="label-row">
                        <label class="label" for="password">
                            Mot de passe
                        </label>

                        <button type="button" class="forgot-link" @click="router.push('/forgot-password')">
                            Oublié ?
                        </button>
                    </div>

                    <input id="password" v-model="password" class="input" type="password" placeholder="••••••••"
                        autocomplete="current-password" :disabled="loading" />
                </div>

                <div v-if="error" class="error-banner">
                    <span class="error-icon">!</span>
                    <span>{{ error }}</span>
                </div>

                <button type="submit" class="submit-btn" :disabled="loading">
                    <span v-if="loading" class="spinner"></span>
                    {{ loading ? 'Connexion...' : 'Se connecter ✦' }}
                </button>

            </form>

            <footer class="auth-footer">
                <p class="register-link">
                    Pas encore de compte ?
                    <button type="button" class="link-btn" @click="router.push('/register')">
                        Créer un compte
                    </button>
                </p>
            </footer>

        </div>
    </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.auth-page {
    /* Palette Soft Zen */
    --px-bg: #f3f5ef;
    --px-surface: #ffffff;
    --px-surface-soft: #f8faf6;

    --px-sage: #7fa88a;
    --px-sage-dark: #55775f;
    --px-sage-light: #e4ece6;

    --px-sand: #e8c9a0;
    --px-sand-light: #f7eedf;

    --px-text: #2f3b33;
    --px-text-soft: #637168;
    --px-text-muted: #95a19a;

    --px-border: #e2e8e1;
    --px-border-soft: #edf1eb;

    --px-error-bg: #f7ebe6;
    --px-error-text: #73574c;
    --px-error-border: #edd6cb;

    --px-radius-sm: 16px;
    --px-radius-md: 20px;
    --px-radius-lg: 28px;

    --px-shadow-card: 0 20px 50px -8px rgba(47, 59, 51, 0.07);
    --px-transition: 350ms cubic-bezier(0.16, 1, 0.3, 1);

    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    box-sizing: border-box;

    background:
        radial-gradient(circle at 15% 15%, rgba(127, 168, 138, 0.15), transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(232, 201, 160, 0.18), transparent 45%),
        var(--px-bg);

    color: var(--px-text);
    font-family: 'Nunito', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
}

/* =========================================================
   CARTE PRINCIPALE
   ========================================================= */

.auth-card {
    width: 100%;
    max-width: 460px;
    padding: 48px;

    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.95);
    border-radius: var(--px-radius-lg);

    box-shadow: var(--px-shadow-card);
    backdrop-filter: blur(16px);

    animation: auth-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes auth-fade {
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* =========================================================
   HEADER
   ========================================================= */

.auth-header {
    text-align: center;
    margin-bottom: 36px;
}

.auth-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    margin-bottom: 16px;
    padding: 6px 14px;

    color: var(--px-sage-dark);
    background: var(--px-sage-light);

    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
}

.auth-badge-dot {
    width: 8px;
    height: 8px;
    background: var(--px-sage);
    border-radius: 50%;
}

.auth-title {
    margin: 0;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -0.01em;
    color: var(--px-text);
}

.auth-subtitle {
    margin: 8px 0 0;
    font-size: 15px;
    color: var(--px-text-soft);
    line-height: 1.5;
}

/* =========================================================
   FORMULAIRE & CHAMPS
   ========================================================= */

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.field {
    display: flex;
    flex-direction: column;
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.label {
    font-size: 14px;
    font-weight: 800;
    color: var(--px-text);
}

.forgot-link {
    background: transparent;
    border: 0;
    padding: 0;

    color: var(--px-text-muted);
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;

    cursor: pointer;
    transition: color var(--px-transition);
}

.forgot-link:hover {
    color: var(--px-sage-dark);
}

.input {
    width: 100%;
    padding: 15px 20px;

    color: var(--px-text);
    background: var(--px-surface);

    border: 1.5px solid var(--px-border);
    border-radius: var(--px-radius-md);

    font-family: inherit;
    font-size: 15px;
    outline: none;
    box-sizing: border-box;

    transition: all var(--px-transition);
}

.input::placeholder {
    color: var(--px-text-muted);
}

.input:hover:not(:disabled) {
    border-color: #cbd5cc;
}

.input:focus {
    border-color: var(--px-sage);
    box-shadow: 0 0 0 5px rgba(127, 168, 138, 0.16);
    background: #ffffff;
}

.input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* =========================================================
   ALERTE ERREUR BIENVENANTE
   ========================================================= */

.error-banner {
    display: flex;
    align-items: center;
    gap: 12px;

    padding: 14px 18px;
    border-radius: var(--px-radius-md);

    color: var(--px-error-text);
    background: var(--px-error-bg);
    border: 1px solid var(--px-error-border);

    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
}

.error-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 50%;
    background: rgba(115, 87, 76, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
}

/* =========================================================
   BOUTON SUBMIT
   ========================================================= */

.submit-btn {
    margin-top: 8px;
    min-height: 52px;
    padding: 14px 28px;

    color: white;
    background: var(--px-sage);

    border: 0;
    border-radius: 999px;

    font-family: inherit;
    font-size: 16px;
    font-weight: 800;

    cursor: pointer;
    box-shadow: 0 10px 24px rgba(127, 168, 138, 0.28);

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    transition: all var(--px-transition);
}

.submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(127, 168, 138, 0.35);
    background: var(--px-sage-dark);
}

.submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: white;
    border-radius: 50%;

    animation: spin 800ms linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* =========================================================
   FOOTER & LIENS
   ========================================================= */

.auth-footer {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1.5px solid var(--px-border-soft);
    text-align: center;
}

.register-link {
    margin: 0;
    font-size: 14px;
    color: var(--px-text-soft);
    font-weight: 600;
}

.link-btn {
    background: transparent;
    border: 0;
    padding: 0;
    margin-left: 6px;

    color: var(--px-sage-dark);
    font-family: inherit;
    font-size: 14px;
    font-weight: 800;

    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;

    transition: color var(--px-transition);
}

.link-btn:hover {
    color: var(--px-text);
}

/* RESPONSIVE */
@media (max-width: 520px) {
    .auth-card {
        padding: 32px 20px;
        border-radius: var(--px-radius-md);
    }

    .auth-title {
        font-size: 26px;
    }
}
</style>