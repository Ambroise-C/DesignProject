# Campers

**Campers** is a web application for discovering and organizing books. Users can search for books and view their details. After signing in, they can build a personal library and manage a list of favorites.

The interface is inspired by the provided Figma design, with a paper-like background, serif typography, and a bookshelf-style book layout.

## Features

- Search for books by title, author, or keyword.
- Refresh search results and load additional results.
- Discover a book chosen at random on the Random book page.
- Filter search results by language, genre, and minimum average rating, or hide books already in the library.
- View book covers, titles, authors, and publication years.
- View book details, including the average community rating when available.
- Discover books based on authors and related subjects, excluding the book currently being viewed.
- Create an account and sign in locally.
- Add books to and remove books from a personal library.
- Mark books as read or unread, and filter the library by reading status.
- Search the personal library, sort books by title, year, or date added, and load more results.
- Rate books and add personal notes.
- Manage favorite books.
- Switch between light and dark themes; the selected theme is saved in the browser.
- Access the library and favorites pages while signed in.
- Persist sessions and data in the browser.

The demo account uses **`test`** as both the username and password.

## Technologies

- **Vue 3**: UI components built with the Composition API and `.vue` single-file components.
- **Vite**: Development server and production build tooling.
- **Vue Router**: Client-side navigation and route protection.
- **Vuex 4**: Centralized state management for accounts, sessions, and libraries.
- **Open Library Search API**: Book search and metadata. Covers are provided by Open Library Covers.
- **Web Storage API (`localStorage`)**: Local persistence for accounts, sessions, and collections.
- **Web Crypto API**: Salted PBKDF2 password hashing for accounts created in the application.
- **CSS**: Responsive layout and styling inspired by the Figma design.

## Project structure

```text
src/
├── components/
│   └── BookCard.vue       # Reusable book card and library actions
├── router/
│   └── index.js           # Public and protected routes
├── store/
│   └── index.js           # Vuex state, accounts, and local persistence
├── views/
│   ├── SearchView.vue     # Open Library search and book discovery
│   ├── RandomBookView.vue # Random book discovery
│   ├── ReviewView.vue     # Book details
│   ├── LoginView.vue      # Sign-in and account creation
│   ├── LibraryView.vue    # Personal library
│   └── FavoritesView.vue  # Favorite books
├── App.vue                # Application shell and navigation
├── main.js                # Vue, Vuex, and Vue Router initialization
└── style.css              # Global and responsive styles
```

## Installation and development

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Vite will display the local URL to open in your browser.

To build and preview a production version:

```sh
npm run build
npm run preview
```

## Data and security

Data is stored in the browser's local storage under the keys `fieldnotes-accounts`, `fieldnotes-session`, and `fieldnotes-libraries`. Each account has its own library on that device.

This authentication system is intended for demos and educational projects only. It does not use a server: anyone using the browser can inspect or modify `localStorage`, and accounts are not shared across devices. A production application should use a server-side authentication service and data store.

## External links

- [Figma design](https://www.figma.com/design/WKusoDcT2y6DUhGpVwg3pq/Untitled?node-id=0-1&t=VlWsRuQWBI4Bz4gH-1)

## Persona

Lilia is a young adult who loves reading all kinds of books. She especially enjoys reading at the library with an iced coffee. She likes discovering new genres, authors, and titles, but can get overwhelmed by all the options. She sometimes gets frustrated when she forgets a book she wanted to read or one she has already finished.

We want to help Lilia feel at ease with **Campers**, where she can keep track of everything she discovers and quickly find the books she is looking for.
