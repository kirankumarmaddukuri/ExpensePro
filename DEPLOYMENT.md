# Expense Tracker Deployment Guide

This guide is for deploying this project with the following setup:

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

It is written for the current repository structure and configuration.

## Stack Overview

- `frontend/` is a React 18 + Vite application
- `backend/` is a Spring Boot 3.2 + Java 17 application
- The backend connects to PostgreSQL
- The frontend talks to the backend through `VITE_API_BASE_URL`
- The backend allows frontend access through `CORS_ALLOWED_ORIGINS`

## Repository Structure

```text
expense-tracker/
|-- backend/
|   |-- src/main/java
|   |-- src/main/resources
|   |-- pom.xml
|   `-- Dockerfile
|-- frontend/
|   |-- src
|   |-- public
|   |-- package.json
|   |-- vercel.json
|   `-- netlify.toml
|-- README.md
`-- DEPLOYMENT.md
```

## Important Deployment Notes

- The frontend is already configured to read the API base URL from `VITE_API_BASE_URL`.
- The backend is already configured to read allowed frontend origins from `CORS_ALLOWED_ORIGINS`.
- The backend is already configured to read the hosting port from `PORT`.
- Vercel SPA routing support is already included with `frontend/vercel.json`.
- Netlify SPA routing support is also included, but this guide uses Vercel.

## Prerequisites

Before deploying, make sure you have:

- A GitHub account
- A Vercel account
- A Render account
- A Neon account
- Your project pushed to a GitHub repository

## Deployment Order

Deploy in this order:

1. Create the Neon database
2. Deploy the backend to Render
3. Deploy the frontend to Vercel
4. Update environment variables with the final public URLs if needed
5. Test registration, login, dashboard, and API calls

## 1. Deploy the Database on Neon

### Create the project

1. Sign in to Neon.
2. Create a new project.
3. Choose a project name such as `expense-tracker`.
4. Neon will create a database, role, and connection details for you.

### Save these values

You will need:

- `Host`
- `Database name`
- `Username`
- `Password`
- `Connection string`

### SSL requirement

Neon requires SSL. Use a JDBC URL with `sslmode=require`.

Example:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-xxxxxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

## 2. Deploy the Backend on Render

### Create a new Web Service

1. Sign in to Render.
2. Click `New +`.
3. Choose `Web Service`.
4. Connect your GitHub repository.
5. Select this repository.

### Render service settings

Use these values:

- Name: `expense-tracker-api`
- Root Directory: `backend`
- Runtime: `Docker`

Render will build the backend using the repository Dockerfile:

- `backend/Dockerfile`

You do not need to manually enter a build command or start command when using the Docker runtime.

### Backend Docker setup

This repository now includes:

- `backend/Dockerfile`
- `backend/.dockerignore`

The Docker image:

1. Builds the Spring Boot jar with Maven and Java 17
2. Copies the jar into a lightweight Java 17 runtime image
3. Starts the app with `java -jar app.jar`

If the backend version changes later and the jar name changes, update the jar filename inside `backend/Dockerfile`.

### Backend environment variables

Add these environment variables in Render:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_NEON_HOST/YOUR_NEON_DATABASE?sslmode=require
SPRING_DATASOURCE_USERNAME=YOUR_NEON_USERNAME
SPRING_DATASOURCE_PASSWORD=YOUR_NEON_PASSWORD
JWT_SECRET_KEY=YOUR_BASE64_SECRET
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
CORS_ALLOWED_ORIGINS=https://YOUR_VERCEL_APP_URL
```

### Generate a JWT secret

`JWT_SECRET_KEY` must be a Base64-encoded value. Use a strong secret.

Example PowerShell command:

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and use it as `JWT_SECRET_KEY`.

### Backend health check

After deployment, open your Render URL.

Examples:

- `https://your-render-service.onrender.com`
- `https://your-render-service.onrender.com/api/auth/login`

The root path may return a security response or 404 depending on controllers, which is fine. The important part is that the service is live and API endpoints respond.

### Expected backend behavior

- Render sets the `PORT` variable automatically
- Spring Boot uses that `PORT`
- PostgreSQL credentials come from Render environment variables
- CORS accepts the Vercel frontend origin you provide
- Render builds and starts the app from `backend/Dockerfile`

## 3. Deploy the Frontend on Vercel

### Import the project

1. Sign in to Vercel.
2. Click `Add New...`
3. Choose `Project`
4. Import your GitHub repository

