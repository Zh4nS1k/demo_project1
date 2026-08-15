# ☕ Coffee Drinker

A full-stack web app for tracking your daily coffee consumption, discovering coffees, and rating your favorites.

Built with **Express.js + MongoDB** (backend) and **Next.js 15 + Tailwind CSS** (frontend).

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI

---

## 🚀 Quick Start

```bash
# from the repo root
npm install               # root tooling (concurrently)
npm --prefix server install
cd server
cp .env.example .env     # Edit .env — set MONGODB_URI and JWT_SECRET
npm run seed              # Seed demo data
cd ..

npm run dev               # Starts API (:3000) + client (:3001) together
```

Open **http://localhost:3001** 🎉

Or run each side separately: `npm run dev:server` / `npm run dev:client`.

---

## 🌱 Seed Data

Run `npm run seed` on the backend to populate:

| | |
|---|---|
| **18 Coffees** | Espresso, Americano, Latte, Cappuccino, Macchiato, Mocha, Flat White, Cold Brew, Turkish Coffee, Iced Latte, Pour Over, Cortado, Affogato, Irish Coffee, Ristretto, Frappuccino, Doppio, Vietnamese Coffee |
| **5 Users** | See credentials below |
| **60 Day entries** | Random consumption logs with ratings, spread across 30 days |

### 🔑 Demo Credentials

| Username   | Password    | Email              | Role |
| ---------- | ----------- | ------------------ | ---- |
| `admin`    | `admin123`  | admin@coffee.dev   | Admin |
| `alice`    | `alice123`  | alice@example.com  | User |
| `bob`      | `bob123`    | bob@example.com    | User |
| `nina`     | `nina123`   | nina@example.com   | User |
| `carlos`   | `carlos123` | carlos@example.com | User |

Use `npm run seed:clean` to wipe all collections and re-seed from scratch.

---

## 📊 Data Models

### User
| Field             | Type   | Notes                              |
| ----------------- | ------ | ---------------------------------- |
| `id`              | ObjectId | Auto-generated                   |
| `username`        | String | Unique, 3–30 chars                 |
| `email`           | String | Unique, validated                  |
| `password`        | String | Hashed with bcrypt, min 6 chars    |
| `name`            | String | Defaults to username on register   |
| `age`             | Number | Optional, set via profile          |
| `gender`          | String | `male` / `female` / `other`        |
| `favourite_coffee`| String | Optional, set via profile          |

### Coffee
| Field          | Type   | Notes                                      |
| -------------- | ------ | ------------------------------------------ |
| `id`           | ObjectId | Auto-generated                           |
| `name`         | String | Unique, required                           |
| `taste`        | String | sweet, bitter, sour, nutty, chocolate, fruity, floral, caramel, spicy, earthy |
| `energy_boost` | Number | 1–10                                       |
| `milk`         | Number | 0 (no milk) or 1 (with milk)               |

### Day (Consumption Log)
| Field          | Type   | Notes                          |
| -------------- | ------ | ------------------------------ |
| `id`           | ObjectId | Auto-generated               |
| `date`         | Date   | Defaults to current date       |
| `username`     | String | References `User.username`     |
| `coffee_name`  | String | References `Coffee.name`       |
| `count_of_cups`| Number | Min 1, default 1               |
| `rating`       | Number | 0–5 stars, default 0           |

---

## 🔌 API Endpoints

### Auth & Users — `/api/users`

| Method | Route                          | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| POST   | `/api/users`                   | Register (username, email, password) |
| POST   | `/api/users/login`             | Login → returns JWT              |
| GET    | `/api/users`                   | Get all users (paginated)        |
| GET    | `/api/users/:id`               | Get user by ID                   |
| GET    | `/api/users/username/:username`| Get user by username             |
| PUT    | `/api/users/:id`               | Update user (name, age, gender, etc.) |
| DELETE | `/api/users/:id`               | Delete user                      |

### Coffees — `/api/coffees`

| Method | Route                   | Description                              |
| ------ | ---------------------- | ---------------------------------------- |
| POST   | `/api/coffees`         | Create a coffee                          |
| GET    | `/api/coffees`         | Get all (`?milk=0&;taste=bitter&;minEnergy=7`) |
| GET    | `/api/coffees/:id`     | Get coffee by ID                         |
| GET    | `/api/coffees/name/:name` | Get coffee by name                    |
| PUT    | `/api/coffees/:id`     | Update coffee                            |
| DELETE | `/api/coffees/:id`     | Delete coffee                            |

### Days — `/api/days`

