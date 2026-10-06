# AppZex SaaS — Multi-Tenant Project Management Platform

A full-stack **multi-tenant project management SaaS platform** built for agencies, agency teams, clients, and platform administrators.

AppZex provides separate dashboards and role-based access for managing agencies, teams, clients, projects, tasks, and project collaboration from a centralized platform.

## 🚀 Live Demo

**Frontend:**  
https://multi-tenancy-project-management-sy.vercel.app/

**Backend API:**  
https://multi-tenancy-project-management-system.onrender.com/

> The backend is hosted on Render and may take a few moments to wake up after a period of inactivity.

---

## 🔐 Demo Credentials

All demo accounts use the following password:

```text
password123
```

### Super Admin

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@appzex.com` | `password123` |

### Demo Agency

| Role | Email | Password |
|---|---|---|
| Agency Admin | `admin@demoagency.com` | `password123` |
| Agency Team | `team@demoagency.com` | `password123` |
| Client | `client@company.com` | `password123` |

### Northstar Agency

| Role | Email | Password |
|---|---|---|
| Agency Admin | `admin@northstaragency.com` | `password123` |
| Team Member | `team1@northstaragency.com` | `password123` |
| Team Member | `team2@northstaragency.com` | `password123` |
| Client | `client@northstar.com` | `password123` |

### Brightlane Agency

| Role | Email | Password |
|---|---|---|
| Agency Admin | `admin@brightlaneagency.com` | `password123` |
| Team Member | `team1@brightlaneagency.com` | `password123` |
| Team Member | `team2@brightlaneagency.com` | `password123` |
| Client | `client@brightlane.com` | `password123` |

> **Note:** These credentials are for demonstration purposes only. Do not use these credentials in a production environment.

---

## ✨ Features

### 🔑 Authentication & Authorization

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- Session/token-based authentication
- Automatic role-based dashboard redirection

### 👑 Super Admin

- Manage multiple agencies
- View and manage agency accounts
- Monitor platform-level data
- Access agency information
- Impersonate agency users for support/administration

### 🏢 Agency Management

- Agency dashboard
- Agency profile management
- Client management
- Project management
- Team management
- Role-based agency access

### 👥 Team Management

- View agency team members
- Manage team information
- Assign team members to projects
- Access project-related information according to permissions

### 🤝 Client Portal

- Dedicated client dashboard
- View assigned projects
- View project details
- Access project-related information
- Separate client-facing experience

### 📊 Project Management

- Create and manage projects
- Project details and status
- Agency-client project relationships
- Team/project associations
- Role-based project access

### 🏗️ Multi-Tenancy

The platform is designed around multiple independent agencies.

Each agency has its own:

- Team members
- Clients
- Projects
- Data relationships
- Access permissions

This ensures that users can access only the data relevant to their organization and assigned role.

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 16**
- React
- JavaScript
- Tailwind CSS
- Axios
- Next.js Router

### Backend

- Node.js
- Express.js
- Sequelize ORM
- REST APIs
- JWT Authentication
- bcryptjs
- Multer
- Helmet
- CORS

### Database

- MySQL
- Sequelize ORM
- Sequelize CLI
- Database migrations
- Database seeders

### Deployment

- **Vercel** — Frontend
- **Render** — Backend
- **Aiven** — MySQL Database

---

## 📁 Project Structure

```text
appzex/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── app/
│   ├── public/
│   ├── styles/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   │
│   ├── migrations/
│   ├── seeders/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## 🔄 Application Architecture

```text
                    ┌──────────────────────┐
                    │      Next.js         │
                    │      Frontend        │
                    │       Vercel         │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │    Node.js +         │
                    │    Express.js        │
                    │       Render         │
                    └──────────┬───────────┘
                               │
                               │ Sequelize
                               ▼
                    ┌──────────────────────┐
                    │        MySQL         │
                    │       Aiven          │
                    └──────────────────────┘
```

---

## 🔐 Authentication Flow

1. User enters email and password.
2. Frontend sends credentials to the backend.
3. Backend validates the user.
4. Password is verified using bcrypt.
5. Backend generates a JWT.
6. Frontend stores the authentication token.
7. Protected API requests send the JWT using the `Authorization` header.
8. Users are redirected according to their role.