### Vercel project settings

Use these values:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

### Frontend environment variable

Add this variable in Vercel:

```env
VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND_URL/api
```

Example:

```env
VITE_API_BASE_URL=https://expense-tracker-api.onrender.com/api
```

### SPA routing

This app uses React Router with `BrowserRouter`, so direct refreshes on routes like `/analytics` or `/transactions` require a rewrite rule.

That is already handled by:

- `frontend/vercel.json`

No extra Vercel routing setup is needed.

## 4. Connect Frontend and Backend

After both services are deployed:

1. Copy the final Vercel app URL
2. Set it in Render as `CORS_ALLOWED_ORIGINS`
3. Copy the final Render backend URL
4. Set it in Vercel as `VITE_API_BASE_URL`
5. Trigger a redeploy on both services if needed

Example final values:

```env
# Render
CORS_ALLOWED_ORIGINS=https://expense-tracker-frontend.vercel.app

# Vercel
VITE_API_BASE_URL=https://expense-tracker-api.onrender.com/api
```

## 5. Verification Checklist

After deployment, test the following:

1. Open the Vercel frontend URL
2. Register a new user
3. Log in with the new account
4. Open dashboard pages
5. Create a transaction
6. Load analytics
7. Refresh a nested route like `/transactions`

If all of those work, the deployment is successful.

## Local Build Verification

These commands were verified for this repository:

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
mvn -q -DskipTests compile
```

## Environment Variables Reference

### Backend

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_NEON_HOST/YOUR_NEON_DATABASE?sslmode=require
SPRING_DATASOURCE_USERNAME=YOUR_NEON_USERNAME
SPRING_DATASOURCE_PASSWORD=YOUR_NEON_PASSWORD
JWT_SECRET_KEY=YOUR_BASE64_SECRET
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
CORS_ALLOWED_ORIGINS=https://YOUR_VERCEL_APP_URL
```

### Frontend

```env
VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND_URL/api
```

## Common Issues and Fixes

### 1. CORS error in browser

Cause:

- `CORS_ALLOWED_ORIGINS` does not exactly match the deployed frontend URL

Fix:

- Set `CORS_ALLOWED_ORIGINS` to the exact Vercel domain
- Redeploy the backend

Example:

```env
CORS_ALLOWED_ORIGINS=https://expense-tracker-frontend.vercel.app
```

### 2. Frontend loads but API requests fail

Cause:

- `VITE_API_BASE_URL` is missing or incorrect

Fix:

- Set the exact Render backend URL including `/api`
- Redeploy the frontend

Correct example:

```env
VITE_API_BASE_URL=https://expense-tracker-api.onrender.com/api
```

### 3. Render app starts but cannot connect to Neon

Cause:

- Wrong JDBC URL
- Missing `sslmode=require`
- Wrong username or password

Fix:

- Copy the Neon connection details again
- Confirm the JDBC format is correct

Correct pattern:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://HOST/DATABASE?sslmode=require
```

### 4. Vercel route refresh returns 404

Cause:

- Missing rewrite configuration

Fix:

- Keep `frontend/vercel.json` in the repo
- Redeploy the frontend

### 5. First request to backend is slow

Cause:

- Render free instances may spin down when idle

Fix:

- This is expected behavior on free hosting
- The first request may take longer after inactivity

## Recommended Production Workflow

When you make updates later:

1. Push changes to GitHub
2. Render redeploys the backend
3. Vercel redeploys the frontend
4. Test the login flow and transaction flow again

## Quick Copy-Paste Setup

### Render

- Root Directory: `backend`
- Runtime: `Docker`
- Dockerfile: `backend/Dockerfile`

Environment variables:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_NEON_HOST/YOUR_NEON_DATABASE?sslmode=require
SPRING_DATASOURCE_USERNAME=YOUR_NEON_USERNAME
SPRING_DATASOURCE_PASSWORD=YOUR_NEON_PASSWORD
JWT_SECRET_KEY=YOUR_BASE64_SECRET
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
CORS_ALLOWED_ORIGINS=https://YOUR_VERCEL_APP_URL
```

### Vercel

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variable:

```env
VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND_URL/api
```

## Final Notes

- Keep `README.md` for the project overview
- Use this file only for deployment steps
- If you change your backend domain or frontend domain later, update both `CORS_ALLOWED_ORIGINS` and `VITE_API_BASE_URL`
- If you bump the backend version, confirm `backend/Dockerfile` still matches the built jar filename
