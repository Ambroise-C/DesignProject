<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const router = useRouter()
const store = useStore()
const username = ref('')
const password = ref('')
const message = ref('')
const isRegistering = ref(false)

async function submitLogin() {
  message.value = ''

  try {
    const credentials = { username: username.value, password: password.value }
    await store.dispatch(isRegistering.value ? 'register' : 'login', credentials)
    const destination =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/library'
    await router.replace(destination)
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Une erreur est survenue.'
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <p class="eyebrow">FIELDNOTES · VOTRE BIBLIOTHÈQUE</p>
      <h1>{{ isRegistering ? 'Créer un compte' : 'Log in' }}</h1>
      <p class="login-caption">Connectez-vous pour retrouver vos livres enregistrés.</p>

      <form class="login-form" @submit.prevent="submitLogin">
        <label for="login-username">Nom d’utilisateur</label>
        <input
          id="login-username"
          v-model="username"
          type="text"
          autocomplete="username"
          minlength="3"
          maxlength="24"
          required
        />

        <label for="login-password">Mot de passe</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          :autocomplete="isRegistering ? 'new-password' : 'current-password'"
          :minlength="isRegistering ? 4 : undefined"
          required
        />

        <button class="button button-primary" type="submit">
          {{ isRegistering ? 'Créer le compte' : 'Se connecter' }}
        </button>
        <p v-if="message" class="login-message" role="alert">{{ message }}</p>
      </form>

      <p class="login-switch">
        {{ isRegistering ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?' }}
        <button type="button" @click="isRegistering = !isRegistering; message = ''">
          {{ isRegistering ? 'Se connecter' : 'Créer un compte' }}
        </button>
      </p>
      <p v-if="!isRegistering" class="demo-credentials">
        Compte de démonstration : <strong>test</strong> · mot de passe : <strong>test</strong>
      </p>
      <RouterLink class="guest-link" to="/">Continuer sans compte</RouterLink>
      <p class="local-auth-note">
        Comptes et mots de passe enregistrés uniquement dans ce navigateur. Ce mode local ne protège
        pas des utilisateurs de l’appareil.
      </p>
    </div>
  </section>
</template>
