<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.js'
import { getUser, logout } from '../auth.js'

const router = useRouter()

const user = getUser()

const apiStatus = ref('loading')
const dbStatus = ref('loading')
const errorMessage = ref('')

onMounted(async () => {
  // Front -> API
  try {
    const user = await api.me()

    console.log(user)

    apiStatus.value = 'success'
    dbStatus.value = 'success'
  } catch {
    apiStatus.value = 'error'
    dbStatus.value = 'error'

    errorMessage.value =
      "L'API ne répond pas. Est-elle bien lancée sur le port 3000 ?"

    return
  }
})

function handleLogout() {
  logout()
  router.push('/login')
}

function goToDashboard() {
  router.push('/dashboard')
}

function goToCreateProject() {
  router.push('/projects/new')
}
</script>

<template>
  <main class="home">

    <div class="header">

      <div>
        <h1>Project X</h1>

        <p v-if="user">
          Connecté avec {{ user.email }}
        </p>
      </div>

      <div class="actions">

        <button class="dashboard-button" @click="goToDashboard">
          Mon dashboard
        </button>

        <button class="create-button" @click="goToCreateProject">
          + Créer mon Project X
        </button>

        <button class="logout-button" @click="handleLogout">
          Se déconnecter
        </button>

      </div>

    </div>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

  </main>
</template>

<style scoped>
.home {
  max-width: 900px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header h1 {
  margin: 0;
}

.header p {
  margin-top: 0.5rem;
  opacity: 0.7;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

.actions button {
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.actions button:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.dashboard-button {
  background: #7fa88a;
  color: white;
}

.create-button {
  background: #e8c9a0;
  color: #2f3b33;
}

.logout-button {
  background: #e7ebe6;
  color: #2f3b33;
}

.error {
  margin-top: 1.5rem;
  color: #8b665f;
}

@media (max-width: 700px) {
  .header {
    flex-direction: column;
  }

  .actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 500px) {
  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }
}
</style>

