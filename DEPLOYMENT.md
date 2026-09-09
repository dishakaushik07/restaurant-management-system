# Comprehensive Deployment Guide: Render & Vercel

This repository contains a full-stack restaurant management solution composed of three services:

| Component       | Technology                              | Target Platform | Folder Path                          |
| :-------------- | :-------------------------------------- | :-------------- | :----------------------------------- |
| **Frontend**    | Next.js 14 (React / TypeScript)         | **Vercel**      | `ramyaios-main/knos-temp`            |
| **Backend API** | Node.js / Express / Socket.io / MongoDB | **Render**      | `backend`                            |
| **ML Service**  | Python / FastAPI / Scikit-Learn         | **Render**      | `ramyaios-main/knos-temp/ml-service` |

---

## 1. Deploying Backend & ML Service to Render

### Option A: Automatic Blueprint Deployment (Recommended)

1. Push your code to your GitHub / GitLab repository.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](file:///c:/Users/dell/Downloads/ramyaios-main%20%281%29/render.yaml) and configure both services:
   - `ramya-backend` (Node.js Web Service)
   - `ramya-ml-service` (Python FastAPI Web Service)
6. For `ramya-backend`, fill in your production **`MONGODB_URI`** under environment variables.
7. Click **Apply**.

---

### Option B: Manual Web Service Deployment on Render

#### Deploying Express Backend (`ramya-backend`):

1. On Render Dashboard, click **New +** -> **Web Service**.
2. Connect your repository.
3. Configure the following fields:
   - **Name**: `ramya-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (or leave default assigned by Render)
   - `MONGODB_URI` = `<your_mongodb_atlas_connection_string>`
   - `JWT_SECRET` = `<your_secure_jwt_secret>`
5. Click **Create Web Service**.

#### Deploying ML Service (`ramya-ml-service`):

1. On Render Dashboard, click **New +** -> **Web Service**.
2. Connect your repository.
3. Configure the following fields:
   - **Name**: `ramya-ml-service`
   - **Root Directory**: `ramyaios-main/knos-temp/ml-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Click **Create Web Service**.

---

## 2. Deploying Next.js Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the Project Setup screen:
   - **Root Directory**: Select `ramyaios-main/knos-temp`
   - **Framework Preset**: `Next.js`
5. Configure Environment Variables:
   - `ML_SERVICE_URL`: `https://ramya-ml-service.onrender.com` (Your deployed Render ML URL)
   - `NEXT_PUBLIC_BACKEND_URL`: `https://ramya-backend.onrender.com` (Your deployed Render Backend URL)
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `knos-89c01.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `knos-89c01`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `knos-89c01.firebasestorage.app`
6. Click **Deploy**.

---

## 3. Local Development Verification

To run the full stack locally:

```bash
# Terminal 1: Node Backend
cd backend
npm install
npm run dev

# Terminal 2: Python ML Service
cd ramyaios-main/knos-temp/ml-service
python -m venv .venv
source .venv/bin/activate # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Terminal 3: Next.js Frontend
cd ramyaios-main/knos-temp
npm install
npm run dev
```
