# fieldnotes

**fieldnotes** est une application web de découverte et de gestion de livres. Elle permet de rechercher des ouvrages, de consulter leurs informations, puis, après connexion, de créer une bibliothèque personnelle et une liste de favoris.

L’interface s’inspire de la maquette Figma fournie : fond couleur papier, typographie à empattements et présentation des livres sous forme d’étagère.

## Fonctionnalités

- Recherche de livres par titre, auteur ou mot-clé.
- Affichage des couvertures, titres, auteurs et années de publication.
- Consultation d’une fiche livre sans compte.
- Création de compte et connexion locale.
- Ajout et suppression de livres dans sa bibliothèque.
- Marquage des livres comme lus ou non lus.
- Gestion des favoris.
- Pages bibliothèque et favoris réservées aux utilisateurs connectés.
- Mémorisation de la session et des données dans le navigateur.

Le compte de démonstration est **`test`**, avec le mot de passe **`test`**.

## Technologies utilisées

- **Vue 3** : composants d’interface avec Composition API et composants `.vue`.
- **Vite** : serveur de développement et génération de la version de production.
- **Vue Router** : navigation entre les pages et protection des routes privées.
- **Vuex 4** : état centralisé des comptes, de la session et de la bibliothèque.
- **Open Library Search API** : recherche des livres ; les couvertures proviennent du service Open Library Covers.
- **Web Storage API (`localStorage`)** : sauvegarde locale des comptes, de la session et des collections.
- **Web Crypto API** : hachage PBKDF2 salé des mots de passe créés dans l’application.
- **CSS** : mise en page adaptative et styles inspirés de la maquette.

## Organisation du code

```text
src/
├── components/
│   └── BookCard.vue       # Carte réutilisée pour présenter et gérer un livre
├── router/
│   └── index.js           # Routes publiques et routes protégées
├── store/
│   └── index.js           # État Vuex, comptes et persistance locale
├── views/
│   ├── SearchView.vue     # Recherche Open Library
│   ├── ReviewView.vue     # Fiche détaillée d’un livre
│   ├── LoginView.vue      # Connexion et création de compte
│   ├── LibraryView.vue    # Bibliothèque personnelle
│   └── FavoritesView.vue  # Livres favoris
├── App.vue                # Structure générale et navigation
├── main.js                # Initialisation de Vue, Vuex et Vue Router
└── style.css              # Styles globaux et responsive
```

## Installation et lancement

Prérequis : Node.js et npm.

```sh
npm install
npm run dev
```

Vite affiche ensuite l’adresse locale à ouvrir dans le navigateur.

Créer et prévisualiser une version de production :

```sh
npm run build
npm run preview
```

## Données et sécurité

Les données sont conservées dans le stockage local du navigateur sous les clés `fieldnotes-accounts`, `fieldnotes-session` et `fieldnotes-libraries`. Chaque compte dispose de sa propre bibliothèque sur cet appareil.

Cette authentification est uniquement destinée à une démonstration ou à un exercice. Elle ne repose pas sur un serveur : `localStorage` peut être consulté ou modifié par la personne qui utilise le navigateur, et les comptes ne sont pas partagés entre appareils. Pour une mise en production, il faudrait utiliser un service d’authentification et un stockage côté serveur.
