# 🚀 Railway Live Cloud Deployment Guide

This guide walks you through deploying **Installment Guard** (Backend Server, PostgreSQL Database, and React Admin Web Panel) to [Railway.app](https://railway.app).

---

## 🌟 Recommended Deployment Approaches

| Method | Description | Best For |
| :--- | :--- | :--- |
| **Option A: 1-Click Unified Fullstack (Easiest)** | Deploys backend + admin panel together on 1 single Railway service + 1 PostgreSQL database. Single domain, no CORS hassle. | Fast setup & low cost |
| **Option B: Two Separate Services** | Deploys Backend on Service 1 and Admin Panel on Service 2 (or Vercel / Netlify). | Scalable microservice setups |

---

## 🛠️ Step-by-Step Instructions (Option A: 1-Click Unified Fullstack)

### Step 1: Push Code to GitHub
Ensure all latest files are committed and pushed to your repository:
```bash
git add .
git commit -m "feat: add database auth, railway deployment configuration and dynamic API base URL"
git push origin main
```

---

### Step 2: Create a New Project on Railway
1. Go to [Railway.app](https://railway.app) and sign in with your GitHub account.
2. Click **"+ New Project"** -> Select **"Deploy from GitHub repo"**.
3. Choose your **`instalment-guard`** repository.

---

### Step 3: Add PostgreSQL Database Plugin
1. In your Railway project canvas, click **"+ New"** -> Select **"Database"** -> **"Add PostgreSQL"**.
2. Railway will provision a dedicated PostgreSQL database container and automatically create `DATABASE_URL`.

---

### Step 4: Configure Environment Variables
Click on your web service card -> Navigate to the **"Variables"** tab -> Add the following variables:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` *(or click "Reference Variable" and pick `DATABASE_URL`)* | Connects Node.js to Railway PostgreSQL |
| `DB_DIALECT` | `postgres` | Uses Sequelize PostgreSQL driver |
| `JWT_SECRET` | `your_long_secure_random_production_secret_key_2026` | Signs and verifies user authentication tokens |
| `NODE_ENV` | `production` | Enables production optimizations & static asset serving |

*(Note: Railway automatically assigns the `PORT` variable — you do not need to configure it).*

---

### Step 5: Configure Build & Start Settings
In your web service card -> Navigate to the **"Settings"** tab:
- **Build Command**: `npm run build` *(Already automated in root `package.json`)*
- **Start Command**: `npm start`
- **Root Directory**: `/` *(Leave as root)*

---

### Step 6: Generate Public Domain
1. In **"Settings"** -> Scroll to the **"Networking / Public Networking"** section.
2. Click **"Generate Domain"** (e.g. `installment-guard-production.up.railway.app`).
3. Open the generated domain in your browser — your **Live Admin Web Panel** will open immediately!

---

## 📱 Step 7: Update Mobile Flutter App for Live Server

In your Flutter app (`lib/services/backend/nodejs_backend_service.dart` or `app_constants.dart`), change the base URL from `localhost:5000` to your Railway live domain:

```dart
// Change from:
static const String baseUrl = 'http://10.0.2.2:5000/api';

// To your live Railway domain:
static const String baseUrl = 'https://installment-guard-production.up.railway.app/api';
```

---

## 🔑 Live Default Super Admin Login

Once deployed, you can immediately log into the live Admin Panel using the pre-seeded credentials:

- **Login URL**: `https://your-app-domain.up.railway.app`
- **Super Admin Email**: `admin@installmentguard.com`
- **Password**: `Admin@12345`