| Method | Route                          | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| POST   | `/api/days`                    | Log coffee (username, coffee_name, cups, rating) |
| GET    | `/api/days`                    | Get all entries (`?username=&;coffee_name=&;from=&;to=`) |
| GET    | `/api/days/:id`                | Get entry by ID                          |
| GET    | `/api/days/user/:username`     | All entries for a user                   |
| GET    | `/api/days/summary/:username`  | User summary: totals, favorites, rating breakdown + streaks, most active weekday, 7/30-day caffeine trend |
| PUT    | `/api/days/:id`                | Update entry                             |
| DELETE | `/api/days/:id`                | Delete entry                             |

---

## 🖥️ Frontend Pages

| Route       | Description                                          |
| ----------- | ---------------------------------------------------- |
| `/`         | **Home** — hero image, dashboard stats, log coffee form with star rating, favorites ranking, rating breakdown, recent activity |
| `/login`    | **Login** — email + password                         |
| `/register` | **Register** — username, email, password only       |
| `/profile`  | **Profile** — view & edit name, age, gender, favourite coffee, email |

### Frontend Features

- 🔐 **JWT authentication** — token stored in localStorage, auto-attached to API requests
- 🛡️ **Protected routes** — Home and Profile redirect to `/login` if not authenticated
- 📸 **Hero image** — random coffee photo from Unsplash on each page load
- 📊 **Dashboard stats** — total cups, unique coffees, log entries, average rating
- ⭐ **Star rating** — interactive 0–5 star picker when logging coffee
- 🏆 **Favorites ranking** — top 5 coffees by cup count with average ratings
- 📈 **Rating breakdown** — bar chart showing distribution of your star ratings
- 📅 **Recent activity** — feed of your latest coffee logs with ratings
- ✏️ **Profile editing** — inline edit mode with save/cancel
- 📱 **Responsive** — Tailwind CSS, black/white/gray/brown palette

---

## 📁 Project Structure

```
demo_project1/
├── server/                      # Express.js + MongoDB API
│   ├── src/
│   │   ├── config/db.js         # MongoDB connection
│   │   ├── models/              # User, Coffee, Day schemas
│   │   ├── controllers/         # userController, coffeeController, dayController
│   │   ├── routes/              # userRoutes, coffeeRoutes, dayRoutes (+ validation)
│   │   ├── middleware/          # auth (JWT), validate, rateLimiters, errorHandler
│   │   ├── app.js               # Express app (importable by supertest)
│   │   ├── server.js            # Entry point (env, DB connect, listen)
│   │   ├── seed.js              # Demo data seeder
│   │   └── promote-admin.js     # Grant/revoke admin role
│   ├── tests/                   # Jest + Supertest (mongodb-memory-server)
│   ├── jest.config.js
│   ├── .env.example
│   └── package.json
├── client/                      # Next.js 15 App Router frontend
│   ├── src/
│   │   ├── app/                 # / (dashboard), /login, /register, /profile,
│   │   │                        # /admin, /coffees, /leaderboard, /users/[username]
│   │   ├── components/          # Navbar, ProtectedRoute, Input, StarRating, Stats
│   │   ├── context/AuthContext.jsx
│   │   └── lib/api.js           # API client (JWT-aware)
│   ├── next.config.js           # Rewrites /api/* → http://localhost:3000
│   └── package.json
├── package.json                 # Root scripts (concurrently runs both)
└── README.md
```

---

## 🧪 Example API Requests

### Register
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"newbie","email":"new@example.com","password":"secret"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alice123"}'
```

### Create a coffee
```bash
curl -X POST http://localhost:3000/api/coffees \
  -H "Content-Type: application/json" \
  -d '{"name":"Espresso","taste":"bitter","energy_boost":9,"milk":0}'
```

### Log a day with rating
```bash
curl -X POST http://localhost:3000/api/days \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","coffee_name":"Latte","count_of_cups":2,"rating":5}'
```

### Get user summary
```bash
curl http://localhost:3000/api/days/summary/alice
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Backend    | Express.js 4, Mongoose 8, bcryptjs, JSONWebToken |
| Frontend   | Next.js 15 (App Router), React 19              |
| Styling    | Tailwind CSS 4                                 |
| Database   | MongoDB (Mongoose ODM)                         |
| Auth       | JWT + bcrypt password hashing                  |

---

## 📜 Available Scripts

### Root (`demo_project1/`)
| Script                | Description                                    |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Run server + client together (concurrently)    |
| `npm run dev:server`  | Express dev server only (nodemon, :3000)       |
| `npm run dev:client`  | Next.js dev server only (:3001)                |
| `npm run build`       | Build the client for production                |
| `npm test`            | Run the backend test suite (Jest, in-memory DB) |
| `npm run seed`        | Seed database with demo data                   |
| `npm run seed:clean`  | Wipe collections & re-seed                     |
| `npm run promote-admin`| Promote a user to admin role                  |

Each side can also be driven directly inside `server/` and `client/` with their own scripts (`npm run dev`, `npm test`, …).

---

## 📄 License

MIT
