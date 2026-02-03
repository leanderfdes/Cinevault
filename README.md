# 🎬 CineVault: Premium Movie Discovery (Top 250 + Anime Top 50) 🍿✨

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel" />
  <img src="https://img.shields.io/badge/Backend-Node.js-3C873A?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-MongoDB-13aa52?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Queue-BullMQ-red?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/UI-Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" />
</p>

<p align="center">
  <b>A dark, ultra-premium movie browsing experience with background sync + enrichment.</b><br/>
  IMDb Top 250 built from IMDb datasets + Anime Top 50 (Japanese) curated from TMDB — with posters & descriptions enriched via a queue worker.
</p>

<p align="center">
  🔗 <a href="https://github.com/leanderfdes">GitHub</a> • 🌐 <a href="https://cinevault-ten.vercel.app/">Live Demo</a> • 🧠 <a href="#architecture">Architecture</a> • 🚀 <a href="#deployment">Deployment</a>
</p>

---

## ✨ Highlights

✅ **Two curated lists**
- 🏆 **IMDb Top 250** (built locally from IMDb public datasets)
- 🌸 **Anime Top 50 (Japanese)** (TMDB discover filters: `ja` + animation)

✅ **Queue-powered background enrichment**
- 🖼️ Poster enrichment from TMDB  
- 📝 Overview/description enrichment from TMDB  
- 🔁 Runs safely in batches (rate-limited + concurrency controls)

✅ **Premium UI / UX**
- 🌑 Dark theme, glow accents, micro-interactions  
- 🎞️ Smooth page transitions & modal animations (Framer Motion)  
- 🔎 Pagination + sorted-by-rating view

✅ **Clean API**
- 🧩 List filtering via `?list=top250|animeTop50`
- ⭐ Sort endpoints via `/movies/sorted?by=rating&order=desc`

---

## 🧠 Architecture

```txt
┌──────────────┐          ┌──────────────┐
│   Frontend   │  HTTP    │    Backend   │
│  (React UI)  ├─────────►│ (Express API) │
└──────┬───────┘          └──────┬───────┘
       │                          │
       │                          │ enqueue jobs
       │                          ▼
       │                    ┌──────────┐
       │                    │  BullMQ  │
       │                    │  (Redis) │
       │                    └────┬─────┘
       │                         │
       │                         ▼
       │                  ┌─────────────┐
       │                  │   Worker     │
       │                  │ Sync/Enrich  │
       │                  └────┬────────┘
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Vercel     │        │   MongoDB     │
│ (Frontend)   │        │   Atlas       │
└──────────────┘        └──────────────┘

```

🛠️ **Tech Stack
Frontend** 🎨

⚛️ React + React Router

⚡ Vite

🧠 React Query

🎞️ Framer Motion

🎨 Tailwind CSS

**Backend** 🧩

🟩 Node.js + Express

🧬 MongoDB (Mongoose)

🔐 JWT Auth (Login/Register)

**Worker + Queue** 🧵

🧰 BullMQ (jobs)

🧠 Redis (queue + storage)

🎬 IMDb Datasets (Top 250 builder)

🍿 TMDB API (posters + overview)


🚀 **Getting Started** (Local Dev)
1) Clone
```
git clone https://github.com/leanderfdes/Cinevault.git
cd Cinevault
```

🔐 **Environment Variables**
✅ Frontend (client/.env)
```
VITE_API_URL=http://localhost:5000
GITHUB_URL=https://github.com/leanderfdes
```

✅ **Backend** (server/.env)
```
PORT=5000
MONGO_URI=__YOUR_MONGO_URI__
JWT_SECRET=__YOUR_SECRET__
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://127.0.0.1:6379
TMDB_API_KEY=__YOUR_TMDB_KEY__
TMDB_IMAGE_SIZE=w500
```

✅ **Worker** (worker/.env)
```
MONGO_URI=__YOUR_MONGO_URI__
REDIS_URL=redis://127.0.0.1:6379
TOP250_MIN_VOTES=25000
IMDB_DATA_DIR=./data
TMDB_API_KEY=__YOUR_TMDB_KEY__
TMDB_IMAGE_SIZE=w500
```

▶️ **Run Locally** (3 terminals)
Terminal 1 - Redis
redis-server

Terminal 2 - Backend
```
cd server
npm install
npm run dev
```

Terminal 3 - Worker
```
cd worker
npm install
npm run dev
```

Terminal 4 - Frontend
```
cd client
npm install
npm run dev
```


Now open:

🌐 Frontend: http://localhost:5173

🧪 API Health: http://localhost:5000/health

🧵 **Queue Jobs** (What the Worker Handles)

🎯 *Sync lists*

syncTop250 → builds Top 250 from IMDb datasets

syncAnimeTop50 → fetches curated Anime Top 50 from TMDB

🖼️ *Enrich posters*

enrichPosters → fills missing posterUrl

📝 *Enrich descriptions*

enrichDescriptions → fills missing description

🧩 **Roadmap**

✅ Done:

✅ List sync via worker + queue

✅ Posters + descriptions enrichment

✅ Premium UI + animations

🚧 **Next:**

🔍 Advanced filters (genre/year/runtime)

🧾 Watchlist + favorites

👤 Admin dashboard for job monitoring

📊 Basic analytics (popular titles, trending)

enrichDescriptions → fills missing description
