# Student Records — DELSU Abraka

A student profile manager (CRUD, search/filter, form validation, toast
notifications) built for Delta State University, Abraka, Delta State,
Nigeria. React + Vite + Tailwind CSS.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview   # to preview the production build locally
```

The production build is written to `dist/`, which you can deploy to any
static host (Vercel, Netlify, GitHub Pages, etc).

## Project structure

```
student-profiles-app/
├── index.html            entry HTML
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx           React root
    ├── App.jsx            the student records app (all CRUD logic + UI)
    └── index.css          Tailwind entry point
```

## Notes

- Data lives in React state only — refreshing the page resets it to the
  three seeded profiles. Wire it up to a backend or `localStorage` if you
  need it to persist.
- Brand colors (deep green / gold) are applied as inline styles in
  `App.jsx` rather than Tailwind arbitrary-value classes, so they render
  correctly wherever this is deployed.
