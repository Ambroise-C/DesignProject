<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const store = useStore()
const favorites = computed(() => store.getters.favorites)
</script>

<template>
  <section class="collection-page favorites-page page-wrap">
    <div class="section-heading">
      <div>
        <h2>Favorite books</h2>
      </div>
      <span class="results-count">{{ favorites.length }} {{ favorites.length === 1 ? 'book' : 'books' }}</span>
    </div>

    <div v-if="favorites.length" class="book-grid">
      <BookCard
        v-for="book in favorites"
        :key="book.id"
        :book="book"
        actions
        @remove="store.dispatch('removeBook', $event)"
        @toggle-read="store.dispatch('toggleRead', $event)"
        @toggle-favorite="store.dispatch('toggleFavorite', $event)"
        @set-rating="store.dispatch('setRating', $event)"
        @save-note="store.dispatch('setNote', $event)"
      />
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon heart-icon" aria-hidden="true">♡</div>
      <p>Tap the heart on any book in your library to save it to this list.</p>
      <RouterLink class="button button-primary" to="/library">Go to my library <span aria-hidden="true">→</span></RouterLink>
    </div>
  </section>
</template>
