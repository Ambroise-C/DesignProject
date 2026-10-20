# fieldnotes

A Vue 3 book discovery app with a personal reading library and favorites list, styled after the supplied Figma design. The source project is prepared for the GitHub repository `DesignProject`.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Features

- Search the Open Library catalog by title, author, or keyword.
- Visitors can search and view book details without an account.
- Sign in or create an account to add books, mark them as read, and manage favorites.
- Each account has its own library, saved in browser `localStorage`.
- Vue Router protects the library and favorites pages when signed out.
- The demo account is `test` with password `test`.

## Local-only authentication

Account records, the current session, and collections are saved in this browser's
`localStorage`. Passwords for created accounts are stored as salted PBKDF2 hashes;
the demo account has a precomputed hash. This is a classroom/demo feature only:
there is no server-side identity, and local browser storage does not provide
production-grade authentication or account security.

## Push to GitHub

Once the empty repository `Ambroise-C/DesignProject` has been created on GitHub,
push the prepared `main` branch with:

```sh
git push -u origin main
```
