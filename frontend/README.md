# ☕ Coffee Drinker — Frontend (Next.js)

A Next.js 15 frontend for the Coffee Drinker API with authentication, dashboard, and profile management.

## 🚀 Setup

```bash
cd frontend
npm install
npm run dev    # starts on http://localhost:3001
```

Make sure the backend is running on `http://localhost:3000` first.

## 📄 Pages

| Route       | Description                                  |
| ----------- | -------------------------------------------- |
| `/`         | Home — dashboard with stats, log coffee form, favorites, recent activity |
| `/login`    | Login with email + password (JWT)            |
| `/register` | Register with full profile fields            |
| `/profile`  | View and edit your profile information       |

## ✨ Features

- **JWT authentication** stored in localStorage with auto-attach to API requests
- **Protected routes** — redirects to `/login` if not authenticated
- **Dashboard stats** — total cups, unique coffees, log entries
- **Log coffee** — pick from the coffee database and log cups
- **Favorites ranking** — your top 5 coffees by cup count
- **Recent activity** feed
- **Profile editing** — update name, email, age, gender, favourite coffee
- **Responsive design** — Tailwind CSS with a warm coffee theme

## 📁 Structure

```
frontend/src/
├── app/
│   ├── layout.js           # Root layout with AuthProvider
│   ├── page.js             # Home dashboard (protected)
│   ├── globals.css         # Tailwind + custom styles
│   ├── login/page.js       # Login page
│   ├── register/page.js    # Registration page
│   └── profile/page.js     # Profile view & edit (protected)
├── components/
│   ├── Providers.jsx       # AuthProvider + Navbar wrapper
│   ├── Navbar.jsx          # Top nav with auth-aware links
│   ├── ProtectedRoute.jsx  # Auth guard for pages
│   └── Input.jsx           # Reusable form input
├── context/
│   └── AuthContext.jsx     # Auth state (user, token, login, register, logout)
└── lib/
    └── api.js              # API client for all backend endpoints
```

## 🔗 Backend Connection

The frontend proxies `/api/*` to the Express backend via `next.config.js` rewrites.
Configure with `NEXT_PUBLIC_API_URL` in `.env.local` (defaults to `http://localhost:3000`).
