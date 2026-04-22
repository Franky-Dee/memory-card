# Memory Card

Memory Card is a social game-tracking and review platform built for video games. The goal is to help players log what they are playing, build a rich review history, follow other people with similar taste, and keep a polished personal archive of gaming experiences.

## Current foundation

This repository now includes a greenfield full-stack implementation foundation for the approved product direction:

- `frontend/` contains a Vite + React + TypeScript single-page app
- `backend/` contains a FastAPI backend structured for MongoDB-backed growth
- The product direction is **follow-based**, not mutual-friends-based
- The UI direction is dark grey + purple with a clean, premium feel

The current build now includes live frontend-to-backend flows for the first major product slice:

- Landing page
- Real login / signup requests against the FastAPI backend
- Authenticated feed-first app shell
- Discover page with live recommendation/discovery data
- Library page with live game search and add-to-library flow
- Review studio with searched game selection, 10-category scoring, draft-save, and publish flow
- Profile page backed by live stats, banners, followers/following panels, charts, lists, and review management
- Settings page with notifications, shareable profile identity, privacy, and profile customization controls
- Dedicated notifications panel
- Feed and review interactions with visible comments/reactions
- FastAPI routes for auth, dashboard/profile data, people search, game search/submission, library updates, follow actions, review drafts/publishing, list management, comments/reactions, and notifications

## Product highlights

The approved product scope includes:

- Fixed 10-category reviews scored out of 100
- Draft reviews before publishing
- Public-by-default profiles and reviews
- Rich profile customization with banner, featured lists, favorite games, and a shareable profile ID
- Follow model with a feed centered on major moments
- Replay tracking
- Manual total-hours tracking
- Discovery page, search, and QR/shareable-ID based identity
- Light recommendations for games and people
- Media attachments and yearly wrap-up planning

## Project structure

```text
memory-card/
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ data/
│  │  ├─ lib/
│  │  ├─ pages/
│  │  └─ styles/
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.ts
├─ backend/
│  ├─ app/
│  │  ├─ core/
│  │  ├─ models/
│  │  ├─ routers/
│  │  └─ services/
│  ├─ requirements.txt
│  └─ .env.example
└─ README.md
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend stores the authenticated demo session in local storage, but authentication itself now goes through the backend API. You can either create a new account through the UI or use the seeded demo account:

```text
Email: franc@example.com
Password: securepass123
```

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend currently starts in `DEMO_MODE=true` by default, which returns representative product data while the MongoDB-backed persistence layer is expanded. MongoDB configuration is already modeled through environment variables in `backend/.env.example`.

Copy `frontend/.env.example` if you want to point the SPA at a different API base URL.

If you want live IGDB search results instead of the built-in fallback catalog, set `IGDB_CLIENT_ID` and `IGDB_ACCESS_TOKEN` in `backend/.env`.

## Container setup

Basic container scaffolding is included for local orchestration and future deployment work:

```bash
docker compose up --build
```

That currently brings up:

- `mongo` on `27017`
- `backend` on `8000`
- `frontend` on `8080`

## Validation

The current repo has been validated with:

```bash
cd frontend
npm install
npm run build

cd ../backend
pip install -r requirements.txt
python -m unittest -v
```

## Immediate next build steps

1. Replace the in-memory demo store with MongoDB-backed persistence
2. Add real follow/unfollow mutation flows and social engagement actions
3. Expand review scoring into a full category editor instead of a draft-only studio
4. Add richer privacy controls, moderation workflows, and media upload storage
5. Expand discovery, recommendations, and yearly wrap-up features
