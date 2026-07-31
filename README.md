# TokTickIT - IT Service Desk Application

TokTickIT is an IT service desk application designed to manage and resolve Account and Access, Hardware, Software, and Network requests.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Bootstrap (Port `5180`)
- **Backend:** Node.js + Express + TypeScript (Port `5080`)
- **Database:** PostgreSQL (Docker, Port `15432`) + Prisma ORM
- **Testing:** Vitest + Supertest

## Project Structure

```
toktickit/
├── client/              # React frontend (Vite)
├── server/              # Express backend
│   ├── prisma/          # Prisma schema & migrations
│   ├── src/             # Server source code
│   └── tests/
│         └── lab-01/    # Lab 1 test files
├── docs/
│   └── lab-01/
│         ├── ai_use.md
│         └── reviewer.md
├── docker-compose.yml   # PostgreSQL database container
├── .env.example         # Environment variable template
├── .gitignore
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Getting Started

### 1. Start the Database

```bash
cp .env.example .env      # Copy environment variables (only needed once)
docker compose up -d
```

This starts a PostgreSQL container on port `15432` with:
- **User:** `root`
- **Password:** `root`
- **Database:** `toktickit`

If port `15432` is already in use on your machine, set `DB_PORT` in the root `.env` to a free port instead, and update `DATABASE_URL` in `server/.env` to match.

### 2. Set up the Backend

```bash
cd server
cp .env.example .env      # Copy environment variables
npm install               # Install dependencies
npx prisma migrate dev    # Run database migrations
npm run dev               # Start the dev server on port 5080
```

### 3. Set up the Frontend

```bash
cd client
npm install               # Install dependencies
npm run dev               # Start the dev server on port 5180
```

### 4. Open the Application

Navigate to [http://localhost:5180](http://localhost:5180) in your browser.

## Running Tests

### Backend Tests (Supertest)

```bash
cd server
npm run test
```

### Frontend Tests (Vitest)

```bash
cd client
npm run test
```

## Port Configuration

| Service    | Port  |
| ---------- | ----- |
| Frontend   | 5180  |
| Backend    | 5080  |
| PostgreSQL | 15432 |
