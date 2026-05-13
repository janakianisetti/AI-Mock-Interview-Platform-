# InterviewAce AI

InterviewAce AI is a deploy-ready AI mock interview platform for placement preparation. It includes role-based interviews, resume-based questions, text and voice answers, AI scoring, HR feedback, and interview history.

## Tech Stack

- Frontend: React, Vite, CSS, Lucide icons
- Backend: Node.js, Express, JWT, Multer, MySQL
- AI: Gemini API with built-in fallback questions and scoring for demos
- Database: MySQL
- Deployment: Vercel/Netlify for frontend, Render/Railway for backend, Aiven/Railway/RDS for MySQL

## Features

- User signup and login
- Role selection for Java Developer, Data Analyst, and ML Engineer
- Difficulty selection
- Resume upload using PDF or TXT
- Resume-based question generation
- AI-generated interview questions
- Text answers
- Browser speech-to-text input where supported
- Answer scoring out of 100
- Strengths, improvements, ideal answer, and HR-style feedback
- Interview history dashboard
- Docker setup for local full-stack testing

## Folder Structure

```text
interviewace-ai/
  backend/
    database/schema.sql
    src/
      routes/
      services/
      middleware/
      server.js
  frontend/
    src/
      App.jsx
      api.js
      speech.js
      styles.css
  docker-compose.yml
  README.md
```

## Local Setup

1. Install Node.js 20 and MySQL 8.

2. Install dependencies:

```bash
npm install
```

3. Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

4. Create the frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

5. Create the database:

```bash
mysql -u root -p < backend/database/schema.sql
```

6. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend health check: `http://localhost:5000/health`

## Docker Setup

Create a `.env` file in the root if you want AI responses:

```env
GEMINI_API_KEY=your-key
```

Then run:

```bash
docker compose up --build
```

The app will be available at `http://localhost:5173`.

## Deployment

### Backend on Render or Railway

Set the backend root directory to:

```text
backend
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Environment variables:

```env
PORT=5000
CLIENT_URL=https://your-frontend-domain.vercel.app
DATABASE_HOST=your-mysql-host
DATABASE_PORT=3306
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=interviewace
JWT_SECRET=use-a-long-random-secret
GEMINI_API_KEY=your-gemini-api-key
AI_PROVIDER=gemini
```

### Frontend on Vercel or Netlify

Set the frontend root directory to:

```text
frontend
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment variable:

```env
VITE_API_URL=https://your-backend-domain.onrender.com
```

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/roles`
- `POST /api/resumes`
- `GET /api/resumes/latest`
- `POST /api/interviews/start`
- `POST /api/interviews/:interviewId/questions/:questionId/answer`
- `POST /api/interviews/:interviewId/complete`
- `GET /api/interviews/history`

## Notes for College Submission

This project is built with a reliable deployment shape: environment variables, protected routes, database persistence, rate limiting, API health check, Docker support, and fallback AI behavior. During viva or demo, the platform can still generate sample questions and feedback even if the AI API key is not configured.
