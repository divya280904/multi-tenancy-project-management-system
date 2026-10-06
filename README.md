# AppZex SaaS

AppZex is a multi-tenant agency project management SaaS with a Node.js/Express backend and a Next.js frontend. It supports agency operations, client portal access, task/milestone workflows, meetings, file management, dashboard analytics, and AI project assistant features.

## Stack

- Backend: Node.js, Express, Sequelize, MySQL
- Frontend: Next.js 16, React 19
- Auth: JWT + role-based access control + agency tenant enforcement
- AI: OpenAI-compatible provider via backend-only service layer

## Repository layout

- `backend/` — API server, models, migrations, seeders, and tests
- `frontend/` — Next.js app and UI pages

## Quick start

1. Copy the backend sample environment file:
   - `cp backend/.env.example backend/.env`
2. Update the values in `backend/.env` for your local MySQL instance and preferred AI provider.
3. Copy the frontend sample environment file:
   - `cp frontend/.env.example frontend/.env.local`
4. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
5. Run database migrations and seed data:
   - `cd backend && npx sequelize-cli db:migrate`
   - `cd backend && npx sequelize-cli db:seed:all`
6. Start the application:
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`

## Required environment variables

Backend variables in `backend/.env`:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `AI_PROVIDER`
- `AI_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `FRONTEND_URL`
- `APP_NAME`

Frontend variables in `frontend/.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:5000`

## Demo credentials

The seeded demo data includes agency and client users for local testing.

Agency login examples:

- Super Admin: `superadmin@appzex.com` / `password123`
- Agency Admin: `admin@demoagency.com` / `password123`
- Agency Team: `team@demoagency.com` / `password123`

Client login examples:

- Client User: `client@company.com` / `password123`

Use the seeded agency IDs and project IDs from the project database when validating multi-tenancy and portal permissions.

## Verification checklist

Before deployment or release validation, confirm:

- JWT secrets are kept out of version control.
- Database credentials match the target environment.
- AI credentials are set server-side only.
- Multi-tenant access control is enforced on agency and client routes.
- Migrations and seeders run cleanly on a fresh database.
- Backend test suite passes and the frontend builds successfully.

## Commands

Backend:

- `cd backend && npm test`
- `cd backend && npx jest --runInBand`
- `cd backend && npm run dev`

Frontend:

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `cd frontend && npm run dev`

## Notes

- Keep all AI requests server-side to avoid exposing provider keys or sensitive internal data to the browser.
- Ensure all new routes continue to enforce role and tenant boundaries before exposing project or meeting data.
- Do not commit real secrets, production credentials, or environment files tracked by `.gitignore`.
