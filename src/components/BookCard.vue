<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  book: { type: Object, required: true },
  inLibrary: { type: Boolean, default: false },
  canAdd: { type: Boolean, default: false },
  actions: { type: Boolean, default: false },
})

const emit = defineEmits([
  'add',
  'remove',
  'toggle-read',
  'toggle-favorite',
  'set-rating',
  'save-note',
])
const coverUnavailable = ref(false)
const noteDraft = ref(props.book.note || '')
const ratingOptions = [1, 2, 3, 4, 5]
const bookRoute = () => ({
  name: 'review',
  query: {
    id: props.book.id,
    title: props.book.title,
    author: props.book.author,
    year: props.book.year,
    cover: props.book.cover,
  },
})

watch(
  () => props.book.cover,
  () => {
    coverUnavailable.value = false
  },
)

watch(
  () => [props.book.id, props.book.note],
  () => {
    noteDraft.value = props.book.note || ''
  },
)
</script>

<template>
  <article class="book-card">
    <div class="book-cover">
      <img
        v-if="book.cover && !coverUnavailable"
        :src="book.cover"
        :alt="`Cover of ${book.title}`"
        loading="lazy"
        @error="coverUnavailable = true"
      />
      <div v-else class="cover-placeholder" aria-hidden="true">
        <span class="placeholder-mark">Book</span>
      </div>
      <RouterLink
        class="cover-link"
        :to="bookRoute()"
        :aria-label="`Review ${book.title}`"
      />
      <button
        v-if="actions"
        class="favorite-button"
        :class="{ 'is-favorite': book.favorite }"
        type="button"
        :aria-label="book.favorite ? 'Remove from favorites' : 'Add to favorites'"
        :aria-pressed="book.favorite"
        @click="emit('toggle-favorite', book.id)"
      >
        {{ book.favorite ? '♥' : '♡' }}
      </button>
    </div>
    <div class="book-info">
      <p class="book-year">{{ book.year || 'Year unknown' }}</p>
      <h3 :title="book.title">
        <RouterLink
          :to="bookRoute()"
        >{{ book.title }}</RouterLink>
      </h3>
      <p class="book-author">{{ book.author || 'Author unknown' }}</p>

      <div v-if="actions" class="book-personal-details">
        <div class="rating-control">
          <span class="personal-label">Your rating</span>
          <div class="rating-stars" role="group" :aria-label="`Rate ${book.title} from 1 to 5`">
            <button
              v-for="rating in ratingOptions"
              :key="rating"
              class="rating-star"
              :class="{ 'is-selected': book.rating >= rating }"
              type="button"
              :aria-label="`${rating} out of 5 stars`"
              :aria-pressed="book.rating === rating"
              @click="emit('set-rating', { id: book.id, rating })"
            >★</button>
            <button
              v-if="book.rating"
              class="clear-rating"
              type="button"
              aria-label="Clear rating"
              @click="emit('set-rating', { id: book.id, rating: null })"
            >Clear</button>
          </div>
        </div>
        <label class="personal-label" :for="`book-note-${book.id}`">Personal note</label>
        <textarea
          :id="`book-note-${book.id}`"
          v-model="noteDraft"
          class="book-note"
          maxlength="280"
          placeholder="Add a note about this book…"
          rows="3"
        />
        <div class="note-footer">
          <span>{{ noteDraft.length }}/280</span>
          <button
            class="button button-note"
            type="button"
            :disabled="noteDraft === (book.note || '')"
            @click="emit('save-note', { id: book.id, note: noteDraft.trim() })"
          >Save note</button>
        </div>
      </div>

      <button
        v-if="!actions && canAdd"
        class="button button-add"
        type="button"
        :disabled="inLibrary"
        @click="emit('add', book)"
      >
        <span>{{ inLibrary ? '✓' : '+' }}</span>
        {{ inLibrary ? 'In your library' : 'Add to library' }}
      </button>
      <div v-else-if="actions" class="card-actions">
        <button
          class="button button-read"
          :class="{ 'is-read': book.read }"
          type="button"
          @click="emit('toggle-read', book.id)"
        >
          {{ book.read ? '✓ Read' : 'Mark as read' }}
        </button>
        <button
          class="remove-button"
          type="button"
          :aria-label="`Remove ${book.title} from library`"
          @click="emit('remove', book.id)"
        >
          Remove
        </button>
      </div>
    </div>
  </article>
</template>
