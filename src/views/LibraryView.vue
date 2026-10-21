<script setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const store = useStore()
const books = computed(() => store.getters.library)
const searchQuery = ref('')
const readFilter = ref('all')
const sortBy = ref('date-added')
const visibleCount = ref(12)
const pageSize = 12
const readCount = computed(() => books.value.filter((book) => book.read).length)
const filteredBooks = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLocaleLowerCase()

  return books.value
    .filter((book) => {
      if (readFilter.value === 'read' && !book.read) return false
      if (readFilter.value === 'to-read' && book.read) return false
      if (!normalizedQuery) return true

      return [book.title, book.author].some((value) =>
        value?.toLocaleLowerCase().includes(normalizedQuery),
      )
    })
    .sort((first, second) => {
      if (sortBy.value === 'title') {
        return (first.title || '').localeCompare(second.title || '')
      }
      if (sortBy.value === 'year') {
        return (Number(first.year) || 0) - (Number(second.year) || 0)
      }
      return (second.dateAdded || 0) - (first.dateAdded || 0)
    })
})
const visibleBooks = computed(() => filteredBooks.value.slice(0, visibleCount.value))

watch([searchQuery, readFilter, sortBy], () => {
  visibleCount.value = pageSize
})
</script>

<template>
  <section class="collection-page page-wrap">
    <div class="collection-intro">
      <h1>My <em>library.</em></h1>
    </div>

    <div class="collection-summary">
      <div><strong>{{ books.length.toString().padStart(2, '0') }}</strong><span>BOOKS COLLECTED</span></div>
      <div><strong>{{ readCount.toString().padStart(2, '0') }}</strong><span>BOOKS FINISHED</span></div>
    </div>

    <div class="section-heading">
      <div>
        <h2>On your shelf</h2>
      </div>
      <span class="results-count">{{ filteredBooks.length }} {{ filteredBooks.length === 1 ? 'book' : 'books' }}</span>
    </div>

    <div v-if="books.length" class="search-filters shelf-filters">
      <label class="filter-field shelf-search-field">
        <span class="sr-only">Search your library</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search your library"
          aria-label="Search your library"
        />
      </label>
      <label class="filter-field">
        <span>Reading status</span>
        <select v-model="readFilter" aria-label="Filter books by reading status">
          <option value="all">All books</option>
          <option value="read">Read</option>
          <option value="to-read">To read</option>
        </select>
      </label>
      <label class="filter-field">
        <span>Sort by</span>
        <select v-model="sortBy" aria-label="Sort books">
          <option value="title">Title</option>
          <option value="year">Year</option>
          <option value="date-added">Date added</option>
        </select>
      </label>
    </div>

    <div v-if="visibleBooks.length" class="book-grid">
      <BookCard
        v-for="book in visibleBooks"
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
    <div v-if="filteredBooks.length > visibleCount" class="load-more-wrap">
      <button class="button load-more-button" type="button" @click="visibleCount += pageSize">
        Load more
      </button>
    </div>
    <div v-if="books.length && !filteredBooks.length" class="state-message">
      No results found.
    </div>
    <div v-if="!books.length" class="empty-state">
      <div class="empty-icon" aria-hidden="true">▤</div>
      <h2>Your shelf is still a blank page.</h2>
      <p>Add first one to library</p>
      <RouterLink class="button button-primary" to="/">Discover books <span aria-hidden="true">→</span></RouterLink>
    </div>
  </section>
</template>
