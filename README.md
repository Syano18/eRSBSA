# eRSBSA Frontend (Next.js)

Simple Next.js frontend for searching RSBSA records by full name and address.

Getting started

Install deps and run dev server:

```bash
npm install
npm run dev
```

Files added:
- `pages/index.js` - main search UI
- `components/SearchForm.js` - search form component (now separates `First`, `Middle Initial`, `Last`, and address into `Barangay`, `City`, `Province`)
- `components/ResultCard.js` - placeholder for results
- `styles/globals.css` - global styles + color palette

Next steps: wire the backend API to `pages/api/search` (not implemented yet).
