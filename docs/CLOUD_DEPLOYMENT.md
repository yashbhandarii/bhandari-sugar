# Environment Variables Documentation

To successfully deploy and run the Bhandari Sugar application in the cloud, ensure the following environment variables are set.

## Frontend (Vercel)
Set these in the Vercel Project Settings > Environment Variables:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | Base URL of the backend API | `https://bhandari-backend.onrender.com/api` |
| `REACT_APP_SUPABASE_URL` | URL of your Supabase project | `https://xyz.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous public key | `eyJhbGciOiJIUzI1NiIsInR...` |

## Backend (Render)
Set these in the Render Dashboard > Environment:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for signing auth tokens | `your-secret-key-here` |
| `PORT` | Port for the web server | `5000` |
| `NODE_ENV` | Environment mode | `production` |