Example:

```text
SUPER_ADMIN  → /admin
AGENCY_ADMIN → /agency
AGENCY_TEAM  → /agency
CLIENT       → /client-portal
```

---

## 🌐 API Configuration

The frontend uses the following environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For production:

```env
NEXT_PUBLIC_API_URL=https://multi-tenancy-project-management-system.onrender.com
```

The production API URL should **not** contain a trailing slash.

---

## ⚙️ Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/divya280904/multi-tenancy-project-management-system
cd appzex
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=appzex_saas
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

AI_PROVIDER=openrouter
AI_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

FRONTEND_URL=http://localhost:3000
APP_NAME=AppZex
```

### 3. Run Database Migrations

```bash
npx sequelize-cli db:migrate
```

### 4. Seed Demo Data

```bash
npx sequelize-cli db:seed:all
```

The seed creates:

- Demo agencies
- Demo clients
- Super admin
- Agency administrators
- Agency team members
- Client users

All seeded demo users use:

```text
password123
```

### 5. Start Backend

```bash
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

---

## 💻 Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create the local environment file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

Frontend will run on:

```text
http://localhost:3000
```

---

## 📦 Production Build

### Frontend

```bash
npm run build
```

### Backend

```bash
npm start
```

---

## 🗄️ Database Management

Sequelize CLI is used for database management.

### Check migration status

```bash
npx sequelize-cli db:migrate:status
```

### Run migrations

```bash
npx sequelize-cli db:migrate
```

### Undo the latest migration

```bash
npx sequelize-cli db:migrate:undo
```

### Undo all migrations

```bash
npx sequelize-cli db:migrate:undo:all
```

### Seed demo data

```bash
npx sequelize-cli db:seed:all
```

---

## 🔒 Environment Variables

Sensitive environment variables should never be committed to GitHub.

The project uses:

```text
.env
.env.local
.env.production
```

and these files should remain ignored by Git.

Only non-sensitive example configuration should be included in:

```text
.env.example
```

### Frontend

```env
NEXT_PUBLIC_API_URL=
```

### Backend

```env
PORT=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=

AI_PROVIDER=
AI_MODEL=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=

FRONTEND_URL=
APP_NAME=
```

---

## 🧪 Demo User Roles

The seeded application demonstrates four primary roles:

```text
SUPER_ADMIN
     │
     ├── Manage Agencies
     │
     ▼
AGENCY_ADMIN
     │
     ├── Manage Clients
     ├── Manage Projects
     └── Manage Team
          │
          ▼
      AGENCY_TEAM

CLIENT
     │
     └── Client Portal
```

This makes it possible to test the application's multi-tenant and role-based access behavior using the demo accounts above.

---

## 🌍 Deployment

### Frontend — Vercel

The Next.js frontend is deployed on Vercel.

Production environment variable:

```env
NEXT_PUBLIC_API_URL=https://multi-tenancy-project-management-system.onrender.com
```

### Backend — Render

The Express backend is deployed on Render.

Production environment variable:

```env
FRONTEND_URL=https://multi-tenancy-project-management-sy.vercel.app
```

### Database — Aiven

The production MySQL database is hosted on Aiven and connected to the Render backend through environment variables.

---

## 📌 Key Technical Highlights

- Multi-tenant SaaS architecture
- Role-based access control
- JWT authentication
- Secure password hashing
- RESTful API architecture
- Sequelize ORM
- MySQL relational database
- Database migrations and seeders
- Protected API routes
- Client-specific portal
- Agency-specific data isolation
- Next.js frontend
- Cloud deployment using Vercel and Render

---

## 🔮 Future Improvements

Potential future enhancements include:

- Real-time notifications
- Advanced project analytics
- Task comments and activity feeds
- File/document management
- Email notifications
- Subscription and billing management
- Audit logs
- Advanced reporting
- Automated AI-powered project insights
- Improved search and filtering
- Production-grade monitoring and logging

---

## 👩‍💻 Author

**Divya Gupta**

B.Tech Computer Engineering  
Full Stack Developer — React.js | Node.js | Express.js