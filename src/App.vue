<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const router = useRouter()
const store = useStore()
const isAuthenticated = computed(() => store.getters.isAuthenticated)
const username = computed(() => store.getters.username)

async function logout() {
  await store.dispatch('logout')
  await router.replace('/')
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="Campers home">
        <img class="brand-logo" src="/ressources/campers-logo.png" alt="" />
        <span>Campers</span>
      </RouterLink>

      <nav v-if="!['login', 'review'].includes(route.name)" class="main-nav" aria-label="Main navigation">
        <RouterLink to="/" :class="{ active: route.name === 'search' }">Discover books</RouterLink>
        <RouterLink v-if="isAuthenticated" to="/library" :class="{ active: route.name === 'library' }">
          My shelves
        </RouterLink>
        <RouterLink v-if="isAuthenticated" to="/favorites" :class="{ active: route.name === 'favorites' }">Favorites</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/login" :class="{ active: route.name === 'login' }">Log in</RouterLink>
        <span v-if="isAuthenticated" class="account-label">{{ username }}</span>
        <button v-if="isAuthenticated" class="logout-button" type="button" @click="logout">Log out</button>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer v-if="!['login', 'review'].includes(route.name)" class="site-footer">
      <span class="footer-brand">
        <img src="/ressources/campers-logo.png" alt="" />
        Campers
      </span>
      <span>Book details from Open Library</span>
    </footer>
  </div>
</template>
