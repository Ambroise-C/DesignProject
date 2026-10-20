<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const store = useStore()
const favorites = computed(() => store.getters.favorites)
</script>

<template>
  <section class="collection-page favorites-page page-wrap">
    <div class="collection-intro">
      <p class="eyebrow"><span></span> THE ONES YOU LOVE</p>
      <h1>Heart <em>notes.</em></h1>
      <p>Your most-loved reads, kept close at hand.</p>
    </div>

    <div class="favorites-banner">
      <span aria-hidden="true">♡</span>
      <p>“A book is a dream that you hold in your hand.” <small>— Neil Gaiman</small></p>
      <span class="favorite-total">{{ favorites.length.toString().padStart(2, '0') }} SAVED</span>
    </div>

    <div class="section-heading">
      <div>
        <p class="eyebrow">YOUR MOST TREASURED STORIES</p>
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
      />
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon heart-icon" aria-hidden="true">♡</div>
      <h2>Your favorites will feel right at home here.</h2>
      <p>Tap the heart on any book in your library to save it to this list.</p>
      <RouterLink class="button button-primary" to="/library">Go to my library <span aria-hidden="true">→</span></RouterLink>
    </div>
  </section>
</template>
