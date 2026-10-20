<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const store = useStore()
const books = computed(() => store.getters.library)
const readCount = computed(() => books.value.filter((book) => book.read).length)
</script>

<template>
  <section class="collection-page page-wrap">
    <div class="collection-intro">
      <p class="eyebrow"><span></span> YOUR PERSONAL COLLECTION</p>
      <h1>My <em>library.</em></h1>
      <p>All the books you’ve gathered, in one happy place.</p>
    </div>

    <div class="collection-summary">
      <div><strong>{{ books.length.toString().padStart(2, '0') }}</strong><span>BOOKS COLLECTED</span></div>
      <div><strong>{{ readCount.toString().padStart(2, '0') }}</strong><span>BOOKS FINISHED</span></div>
      <div class="summary-decoration" aria-hidden="true">A story<br />for every<br />season.</div>
    </div>

    <div class="section-heading">
      <div>
        <p class="eyebrow">A COLLECTION IN THE MAKING</p>
        <h2>On your shelf</h2>
      </div>
      <span class="results-count">{{ books.length }} {{ books.length === 1 ? 'book' : 'books' }}</span>
    </div>

    <div v-if="books.length" class="book-grid">
      <BookCard
        v-for="book in books"
        :key="book.id"
        :book="book"
        actions
        @remove="store.dispatch('removeBook', $event)"
        @toggle-read="store.dispatch('toggleRead', $event)"
        @toggle-favorite="store.dispatch('toggleFavorite', $event)"
      />
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon" aria-hidden="true">▤</div>
      <h2>Your shelf is still a blank page.</h2>
      <p>Find a book that speaks to you and add it to your library.</p>
      <RouterLink class="button button-primary" to="/">Discover books <span aria-hidden="true">→</span></RouterLink>
    </div>
  </section>
</template>
