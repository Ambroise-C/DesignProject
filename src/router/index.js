import { createRouter, createWebHistory } from 'vue-router'
import SearchView from '../views/SearchView.vue'
import LibraryView from '../views/LibraryView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import LoginView from '../views/LoginView.vue'
import ReviewView from '../views/ReviewView.vue'
import store from '../store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'search', component: SearchView },
    { path: '/library', name: 'library', component: LibraryView, meta: { requiresAuth: true } },
    { path: '/favorites', name: 'favorites', component: FavoritesView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/review', name: 'review', component: ReviewView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && store.getters.isAuthenticated) {
    return typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
      ? to.query.redirect
      : { name: 'library' }
  }

  return true
})

export default router
