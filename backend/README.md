# InterviewAce Backend

Express API for authentication, resume parsing, AI-generated questions, answer evaluation, and interview history.

## Commands

```bash
npm install
npm run dev
npm start
```

## Required Environment

Copy `.env.example` to `.env` and update the values.

## Database

Run:

```bash
mysql -u root -p < database/schema.sql
```

## Health Check

```text
GET /health
```
