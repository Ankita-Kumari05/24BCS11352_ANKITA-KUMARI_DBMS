# Complete Free Deployment Guide: Placement Management System

This guide shows you how to deploy this full-stack application **100% free** using:
1. **Database:** [Neon.tech](https://neon.tech) (Free PostgreSQL Cloud Database)
2. **Backend:** [Render.com](https://render.com) (Free Node.js Web Service)
3. **Frontend:** [Vercel](https://vercel.com) (Free React / Vite Hosting)

---

## 📋 Prerequisites: Push Code to GitHub

1. Initialize git and commit your files (from project root):
   ```bash
   cd /home/vishal/Documents/DBMS_Proj
   git init
   git add .
   git commit -m "Initial commit for deployment"
   ```
2. Create a new repository on [GitHub](https://github.com) (e.g. `placement-management-system`).
3. Push your repository:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

---

## 🗄️ Step 1: Create Free PostgreSQL Database on Neon.tech (2 minutes)

1. Go to **[Neon.tech](https://neon.tech)** and sign up / log in with GitHub (Free forever).
2. Click **Create Project**:
   - **Project Name:** `placement-system`
   - **Postgres version:** `16` (default)
   - Click **Create Project**.
3. On the dashboard, you will see your **Connection Details**.
4. Select **Connection string** format:
   It looks like:
   `postgresql://username:password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require`
5. **Copy this connection string**.

### Run Database Migration on Cloud Database:
You can initialize your tables, triggers, and predefined admin into Neon directly from your machine:
```bash
DATABASE_URL="your-neon-connection-string-here" node backend/src/db/migrate.js
```
*You will see `✅ Migration completed successfully!` and all tables/triggers will be active in the cloud database!*

---

## ⚙️ Step 2: Deploy Backend to Render.com (3 minutes)

1. Go to **[Render.com](https://render.com)** and sign in with GitHub (Free).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub repo.
4. Fill in the service configuration:
   - **Name:** `placement-backend` (or your choice)
   - **Region:** Closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Plan:** **Free**
5. Under **Environment Variables**, click **Add Environment Variable** and add:
   - `DATABASE_URL` = `your-neon-connection-string-here`
   - `JWT_SECRET` = `placement_jwt_secret_key_production_2026`
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**.
7. Once deployed, Render will give you a public URL (e.g. `https://placement-backend.onrender.com`).
   *Test it in your browser: `https://placement-backend.onrender.com/api/health` should return `{"status":"ok"}`!*

---

## 💻 Step 3: Deploy Frontend to Vercel (2 minutes)

1. Go to **[Vercel.com](https://vercel.com)** and sign in with GitHub (Free).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Project Name:** `placement-system` (or your choice)
   - **Framework Preset:** `Vite` (automatically detected)
   - **Root Directory:** Click **Edit** and select **`frontend`**
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
5. Under **Environment Variables**, add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend.onrender.com/api` *(use your Render backend URL from Step 2 followed by `/api`)*
6. Click **Deploy**.
7. In ~30 seconds, Vercel will give you a live production URL:
   👉 `https://your-app.vercel.app`!

---

## 🔑 Logging In to Your Deployed App

Open your live Vercel URL and sign in with your predefined administrator credentials:
- **Email:** `admin@gmail.com`
- **Password:** `admin`

From the Admin Dashboard, you can navigate to **Manage Admins** to authorize additional administrators, or register new students and recruiter company accounts!
